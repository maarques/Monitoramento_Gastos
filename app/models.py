from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class Expense:
    id: str
    nome: str
    valor: float
    pago: bool
    data: Optional[str] = None
    forma_pagamento: Optional[str] = "Débito"
    obs: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "valor": self.valor,
            "pago": self.pago,
            "data": self.data,
            "forma_pagamento": self.forma_pagamento,
            "obs": self.obs
        }


@dataclass
class Income:
    id: str
    nome: str
    valor: float

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "valor": self.valor
        }


@dataclass
class FinancialSummary:
    receita_total: float
    total_debito: float
    fatura_cartao: float
    saldo_em_conta: float
    total_por_categoria: Dict[str, float]
    total_por_forma_pagamento: Dict[str, float]

    def to_dict(self):
        return {
            "receita_total": self.receita_total,
            "total_debito": self.total_debito,
            "fatura_cartao": self.fatura_cartao,
            "saldo_em_conta": self.saldo_em_conta,
            "total_por_categoria": self.total_por_categoria,
            "total_por_forma_pagamento": self.total_por_forma_pagamento,
        }


@dataclass
class Workbook:
    expenses_by_category: Dict[str, List[dict]]
    incomes: List[dict]

    def to_dict(self):
        return {
            "expenses_by_category": self.expenses_by_category,
            "incomes": self.incomes,
        }
