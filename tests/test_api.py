import unittest

try:
    from app.app import create_app
    from app import services
except ModuleNotFoundError as exc:
    create_app = None
    services = None
    MISSING_DEPENDENCY = exc
else:
    MISSING_DEPENDENCY = None


@unittest.skipIf(create_app is None, f"Dependência ausente: {MISSING_DEPENDENCY}")
class ApiCrudTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        services._struct_cache["api_test.xlsx"] = {
            "Casa": [
                {
                    "id": "g1",
                    "nome": "Luz",
                    "valor": 100.0,
                    "pago": False,
                    "data": "01/06/2026",
                    "forma_pagamento": "Pix",
                    "obs": "",
                }
            ]
        }
        services._income_cache["api_test.xlsx"] = [
            {"id": "r1", "nome": "Salário", "valor": 1000.0}
        ]

    def tearDown(self):
        services._struct_cache.pop("api_test.xlsx", None)
        services._income_cache.pop("api_test.xlsx", None)

    def test_add_update_delete_expense_flow(self):
        add_response = self.client.post(
            "/api/add_row",
            json={
                "file": "api_test.xlsx",
                "category": "Casa",
                "row": {"nome": "Água", "valor": 50, "forma_pagamento": "Débito"},
            },
        )
        self.assertEqual(add_response.status_code, 200)
        added = add_response.get_json()["row"]
        self.assertEqual(added["nome"], "Água")

        update_response = self.client.post(
            "/api/update_row",
            json={
                "file": "api_test.xlsx",
                "category": "Casa",
                "id": added["id"],
                "field": "valor",
                "value": 75,
            },
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertTrue(update_response.get_json()["ok"])

        delete_response = self.client.post(
            "/api/delete_row",
            json={"file": "api_test.xlsx", "category": "Casa", "id": added["id"]},
        )
        self.assertEqual(delete_response.status_code, 200)
        self.assertTrue(delete_response.get_json()["ok"])

    def test_summary_endpoint_uses_backend_financial_rules(self):
        response = self.client.get("/api/summary?file=api_test.xlsx")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["summary"]["receita_total"], 1000.0)
        self.assertEqual(payload["summary"]["saldo_em_conta"], 900.0)


if __name__ == "__main__":
    unittest.main()
