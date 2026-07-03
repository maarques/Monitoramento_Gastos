import pandas as pd
from pathlib import Path
from .utils import generate_id, safe_filename
from .models import Expense, Income
import shutil
from datetime import datetime

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
DATA_DIR_RESOLVED = DATA_DIR.resolve()
ALLOWED_EXTENSIONS = {".xlsx"}
INCOME_SHEET_NAME = "Receitas"

_struct_cache = {}
_income_cache = {}

def normalize_workbook_filename(filename):
    if not filename:
        raise ValueError("Nome de arquivo não fornecido")

    safe_name = safe_filename(filename)
    if not safe_name:
        raise ValueError("Nome de arquivo inválido")

    if Path(safe_name).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError("Apenas arquivos .xlsx são permitidos")

    return safe_name

def workbook_path(filename):
    safe_name = normalize_workbook_filename(filename)
    path = (DATA_DIR / safe_name).resolve()

    if DATA_DIR_RESOLVED not in path.parents and path != DATA_DIR_RESOLVED:
        raise ValueError("Caminho de arquivo inválido")

    return path

def list_spreadsheets():
    return [p.name for p in DATA_DIR.glob("*.xlsx")]

def save_uploaded_file(file_storage):
    filename = normalize_workbook_filename(file_storage.filename)
    dest = workbook_path(filename)
    file_storage.save(dest)

    try:
        pd.ExcelFile(dest)
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise ValueError("Arquivo .xlsx inválido") from exc

    _struct_cache.pop(filename, None)
    _income_cache.pop(filename, None)
    return filename

def parse_float(value, default=0.0):
    try:
        return float(value) if pd.notna(value) else default
    except Exception:
        return default

def parse_income_rows(df):
    rows = []
    col_map = {str(c).lower(): c for c in df.columns}

    def get_col(row, *choices, default=None):
        for choice in choices:
            if choice and choice.lower() in col_map:
                return row[col_map[choice.lower()]]
        return default

    for _, row in df.iterrows():
        nome = get_col(row, "nome", "descricao", "descrição", "description", default="")
        valor = get_col(row, "valor", "amount", "price", default=0.0)
        id_val = get_col(row, "id", default=generate_id())

        if not id_val or pd.isna(id_val):
            id_val = generate_id()

        income = Income(
            id=str(id_val),
            nome=str(nome) if pd.notna(nome) else "",
            valor=parse_float(valor),
        )
        rows.append(income.to_dict())

    return rows

def normalize_income_rows(rows):
    normalized = []
    for row in rows or []:
        income_id = row.get("id") or generate_id()
        normalized.append(
            Income(
                id=str(income_id),
                nome=str(row.get("nome") or ""),
                valor=parse_float(row.get("valor")),
            ).to_dict()
        )
    return normalized

def read_excel_to_structure(filename):
    if not filename:
        return {}

    try:
        path = workbook_path(filename)
    except ValueError:
        return {}

    if not path.exists():
        return {}

    try:
        sheets = pd.read_excel(path, sheet_name=None)
    except Exception as e:
        print("Erro ao ler Excel:", e)
        return {}

    structure = {}
    incomes = []
    for sheet_name, df in sheets.items():
        if str(sheet_name).strip().lower() == INCOME_SHEET_NAME.lower():
            incomes = parse_income_rows(df)
            continue

        rows = []
        col_map = {c.lower(): c for c in df.columns}
        for _, r in df.iterrows():
            def get_col(*choices, default=None):
                for ch in choices:
                    if ch and ch.lower() in col_map:
                        return r[col_map[ch.lower()]]
                return default

            nome = get_col("nome", "descricao", "descrição", "description", "")
            valor = get_col("valor", "amount", "price", 0.0)
            pago = get_col("pago", "paid", False)
            data = get_col("data", "data_pagamento", "date", "")
            obs = get_col("observacoes", "obs", "observação", "")
            forma_pagamento = get_col("forma_pagamento", "forma de pagamento", "pagamento", default="Débito")

            try:
                valor_f = float(valor) if pd.notna(valor) else 0.0
            except Exception:
                valor_f = 0.0

            pago_b = False
            if isinstance(pago, (bool,)):
                pago_b = pago
            else:
                strp = str(pago).strip().lower()
                pago_b = strp in ("sim", "s", "yes", "y", "true", "1")

            data_str = None
            if pd.notna(data):
                if isinstance(data, (datetime, pd.Timestamp)):
                    data_str = data.strftime('%d/%m/%Y')
                else:
                    try:
                        parsed_date = pd.to_datetime(str(data))
                        data_str = parsed_date.strftime('%d/%m/%Y')
                    except (ValueError, TypeError):
                        data_str = str(data)
            
            id_val = get_col("id", default=generate_id())
            if not id_val or pd.isna(id_val):
                id_val = generate_id()

            gasto = Expense(
                id=str(id_val),
                nome=str(nome) if not pd.isna(nome) else "",
                valor=valor_f,
                pago=bool(pago_b),
                data=data_str,
                forma_pagamento=str(forma_pagamento) if not pd.isna(forma_pagamento) else "Débito",
                obs=str(obs) if not pd.isna(obs) else ""
            )
            rows.append(gasto.to_dict())
        structure[sheet_name] = rows

    _struct_cache[filename] = structure
    _income_cache[filename] = incomes
    return structure

def get_structure(filename):
    s = _struct_cache.get(filename)
    if s is None:
        s = read_excel_to_structure(filename)
    return s or {}

def get_incomes(filename):
    if not filename:
        return []

    try:
        filename = normalize_workbook_filename(filename)
    except ValueError:
        return []

    incomes = _income_cache.get(filename)
    if incomes is None:
        read_excel_to_structure(filename)
        incomes = _income_cache.get(filename)

    return incomes or []

def update_row(payload):
    fn = payload.get("file")
    if not fn:
        return False
    try:
        fn = normalize_workbook_filename(fn)
    except ValueError:
        return False

    cat = payload.get("category")
    rid = payload.get("id")
    field = payload.get("field")
    value = payload.get("value")

    if not (cat and rid and field):
        return False
    
    struct = get_structure(fn)

    if field == "category":
        new_cat = value
        if cat not in struct or new_cat not in struct:
            return False
        
        row_to_move = None
        original_index = -1
        for i, row in enumerate(struct[cat]):
            if str(row.get("id")) == str(rid):
                original_index = i
                break
        
        if original_index != -1:
            row_to_move = struct[cat].pop(original_index)
            struct[new_cat].append(row_to_move)
            _struct_cache[fn] = struct
            return True
        return False

    if cat not in struct:
        return False

    changed = False
    for i, row in enumerate(struct[cat]):
        if str(row.get("id")) == str(rid):
            if field == "valor":
                try:
                    row["valor"] = float(value)
                except Exception:
                    return False
            elif field == "pago":
                row["pago"] = bool(value)
            else:
                row[field] = value
            struct[cat][i] = row
            changed = True
            break

    if changed:
        _struct_cache[fn] = struct
    return changed

def add_row(payload):
    fn = payload.get("file")
    if fn:
        try:
            fn = normalize_workbook_filename(fn)
        except ValueError:
            return None

    cat = payload.get("category") or "Default"
    row = payload.get("row") or {}
    
    struct = get_structure(fn)
    if cat not in struct:
        struct[cat] = []

    new_gasto = {
        "id": generate_id(),
        "nome": row.get("nome", ""),
        "valor": float(row.get("valor") or 0.0),
        "pago": bool(row.get("pago") or False),
        "data": row.get("data") or None,
        "forma_pagamento": row.get("forma_pagamento", "Débito"),
        "obs": row.get("obs") or ""
    }
    struct[cat].append(new_gasto)
    _struct_cache[fn] = struct
    return new_gasto

def delete_row(payload):
    fn = payload.get("file")
    if not fn: return False
    try:
        fn = normalize_workbook_filename(fn)
    except ValueError:
        return False

    cat = payload.get("category")
    rid = payload.get("id")
    if not (cat and rid):
        return False

    struct = get_structure(fn)
    if cat not in struct:
        return False

    new_list = [r for r in struct[cat] if str(r.get("id")) != str(rid)]
    if len(new_list) == len(struct[cat]):
        return False
    struct[cat] = new_list
    _struct_cache[fn] = struct
    return True

def delete_category(file, category):
    try:
        file = normalize_workbook_filename(file)
    except ValueError:
        return False

    struct = get_structure(file)
    if category in struct:
        del struct[category]
        _struct_cache[file] = struct
        return True
    return False

def save_structure_to_excel(source_filename, target_filename, incomes=None):
    source_key = None
    if source_filename:
        try:
            source_key = normalize_workbook_filename(source_filename)
        except ValueError:
            return False

    struct = get_structure(source_key)
    if incomes is None:
        incomes = get_incomes(source_key)
    else:
        incomes = normalize_income_rows(incomes)
    
    try:
        safe_target_filename = normalize_workbook_filename(target_filename)
        path = workbook_path(safe_target_filename)
    except ValueError:
        return False

    if path.exists():
        bak = DATA_DIR / f"{path.name}.bak.{datetime.now().strftime('%Y%m%d%H%M%S')}"
        shutil.copy(path, bak)

    try:
        with pd.ExcelWriter(path, engine="openpyxl") as writer:
            for sheet, rows in struct.items():
                df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["id", "nome", "valor", "pago", "data", "forma_pagamento", "obs"])
                sheet_name = str(sheet)[:31]
                df.to_excel(writer, sheet_name=sheet_name, index=False)

            income_df = pd.DataFrame(incomes) if incomes else pd.DataFrame(columns=["id", "nome", "valor"])
            income_df.to_excel(writer, sheet_name=INCOME_SHEET_NAME, index=False)

    except Exception as e:
        print("Erro salvando excel:", e)
        return False

    _struct_cache[safe_target_filename] = struct
    _income_cache[safe_target_filename] = incomes
    return True
