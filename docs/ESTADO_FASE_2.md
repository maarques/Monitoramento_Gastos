# Estado da Fase 2 — Domínio e Testes

Data de início: 2026-06-29

## Objetivo

Deixar as regras financeiras confiáveis, explícitas e cobertas por testes.

## Entregas da Fase 2

- [x] Modelos `Income`, `Expense`, `Workbook` e `FinancialSummary`.
- [x] Serviço de cálculo financeiro no backend.
- [ ] Testes unitários de parsing, escrita e resumo.
- [ ] Testes de API para CRUD principal.
- [ ] Fixtures Excel.

## Critérios de Aceite

- [ ] Testes cobrem criação, edição, exclusão, categoria, receita e salvamento.
- [ ] Cálculos exibidos no dashboard batem com os cálculos do backend.
- [ ] Erros de payload retornam mensagens estruturadas.

## Decisões

- A primeira implementação da Fase 2 será uma camada de domínio/cálculo pura, sem depender de Flask, Pandas ou openpyxl.
- A regra financeira inicial será compatível com a interface atual:
  - `Receita Total`: soma de todas as receitas.
  - `Fatura do Cartão`: soma dos lançamentos com `forma_pagamento == "Crédito"`.
  - `Saldo em Conta`: receitas menos lançamentos que não são crédito.
  - Totais consideram todos os lançamentos, independentemente de `pago`, preservando o comportamento atual.
- Testes serão escritos para rodar com `unittest` e também serem compatíveis com `pytest`.
- Testes que dependem de Flask/Pandas/openpyxl serão adicionados gradualmente, quando o ambiente tiver dependências instaladas.

## Log de Implementação

### 2026-06-29 — Preparação

- Criado este documento de estado para acompanhar progresso, decisões e próximos passos.
- Fase 2 iniciada a partir do estado final da Fase 1.

### 2026-06-29 — Pacote 1: domínio financeiro e testes base

- Adicionados modelos `FinancialSummary` e `Workbook` em `app/models.py`.
- Criado `app/finance.py` com serviço puro `calculate_financial_summary`.
- Regra financeira centralizada no backend preservando o comportamento atual da UI:
  - receitas somadas em `receita_total`;
  - crédito separado em `fatura_cartao`;
  - débito/Pix/dinheiro somados em `total_debito`;
  - `saldo_em_conta = receita_total - total_debito`.
- Adicionado endpoint `GET /api/summary?file=<arquivo>` em `app/routes.py`.
- Dashboard agora recebe `summary` e `window.APP_SUMMARY` para permitir convergência futura entre UI e backend.
- Adicionado `tests/test_finance.py` com testes unitários puros para resumo, métodos de pagamento e serialização de `Workbook`.
- Adicionado `tests/test_api.py` com testes preparados para CRUD principal e endpoint de resumo; ficam marcados como skipped enquanto Flask não estiver instalado.
- Adicionado `tests/test_services.py` com testes preparados para validação de arquivo e receitas; ficam marcados como skipped enquanto Werkzeug não estiver instalado.
- Adicionado `pyproject.toml` com configuração inicial de `pytest` e `ruff`.
- Adicionado `pytest>=8.0` em `requirements.txt`.
- Validações executadas:
  - `python -m unittest discover -s tests -v`: 10 testes descobertos, 4 passaram e 6 foram skipped por dependências ausentes (`flask`/`werkzeug`).
  - `python -m compileall app run.py tests`: sucesso.
  - `node --check static/js/app.js`: sucesso.
  - `python -m pytest`: não executou porque `pytest` ainda não está instalado no Python empacotado do Codex.

## Próximo Passo

Instalar as dependências do projeto em um ambiente local/venv e rodar `python -m pytest`; depois implementar fixtures Excel e testes de parsing/escrita/salvamento com Pandas/openpyxl.
