import unittest

from app.finance import calculate_financial_summary, normalize_payment_method
from app.models import FinancialSummary, Workbook


class FinancialSummaryTests(unittest.TestCase):
    def test_calculates_summary_with_credit_separated_from_account_balance(self):
        expenses_by_category = {
            "Casa": [
                {"nome": "Aluguel", "valor": 1200, "forma_pagamento": "Débito"},
                {"nome": "Energia", "valor": "180.50", "forma_pagamento": "Pix"},
            ],
            "Mercado": [
                {"nome": "Compra mensal", "valor": 650, "forma_pagamento": "Crédito"},
            ],
        }
        incomes = [
            {"nome": "Salário", "valor": 5000},
            {"nome": "Freelance", "valor": "750.25"},
        ]

        summary = calculate_financial_summary(expenses_by_category, incomes)

        self.assertIsInstance(summary, FinancialSummary)
        self.assertEqual(summary.receita_total, 5750.25)
        self.assertEqual(summary.total_debito, 1380.5)
        self.assertEqual(summary.fatura_cartao, 650.0)
        self.assertEqual(summary.saldo_em_conta, 4369.75)
        self.assertEqual(summary.total_por_categoria["Casa"], 1380.5)
        self.assertEqual(summary.total_por_categoria["Mercado"], 650.0)
        self.assertEqual(summary.total_por_forma_pagamento["Débito"], 1200.0)
        self.assertEqual(summary.total_por_forma_pagamento["Pix"], 180.5)
        self.assertEqual(summary.total_por_forma_pagamento["Crédito"], 650.0)

    def test_handles_empty_or_invalid_values_as_zero(self):
        summary = calculate_financial_summary(
            {"Geral": [{"valor": "abc", "forma_pagamento": None}]},
            [{"valor": None}],
        )

        self.assertEqual(summary.receita_total, 0.0)
        self.assertEqual(summary.total_debito, 0.0)
        self.assertEqual(summary.fatura_cartao, 0.0)
        self.assertEqual(summary.saldo_em_conta, 0.0)
        self.assertEqual(summary.total_por_categoria["Geral"], 0.0)
        self.assertEqual(summary.total_por_forma_pagamento["Débito"], 0.0)

    def test_workbook_serializes_expenses_and_incomes(self):
        workbook = Workbook(
            expenses_by_category={"Casa": [{"id": "g1", "valor": 10}]},
            incomes=[{"id": "r1", "valor": 100}],
        )

        self.assertEqual(
            workbook.to_dict(),
            {
                "expenses_by_category": {"Casa": [{"id": "g1", "valor": 10}]},
                "incomes": [{"id": "r1", "valor": 100}],
            },
        )

    def test_normalizes_empty_payment_method_to_debit(self):
        self.assertEqual(normalize_payment_method(""), "Débito")
        self.assertEqual(normalize_payment_method(None), "Débito")
        self.assertEqual(normalize_payment_method(" Pix "), "Pix")


if __name__ == "__main__":
    unittest.main()
