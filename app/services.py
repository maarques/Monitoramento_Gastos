import pandas as pd
from pathlib import Path
from .utils import generate_id, safe_filename
from .models import Expense
import shutil
from datetime import datetime
import os
import json

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

_struct_cache = {}

def list_spreadsheets():
    return [p.name for p in DATA_DIR.glob("*.xlsx")]

def save_uploaded_file(file_storage):
    filename = safe_filename(file_storage.filename)
    dest = DATA_DIR / filename
    file_storage.save(dest)
    _struct_cache.pop(filename, None)
    return filename

def read_excel_to_structure(filename):
    if not filename:
        return {}

    path = DATA_DIR / filename
    if not path.exists():
        return {}

    try:
        sheets = pd.read_excel(path, sheet_name=None)
    except Exception as e:
        print("Erro ao ler Excel:", e)
        return {}

    structure = {}
    for sheet_name, df in sheets.items():
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

            id_val = None
            if "id" in col_map:
                id_val = r[col_map["id"]]
            if not id_val or (pd.isna(id_val)):
                id_val = generate_id()

            gasto = Expense(
                id=str(id_val),
                nome=str(nome) if not pd.isna(nome) else "",
                valor=valor_f,
                pago=bool(pago_b),
                data=str(data) if not pd.isna(data) else None,
                obs=str(obs) if not pd.isna(obs) else None
            )
            rows.append(gasto.to_dict())
        structure[sheet_name] = rows

    _struct_cache[filename] = structure
    return structure

def get_structure(filename):
    s = _struct_cache.get(filename)
    if s is None:
        s = read_excel_to_structure(filename)
    return s or {}

def update_row(payload):
    fn = payload.get("file")
    cat = payload.get("category")
    rid = payload.get("id")
    field = payload.get("field")
    value = payload.get("value")

    if not (fn and cat and rid and field):
        return False

    struct = get_structure(fn)
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
                if isinstance(value, bool):
                    row["pago"] = value
                else:
                    row["pago"] = str(value).strip().lower() in ("true", "1", "sim", "s", "yes")
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
    cat = payload.get("category") or "Default"
    row = payload.get("row") or {}
    if not fn:
        return False

    struct = get_structure(fn)
    if cat not in struct:
        struct[cat] = []

    new_gasto = {
        "id": generate_id(),
        "nome": row.get("nome", ""),
        "valor": float(row.get("valor") or 0.0),
        "pago": bool(row.get("pago") or False),
        "data": row.get("data") or None,
        "obs": row.get("obs") or ""
    }
    struct[cat].append(new_gasto)
    _struct_cache[fn] = struct
    return new_gasto

def delete_row(payload):
    fn = payload.get("file")
    cat = payload.get("category")
    rid = payload.get("id")
    if not (fn and cat and rid):
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
    struct = get_structure(file)
    if category in struct:
        del struct[category]
        _struct_cache[file] = struct
        return True
    return False

def save_structure_to_excel(filename):
    struct = get_structure(filename)
    if not struct:
        struct = read_excel_to_structure(filename)
        if not struct:
            return False

    path = DATA_DIR / filename
    if path.exists():
        bak = DATA_DIR / f"{path.name}.bak.{datetime.now().strftime('%Y%m%d%H%M%S')}"
        shutil.copy(path, bak)

    try:
        with pd.ExcelWriter(path, engine="openpyxl") as writer:
            for sheet, rows in struct.items():
                if not rows:
                    df = pd.DataFrame(columns=["nome", "valor", "pago", "data", "obs"])
                else:
                    df = pd.DataFrame(rows)
                    if "id" in df.columns:
                        df = df.drop(columns=["id"])
                sheet_name = str(sheet)[:31]
                df.to_excel(writer, sheet_name=sheet_name, index=False)

        downloads_dir = os.path.join(os.path.expanduser("~"), "Downloads")
        os.makedirs(downloads_dir, exist_ok=True)
        downloads_path = os.path.join(downloads_dir, filename)
        with pd.ExcelWriter(downloads_path, engine="openpyxl") as writer:
            for sheet, rows in struct.items():
                if not rows:
                    df = pd.DataFrame(columns=["nome", "valor", "pago", "data", "obs"])
                else:
                    df = pd.DataFrame(rows)
                    if "id" in df.columns:
                        df = df.drop(columns=["id"])
                sheet_name = str(sheet)[:31]
                df.to_excel(writer, sheet_name=sheet_name, index=False)

    except Exception as e:
        print("Erro salvando excel:", e)
        return False

    return True
