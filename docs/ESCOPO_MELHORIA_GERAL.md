# Escopo de Melhoria Geral — Painel Financeiro

## 1. Diagnóstico Geral

O projeto já entrega uma aplicação funcional para controle financeiro pessoal via planilhas Excel. A base é simples, direta e adequada para um MVP: Flask no backend, templates Jinja2, JavaScript vanilla no frontend e Pandas/openpyxl para leitura e escrita de arquivos `.xlsx`.

O principal ponto de atenção é que a aplicação cresceu além do protótipo inicial sem uma separação clara entre domínio financeiro, persistência, API e interface. Hoje há lógica importante distribuída entre backend, cache em memória, DOM e `localStorage`, o que cria riscos de perda de dados, inconsistência entre tela e planilha, dificuldade de testar e manutenção mais cara.

## 2. O Que Está Bom

### Produto

- Fluxo principal claro: criar planilha, subir Excel, adicionar lançamentos, editar, apagar, salvar e baixar.
- Uso de categorias por abas da planilha, uma decisão simples e intuitiva para o usuário.
- Suporte a diferentes formas de pagamento: débito, crédito, Pix e dinheiro.
- Resumo financeiro útil com receita total, saldo em conta, fatura do cartão e total por categoria.
- Experiência local amigável, inclusive com abertura automática do navegador via `run.py`.

### Código

- Estrutura inicial bem separada em `app/routes.py`, `app/services.py`, `app/models.py` e `app/utils.py`.
- Modelo `Expense` simples e legível em `app/models.py`.
- Serviço de Excel centralizado em `app/services.py`, evitando espalhar Pandas pelas rotas.
- Sanitização básica de nome de arquivo com `secure_filename`.
- Templates e estáticos separados do backend.
- Compilação Python passa sem erros sintáticos.

### Interface

- Dashboard organizado em blocos compreensíveis.
- Tema claro/escuro já implementado.
- Feedback de salvamento e aviso de saída com alterações pendentes.
- Layout responsivo básico.
- Cards de resumo ajudam a leitura rápida do estado financeiro.

## 3. Principais Problemas Identificados

### Persistência e Consistência de Dados

- Receitas ficam no `localStorage`, não na planilha nem no backend, então podem sumir ao trocar navegador, limpar dados locais ou abrir em outro dispositivo.
- O backend mantém alterações em `_struct_cache`, um cache global em memória, sem isolamento por sessão/usuário.
- Planilhas novas usam `None`/`nova_planilha` como identificador temporário, o que pode misturar dados em cenários concorrentes.
- Salvar grava em `data/` e também diretamente em `~/Downloads`, criando efeito colateral fora do diretório do projeto.
- Não há endpoint explícito de download; o salvamento assume a pasta Downloads do sistema.
- Alterações são enviadas campo a campo; uma edição parcial pode deixar o item inconsistente se uma chamada falhar.

### Segurança

- APIs aceitam qualquer JSON sem validação robusta de campos, tipos e valores permitidos.
- Rotas que recebem `file` não normalizam/validam o nome antes de montar caminhos em `DATA_DIR`.
- Upload aceita `.xlsx` no HTML, mas o backend não valida extensão, tipo ou conteúdo de forma confiável.
- Uso de `innerHTML` com dados digitados pelo usuário abre risco de XSS no frontend.
- Não há CSRF, autenticação ou proteção de sessão; ok para uso local, mas inadequado se exposto em rede.
- `debug=True` está fixo no `run.py`, perigoso fora do ambiente local.

### Arquitetura e Manutenção

- `static/js/app.js` concentra muita responsabilidade em um arquivo grande: tema, receitas, saldo, CRUD, edição inline, categorias e salvamento.
- Parte da regra financeira está no frontend, parte no backend; falta uma fonte única de verdade.
- Não há camada clara de validação/serialização para dados de entrada e saída.
- `routes.py` contém prints de debug e imports não usados.
- Datas e dinheiro são tratados como strings em vários pontos, aumentando risco de parsing incorreto.
- Nomes internos misturam português, inglês e termos técnicos sem padrão consistente.

### Qualidade e Testes

- Não há testes automatizados.
- Não há fixtures de planilhas de exemplo para validar leitura/escrita.
- Não há lint/format configurado.
- Não há testes de API, serviços ou comportamento financeiro.
- Falhas de Excel são escondidas com `print` e retorno vazio, dificultando diagnóstico.

### UX e Produto

- Receitas não acompanham o arquivo salvo de forma confiável.
- Não há tela/modal dedicada para salvar, baixar ou renomear; usa `prompt()`.
- Não há confirmação/preview antes de sobrescrever planilha existente.
- Não há filtros por mês, categoria, pago/pendente ou forma de pagamento.
- Não há importação guiada para planilhas com colunas diferentes.
- Não há visualização histórica, orçamento por categoria ou metas.

### Documentação e Ambiente

- README descreve uma estrutura com `static/` e `templates/` dentro de `app/`, mas no projeto real eles ficam na raiz.
- Não há `.env.example`.
- Não há instrução de troubleshooting para Python não encontrado, criação da pasta `data/`, encoding ou erros comuns de Excel.
- Não há documentação de API interna.
- Dependências estão sem pinning de versões, o que pode causar quebras futuras.

## 4. Objetivo da Melhoria Geral

Transformar o projeto de um MVP local funcional em uma aplicação local confiável, testável e mais segura para controle financeiro pessoal, preservando a simplicidade de uso via Excel.

O foco não deve ser “enterprisezar” o projeto. A ideia boa aqui é manter o charme simples — planilha entra, painel ajuda, planilha sai — mas tirar os riscos que fazem o app perder dados ou ficar difícil de evoluir.

## 5. Escopo Funcional Proposto

### 5.1 Persistência Unificada

- Salvar receitas junto com os demais dados financeiros.
- Definir formato oficial da planilha:
  - Abas de categorias para despesas.
  - Aba especial `Receitas` ou `Config` para entradas.
  - Campos padronizados: `id`, `nome`, `valor`, `pago`, `data`, `forma_pagamento`, `obs`.
- Criar compatibilidade com planilhas antigas sem aba de receitas.
- Remover dependência de `localStorage` para dados financeiros.
- Manter `localStorage` apenas para preferências de UI, como tema.

### 5.2 API Mais Robusta

- Criar endpoints REST mais consistentes:
  - `GET /api/workbooks`
  - `GET /api/workbooks/<file>`
  - `POST /api/workbooks`
  - `PUT /api/workbooks/<file>`
  - `POST /api/workbooks/<file>/expenses`
  - `PATCH /api/workbooks/<file>/expenses/<id>`
  - `DELETE /api/workbooks/<file>/expenses/<id>`
  - `POST /api/workbooks/<file>/incomes`
  - `PATCH /api/workbooks/<file>/incomes/<id>`
  - `DELETE /api/workbooks/<file>/incomes/<id>`
  - `GET /api/workbooks/<file>/download`
- Fazer atualização de lançamento em uma chamada única, não campo a campo.
- Retornar erros estruturados: `code`, `message`, `details`.
- Usar status HTTP corretos: `400`, `404`, `409`, `422`, `500`.

### 5.3 Regras Financeiras

- Centralizar cálculo financeiro em serviço Python.
- Definir regra explícita para “pago”:
  - Opção A: saldo considera todos os gastos lançados.
  - Opção B: saldo considera apenas gastos pagos.
  - Opção C: mostrar ambos: comprometido e realizado.
- Separar total de cartão de crédito por vencimento/mês futuro.
- Adicionar totais por categoria no backend.
- Adicionar totais por forma de pagamento.
- Preparar estrutura para filtros por período.

### 5.4 Melhorias de Produto

- Filtro por mês/ano.
- Filtro por categoria.
- Filtro por status: pago, pendente, todos.
- Filtro por forma de pagamento.
- Busca por descrição/observação.
- Dashboard com:
  - Receita total.
  - Despesa total.
  - Saldo previsto.
  - Saldo realizado.
  - Fatura do cartão.
  - Top categorias por gasto.
- Exportação/download explícito por botão.
- Tela de confirmação ao sobrescrever arquivo existente.
- Modo de criação de nova planilha com nome definido antes de começar, evitando estado temporário global.

### 5.5 Importação de Excel

- Validar extensão e conteúdo no backend.
- Detectar colunas equivalentes com aliases.
- Exibir erros amigáveis quando uma planilha não puder ser lida.
- Gerar IDs para linhas sem `id`.
- Preservar compatibilidade com colunas antigas.
- Documentar template oficial de planilha.
- Criar botão para baixar “planilha modelo”.

## 6. Escopo Técnico Proposto

### 6.1 Backend

- Introduzir camada de domínio:
  - `Expense`
  - `Income`
  - `Workbook`
  - `FinancialSummary`
- Criar módulo de validação:
  - normalização de nomes de arquivo;
  - validação de extensão;
  - validação de campos obrigatórios;
  - validação de valores monetários;
  - validação de datas;
  - validação de forma de pagamento.
- Trocar `print` por logging estruturado.
- Remover imports não usados.
- Substituir cache global simples por uma estratégia explícita:
  - sem cache, lendo/escrevendo arquivo diretamente; ou
  - cache por workbook com invalidação clara; ou
  - persistência JSON intermediária.
- Garantir que todo caminho resolvido permaneça dentro de `DATA_DIR`.
- Separar salvar no servidor de baixar arquivo.
- Tornar `debug` configurável por variável de ambiente.

### 6.2 Frontend

- Quebrar `static/js/app.js` em módulos:
  - `api.js`
  - `state.js`
  - `formatters.js`
  - `expenses.js`
  - `incomes.js`
  - `summary.js`
  - `theme.js`
- Eliminar `innerHTML` para conteúdo vindo do usuário ou aplicar escape rigoroso.
- Criar renderização baseada em estado único em memória.
- Padronizar formatação BRL com `Intl.NumberFormat('pt-BR')`.
- Padronizar datas com helpers únicos.
- Remover estilos inline do HTML/JS e mover para CSS.
- Substituir `prompt()` por modal ou seção de formulário.
- Melhorar tratamento de erros de `fetch`.

### 6.3 Templates e CSS

- Remover estilos inline de `templates/dashboard.html`.
- Criar componentes visuais consistentes:
  - cards;
  - botões;
  - formulários;
  - lista/tabela de lançamentos;
  - alertas.
- Melhorar acessibilidade:
  - foco visível;
  - labels completos;
  - botões com estados claros;
  - contraste no modo escuro;
  - mensagens sem depender apenas de cor.
- Melhorar responsividade da lista de lançamentos, talvez migrando para cards no mobile.

### 6.4 Testes

- Adicionar `pytest`.
- Criar testes unitários para:
  - parsing de Excel;
  - serialização de Excel;
  - validação de payloads;
  - cálculo de resumo financeiro;
  - sanitização de nomes de arquivo;
  - criação, edição, exclusão e movimentação de despesas.
- Criar testes de API com Flask test client.
- Criar fixtures `.xlsx` mínimas:
  - planilha válida;
  - planilha sem IDs;
  - planilha com aliases de colunas;
  - planilha inválida;
  - planilha com receitas.
- Adicionar teste de regressão para planilha nova e salvamento.

### 6.5 Qualidade de Código

- Adicionar configuração de formatter/linter:
  - `ruff` para lint e format Python;
  - opcionalmente `prettier` para HTML/CSS/JS.
- Criar `pyproject.toml`.
- Fixar versões mínimas/compatíveis em `requirements.txt`.
- Adicionar `.env.example`.
- Atualizar `.gitignore` para artefatos de teste/cache adicionais.
- Remover `__pycache__` já rastreado, se estiver no Git.

## 7. Priorização Recomendada

### P0 — Corrigir Riscos de Dados e Segurança

- Validar e normalizar todo nome de arquivo recebido por rota/API.
- Validar upload no backend.
- Remover gravação automática em `~/Downloads`; trocar por endpoint de download.
- Persistir receitas no backend/Excel.
- Eliminar XSS via `innerHTML` com dados do usuário.
- Atualizar lançamento em chamada única.
- Configurar `debug` por ambiente.

### P1 — Organizar Arquitetura

- Separar domínio, validação, Excel repository e cálculos financeiros.
- Quebrar `app.js` em módulos menores.
- Remover estilos inline.
- Criar estado único no frontend.
- Padronizar formatação de moeda e data.
- Adicionar logging.

### P2 — Testabilidade e Confiabilidade

- Adicionar suíte de testes com `pytest`.
- Criar fixtures Excel.
- Testar serviços e APIs principais.
- Adicionar lint/format.
- Documentar API e formato oficial da planilha.

### P3 — Evolução de Produto

- Filtros por período, categoria, status e pagamento.
- Busca textual.
- Dashboard mais analítico.
- Planilha modelo.
- Melhor fluxo de importação.
- Orçamento por categoria.
- Metas mensais.

## 8. Roadmap de Execução

### Fase 1 — Fundação Segura

Objetivo: estabilizar dados e segurança sem mudar radicalmente a interface.

Entregas:

- Validação de arquivo em todas as entradas.
- Upload seguro de `.xlsx`.
- Endpoint de download.
- Remoção de gravação automática em Downloads.
- Receitas persistidas na planilha.
- `debug` controlado por ambiente.
- Correção dos pontos de XSS mais evidentes.

Critérios de aceite:

- Uma planilha nova com receitas e despesas pode ser salva, recarregada e manter todos os dados.
- Nenhum endpoint aceita caminho fora de `data/`.
- Dados digitados pelo usuário não executam HTML/JS na tela.
- O usuário consegue baixar o arquivo por rota própria.

### Fase 2 — Domínio e Testes

Objetivo: deixar as regras financeiras confiáveis e cobertas por teste.

Entregas:

- Modelos `Income`, `Expense`, `Workbook` e `FinancialSummary`.
- Serviço de cálculo financeiro no backend.
- Testes unitários de parsing, escrita e resumo.
- Testes de API para CRUD principal.
- Fixtures Excel.

Critérios de aceite:

- Testes cobrem criação, edição, exclusão, categoria, receita e salvamento.
- Cálculos exibidos no dashboard batem com os cálculos do backend.
- Erros de payload retornam mensagens estruturadas.

### Fase 3 — Refatoração Frontend

Objetivo: reduzir complexidade e preparar evolução de UX.

Entregas:

- `app.js` dividido em módulos.
- Estado centralizado no frontend.
- Renderização segura sem interpolação perigosa.
- Modal/tela de salvamento no lugar de `prompt()`.
- CSS sem estilos inline principais.
- Tratamento consistente de loading/erro/sucesso.

Critérios de aceite:

- Fluxos existentes continuam funcionando.
- Código frontend fica organizado por responsabilidade.
- Erros de rede/API são exibidos de forma clara.

### Fase 4 — UX Financeira

Objetivo: transformar o painel em uma ferramenta melhor de decisão.

Entregas:

- Filtros por período, categoria, pagamento e status.
- Busca de lançamentos.
- Cards de resumo expandidos.
- Totais por categoria e forma de pagamento calculados no backend.
- Planilha modelo para download.
- Melhor importação de planilhas antigas.

Critérios de aceite:

- Usuário consegue analisar um mês específico.
- Usuário consegue localizar rapidamente um lançamento.
- Usuário entende diferenças entre saldo previsto, saldo realizado e fatura.

### Fase 5 — Polimento e Distribuição

Objetivo: melhorar instalação, documentação e experiência de uso local.

Entregas:

- README atualizado com estrutura real.
- Guia de instalação Windows/macOS/Linux.
- `.env.example`.
- Comando de execução documentado.
- Troubleshooting.
- Opcional: empacotar como executável local ou script de instalação.

Critérios de aceite:

- Usuário novo consegue rodar o projeto seguindo o README.
- Configurações sensíveis não ficam hardcoded.
- Projeto fica pronto para manutenção contínua.

## 9. Fora de Escopo Inicial

- Autenticação multiusuário completa.
- Banco de dados relacional.
- Deploy público em nuvem.
- Integração bancária automática.
- OCR de comprovantes.
- Aplicativo mobile nativo.

Esses itens podem ser úteis no futuro, mas agora aumentariam a complexidade antes de resolver os fundamentos.

## 10. Métricas de Sucesso

- Zero perda de receitas ao salvar/reabrir planilha.
- Zero gravação inesperada fora do diretório do projeto.
- Testes cobrindo os fluxos financeiros principais.
- `app.js` reduzido ou dividido em módulos de responsabilidade clara.
- README reproduzível em máquina nova.
- APIs com erros previsíveis e validados.
- Usuário consegue importar, editar, salvar e baixar sem depender de estado invisível no navegador.

## 11. Sequência Recomendada Para Começar

1. Criar testes mínimos para o comportamento atual de `services.py`.
2. Corrigir validação de arquivos e path traversal.
3. Criar persistência de receitas no Excel.
4. Separar download de salvamento.
5. Corrigir XSS no frontend.
6. Mover cálculo financeiro para backend.
7. Refatorar frontend em módulos.
8. Atualizar README e ambiente.

## 12. Resumo Executivo

O projeto está em um bom ponto de partida: ele já resolve o problema central e tem uma interface utilizável. A melhoria geral deve preservar essa simplicidade, mas profissionalizar os pontos frágeis: persistência, segurança, validação, testes e separação de responsabilidades.

O melhor caminho é evoluir em camadas: primeiro proteger dados, depois consolidar regras financeiras, em seguida organizar frontend e só então expandir produto. Assim o projeto ganha robustez sem perder velocidade.
