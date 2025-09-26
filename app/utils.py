import uuid
from datetime import datetime

def generate_id():
    return uuid.uuid4().hex

def format_brl(valor: float) -> str:
    # formata em R$ 1.234,56
    s = f"{valor:,.2f}"
    # troca separadores para estilo BR (milhar: . ; decimal: ,)
    return "R$ " + s.replace(",", "X").replace(".", ",").replace("X", ".")
