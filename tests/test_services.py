import unittest

try:
    from app import services
except ModuleNotFoundError as exc:
    services = None
    MISSING_DEPENDENCY = exc
else:
    MISSING_DEPENDENCY = None


@unittest.skipIf(services is None, f"Dependência ausente: {MISSING_DEPENDENCY}")
class ServiceValidationTests(unittest.TestCase):
    def test_normalizes_valid_xlsx_filename(self):
        self.assertEqual(services.normalize_workbook_filename("meus gastos.xlsx"), "meus_gastos.xlsx")

    def test_rejects_non_xlsx_filename(self):
        with self.assertRaises(ValueError):
            services.normalize_workbook_filename("gastos.csv")

    def test_rejects_empty_filename(self):
        with self.assertRaises(ValueError):
            services.normalize_workbook_filename("")

    def test_normalizes_income_rows(self):
        rows = services.normalize_income_rows(
            [
                {"id": "r1", "nome": "Salário", "valor": "2500.50"},
                {"nome": "Extra", "valor": None},
            ]
        )

        self.assertEqual(rows[0], {"id": "r1", "nome": "Salário", "valor": 2500.5})
        self.assertTrue(rows[1]["id"])
        self.assertEqual(rows[1]["nome"], "Extra")
        self.assertEqual(rows[1]["valor"], 0.0)


if __name__ == "__main__":
    unittest.main()
