# app/utils.py
import uuid
from werkzeug.utils import secure_filename
import locale

def generate_id():
    return uuid.uuid4().hex

def safe_filename(name: str) -> str:
    return secure_filename(name)

def format_brl(valor: float) -> str:
    # tenta formatar no estilo brasileiro. fallback simples se locale não configurado.
    try:
        locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
        return locale.currency(float(valor), grouping=True)
    except Exception:
        s = f"{valor:,.2f}"
        return "R$ " + s.replace(",", "X").replace(".", ",").replace("X", ".")
