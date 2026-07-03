# Estado da Fase 1 — Fundação Segura

Data de início: 2026-06-29

## Objetivo

Estabilizar dados e segurança sem mudar radicalmente a interface atual.

## Entregas da Fase 1

- [x] Validação de arquivo em todas as entradas.
- [x] Upload seguro de `.xlsx`.
- [x] Endpoint de download.
- [x] Remoção de gravação automática em Downloads.
- [x] Receitas persistidas na planilha.
- [x] `debug` controlado por ambiente.
- [x] Correção dos pontos de XSS mais evidentes.

## Critérios de Aceite

- [ ] Uma planilha nova com receitas e despesas pode ser salva, recarregada e manter todos os dados.
- [x] Nenhum endpoint aceita caminho fora de `data/`.
- [x] Dados digitados pelo usuário não executam HTML/JS na tela.
- [x] O usuário consegue baixar o arquivo por rota própria.

## Decisões

- A aba especial para receitas será chamada `Receitas`.
- `localStorage` ficará reservado para preferências de UI, como tema.
- O salvamento deve gravar somente em `data/`; download será feito por endpoint próprio.
- Mudanças serão feitas em incrementos pequenos, registradas neste arquivo ao final de cada implementação.

## Log de Implementação

### 2026-06-29 — Preparação

- Criado este documento de estado para acompanhar progresso, decisões e próximos passos.
- Fase 1 priorizada conforme `docs/ESCOPO_MELHORIA_GERAL.md`.

### 2026-06-29 — Pacote 1: arquivos, download e debug

- Adicionada validação centralizada de nomes de planilha em `app/services.py`.
- Bloqueado uso de arquivos fora de `data/` por resolução segura de caminho.
- Upload agora aceita apenas arquivos `.xlsx` válidos pelo backend.
- Upload também tenta abrir o arquivo com Pandas antes de aceitar, removendo o arquivo se o conteúdo for inválido.
- Removidos prints de debug e imports não usados em `app/routes.py`.
- Criado endpoint `GET /download/<file>` para baixar planilhas salvas.
- `POST /api/save` agora retorna `download_url` quando salva com sucesso.
- Removida gravação automática em `~/Downloads`; salvamento fica restrito a `data/`.
- `run.py` passou a controlar `debug` por `FLASK_DEBUG`.
- Validação executada: `python -m compileall app run.py` com sucesso usando o Python empacotado do Codex.

### 2026-06-29 — Pacote 2: receitas persistidas e XSS evidente

- Criado modelo `Income` em `app/models.py`.
- Adicionada aba especial `Receitas` no fluxo de leitura/escrita de Excel em `app/services.py`.
- `read_excel_to_structure` agora ignora a aba `Receitas` como categoria de despesa.
- `api_add_row`/`services.add_row` passaram a validar o nome da planilha quando editam arquivo existente.
- `get_incomes` carrega receitas salvas no Excel para o dashboard.
- `POST /api/save` recebe `incomes` e grava esses dados na aba `Receitas`.
- `templates/base.html` expõe `window.APP_INCOMES` com dados vindos do backend.
- `static/js/app.js` deixou de usar `localStorage` para receitas; `localStorage` permanece apenas para tema.
- Renderização da lista de receitas passou a usar `textContent`.
- Campos livres interpolados dinamicamente em lançamentos/categorias receberam escape HTML.
- Adicionado link “Baixar Planilha” na tela quando há arquivo aberto.
- Validações executadas:
  - `python -m compileall app run.py` com sucesso.
  - `node --check static/js/app.js` com sucesso.
- Validação funcional de leitura/escrita com `services.py` não pôde rodar neste ambiente porque as dependências do app (`werkzeug`, e possivelmente as de `requirements.txt`) não estão instaladas no Python empacotado do Codex.

## Próximo Passo

Instalar/ativar dependências do projeto e validar manualmente o critério restante: criar planilha nova com receitas e despesas, salvar, reabrir e confirmar que tudo permanece.
