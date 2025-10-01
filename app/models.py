from dataclasses import dataclass
from typing import Optional

@dataclass
class Expense:
    id: str
    nome: str
    valor: float
    pago: bool
    data: Optional[str] = None
    obs: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "valor": self.valor,
            "pago": self.pago,
            "data": self.data,
            "obs": self.obs
        }
