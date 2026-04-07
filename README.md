# 📊 Painel Financeiro

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.0-black?style=for-the-badge&logo=flask)
![Pandas](https://img.shields.io/badge/Pandas-1.3-green?style=for-the-badge&logo=pandas)

Uma ferramenta web simples e intuitiva para visualizar e gerenciar seus gastos a partir de planilhas Excel. Ideal para quem busca uma forma prática de ter controle financeiro sem depender de softwares complexos.

---

### ✨ Visualização do Projeto

<p align="center">
  <img width="547" height="687" alt="Image" src="https://github.com/user-attachments/assets/29cddec5-7bc1-488e-b82c-efeed441ad9e" />
</p>

---

### 🚀 Funcionalidades

* **Criação do Zero:** Comece uma nova planilha de controle financeiro diretamente na aplicação.
* **Upload de Planilhas:** Carregue seus arquivos `.xlsx` existentes para visualização e edição.
* **Gerenciamento de Lançamentos:** Adicione, edite e apague gastos de forma fácil e rápida.
* **Controle de Saldo e Fatura:** Diferencie a forma de pagamento de cada gasto. O sistema calcula automaticamente o seu **Saldo em Conta** real (descontando Débito, Pix e Dinheiro do seu salário) e acumula separadamente a **Fatura do Cartão** (gastos no Crédito).
* **Sistema de Categorias:** As abas da sua planilha são transformadas em categorias, permitindo organizar seus gastos.
* **Edição Completa:** Altere qualquer informação de um lançamento, incluindo a forma de pagamento e mover um gasto entre categorias.
* **Feedback em Tempo Real:** A interface responde às suas ações, com mensagens de salvamento e avisos para não perder alterações.
* **Salvamento e Download:** Salve as alterações na planilha no servidor e baixe uma cópia para seu computador a qualquer momento.

---

### 🛠️ Tecnologias Utilizadas

* **Backend:**
    * **Python 3:** Linguagem principal da aplicação.
    * **Flask:** Micro-framework web para a criação das rotas e da API.
    * **Pandas:** Biblioteca para manipulação e leitura/escrita dos dados das planilhas Excel.
    * **openpyxl:** Engine utilizada pelo Pandas para trabalhar com arquivos `.xlsx`.

* **Frontend:**
    * **HTML5** com templates **Jinja2**.
    * **CSS3** para estilização, com foco em uma interface limpa e amigável.
    * **JavaScript (Vanilla)** para a interatividade da página, como edições em tempo real, cálculos automáticos de saldo, avisos e feedback ao usuário.

---

### ⚙️ Como Executar o Projeto

Siga os passos abaixo para rodar a aplicação em seu ambiente local.

**Pré-requisitos:**
* **Python 3.8** ou superior.
* **Git**.

**Passos:**

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/maarques/Monitoramento_Gastos.git](https://github.com/maarques/Monitoramento_Gastos.git)
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd Monitoramento_Gastos
    ```

3.  **Crie e ative um ambiente virtual:**
    * No Windows:
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
    * No macOS/Linux:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

4.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Execute a aplicação:**
    ```bash
    python run.py
    ```

6.  **Acesse no seu navegador:**
    Abra o endereço [http://127.0.0.1:5000](http://127.0.0.1:5000).

---

### 📁 Estrutura do Projeto
```
O projeto é organizado da seguinte forma para separar as responsabilidades:
Monitoramento_Gastos/
├── app/                  # Contém o núcleo da aplicação Flask
│   ├── static/           # Arquivos estáticos (CSS, JS)
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── app.js
│   ├── templates/        # Arquivos HTML com Jinja2
│   │   ├── base.html
│   │   ├── dashboard.html
│   │   └── index.html
│   ├── init.py       # Inicializa a aplicação
│   ├── models.py         # Define a estrutura de dados de um "gasto"
│   ├── routes.py         # Define todas as rotas e a API
│   ├── services.py       # Contém a lógica de negócio (manipulação de planilhas)
│   └── utils.py          # Funções utilitárias
├── data/                 # Pasta onde as planilhas são salvas (ignorada pelo Git)
├── requirements.txt      # Lista de dependências Python
└── run.py                # Ponto de entrada para executar a aplicação
```
### ❤️
Feito por **[Marques](https://github.com/maarques)**.
