from .models import FinancialSummary


CREDIT_PAYMENT_LABEL = "Crédito"


def _as_float(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def normalize_payment_method(value):
    return str(value or "Débito").strip() or "Débito"


def calculate_financial_summary(expenses_by_category, incomes):
    receita_total = sum(_as_float(income.get("valor")) for income in incomes or [])
    total_debito = 0.0
    fatura_cartao = 0.0
    total_por_categoria = {}
    total_por_forma_pagamento = {}

    for category, expenses in (expenses_by_category or {}).items():
        category_total = 0.0

        for expense in expenses or []:
            valor = _as_float(expense.get("valor"))
            forma_pagamento = normalize_payment_method(expense.get("forma_pagamento"))

            category_total += valor
            total_por_forma_pagamento[forma_pagamento] = (
                total_por_forma_pagamento.get(forma_pagamento, 0.0) + valor
            )

            if forma_pagamento == CREDIT_PAYMENT_LABEL:
                fatura_cartao += valor
            else:
                total_debito += valor

        total_por_categoria[str(category)] = category_total

    return FinancialSummary(
        receita_total=receita_total,
        total_debito=total_debito,
        fatura_cartao=fatura_cartao,
        saldo_em_conta=receita_total - total_debito,
        total_por_categoria=total_por_categoria,
        total_por_forma_pagamento=total_por_forma_pagamento,
    )
