from dataclasses import dataclass
from typing import Optional
from datetime import date

@dataclass
class Expense:
    id: str
    descricao: str
    valor: float
    pago: bool
    data_pagamento: Optional[date] = None
    observacoes: Optional[str] = None
