# DarkMoon Store — React + TypeScript + Node.js + MySQL

Projeto acadêmico de e-commerce desenvolvido com **React + TypeScript (Vite)** no frontend e **Node.js + TypeScript + MySQL** no backend.

O sistema possui autenticação, cadastro de usuários, catálogo de produtos, carrinho, cupons de desconto, painel administrativo e dashboard com análise descritiva.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Axios |
| Backend | Node.js, TypeScript, Express |
| Banco de dados | MySQL 8.4, mysql2 |
| Autenticação | JWT e senhas protegidas com scrypt |
| Infraestrutura | Docker, Docker Compose e Nginx |
| Testes | Node.js Test Runner |

## Estrutura do projeto

```text
backend/
  src/
    domain/
    http/
    infra/
    services/
  tests/
  Dockerfile
  .dockerignore

frontend/
  src/
  Dockerfile
  nginx.conf
  .dockerignore

agents/
docker-compose.yml
loja_gotica_test.sql
README.md
```

## Como executar com Docker

O Docker é a forma recomendada de executar o projeto completo.

**Requisitos:**
- Docker Desktop com Docker Compose.
- Arquivo `.env.docker` configurado na raiz do projeto.

O arquivo `.env.docker` deve conter as variáveis necessárias para o banco, a API e a criação do administrador inicial:

```env
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=loja_gotica_test
MYSQL_USER=darkmoon
MYSQL_PASSWORD=

DB_NAME=loja_gotica_test
DB_USER=darkmoon
DB_PASSWORD=

JWT_SECRET=
ADMIN_NOME=Administrador DarkMoon
ADMIN_EMAIL=admin@darkmoon.com
ADMIN_CPF=
ADMIN_SENHA=

CORS_ORIGENS=http://localhost:5173
```

Preencha os valores secretos com credenciais próprias. Não compartilhe nem envie esse arquivo ao GitHub.

Na raiz do projeto, execute:

```bash
docker compose --env-file .env.docker up --build -d
```

Acesse:

- Loja: http://localhost:5173
- API: http://localhost:5173/api

Para verificar os serviços:

```bash
docker compose --env-file .env.docker ps
```

Para acompanhar os logs:

```bash
docker compose --env-file .env.docker logs -f
```

Para encerrar:

```bash
docker compose --env-file .env.docker down
```

Os dados do MySQL ficam armazenados em volume Docker. O arquivo `loja_gotica_test.sql` é utilizado na inicialização de um volume de banco novo. Se o volume já tiver sido inicializado, o script não será importado novamente.

## Execução em desenvolvimento

Também é possível executar frontend e backend separadamente.

**Requisitos:**
- Node.js 22.18 ou superior.
- MySQL 8.4.
- Banco de dados MySQL configurado e com o esquema do projeto importado.

### Backend

Configure as variáveis de ambiente no arquivo `backend/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=loja_gotica
DB_USER=darkmoon
DB_PASSWORD=

JWT_SECRET=
CORS_ORIGENS=http://localhost:5173

ADMIN_NOME=Administrador DarkMoon
ADMIN_EMAIL=admin@darkmoon.com
ADMIN_CPF=
ADMIN_SENHA=
```

Na pasta `backend/`:

```bash
npm install
npm start
```

A API ficará disponível em `http://localhost:3000`.

### Frontend

Na pasta `frontend/`:

```bash
npm install
npm run dev
```

O site ficará disponível em `http://localhost:5173`.

## Verificações e testes

Na pasta `backend/`:

```bash
npm run typecheck
npm test
```

Na pasta `frontend/`:

```bash
npm run build
```

## Administrador e painel administrativo

O administrador inicial é criado automaticamente quando a API inicia, caso o e-mail configurado ainda não exista no banco.

As configurações são realizadas por variáveis de ambiente:

- `ADMIN_NOME`
- `ADMIN_EMAIL`
- `ADMIN_CPF`
- `ADMIN_SENHA`

A variável `ADMIN_SENHA` é obrigatória. Não existe senha padrão no código.

Quem se cadastra pela loja recebe sempre o papel de usuário comum. A alteração de papel é restrita ao painel administrativo.

O sistema também possui as seguintes proteções:

- O papel do usuário é conferido no banco durante as requisições protegidas.
- Usuários sem autenticação recebem HTTP 401.
- Usuários comuns tentando acessar operações administrativas recebem HTTP 403.
- Um administrador não pode rebaixar nem excluir a própria conta.
- Produtos que possuem vendas não podem ser excluídos, preservando o histórico de pedidos.

## Funcionalidades da loja

- Página inicial e catálogo de produtos.
- Pesquisa e filtros por categoria e preço.
- Paginação de produtos.
- Página de promoções.
- Carrinho de compras.
- Aplicação e validação de cupons.
- Cadastro e login de usuários.
- Perfil com edição dos dados permitidos.

## Painel administrativo

O painel possui gerenciamento de:

| Área | Funcionalidades |
|---|---|
| Produtos | Cadastro, consulta, edição e exclusão |
| Categorias | Cadastro, consulta, edição e exclusão |
| Cupons | Cadastro, consulta, edição e exclusão |
| Usuários | Consulta, alteração de papel e exclusão |
| Pedidos | Consulta, edição, atualização de status e exclusão conforme as regras do sistema |

As operações administrativas são protegidas por autenticação e autorização.

## Rotas principais da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/saude` | Verificação de saúde da API |
| POST | `/usuarios` | Cadastro de usuário |
| POST | `/login` | Autenticação |
| GET | `/usuarios/me` | Consulta do perfil autenticado |
| PUT | `/usuarios/me` | Atualização do próprio perfil |
| GET | `/produtos` | Listagem de produtos com filtros e paginação |
| GET | `/cupons/:codigo` | Validação de cupom |
| GET | `/dashboard` | Dados do dashboard administrativo |
| `/admin/produtos` | CRUD | Gerenciamento de produtos |
| `/admin/categorias` | CRUD | Gerenciamento de categorias |
| `/admin/cupons` | CRUD | Gerenciamento de cupons |
| `/admin/usuarios` | CRUD restrito | Gerenciamento de usuários |
| `/admin/pedidos` | CRUD restrito | Gerenciamento de pedidos |

As rotas administrativas exigem autenticação e papel de administrador.

## Validações e segurança

### Cadastro de usuários

Campos obrigatórios: nome, e-mail, CPF e senha.

- **CPF:** validação dos 11 dígitos e dos dígitos verificadores, aceitando entrada com ou sem máscara.
- **E-mail:** validação de formato, normalização e unicidade.
- **Senha:** validação de tamanho e força.
- **Confirmação:** verificação de correspondência entre senha e confirmação no cadastro.
- **Persistência:** senhas armazenadas com hash e salt, sem salvar texto puro.

### Autenticação e autorização

- Autenticação por JWT.
- Senhas verificadas com hash seguro.
- Rotas protegidas por autenticação e autorização.
- Validação do papel do usuário no banco.
- Consultas SQL parametrizadas para reduzir riscos de SQL Injection.

### Erros de validação

A API utiliza um formato padronizado para retornar erros:

```json
{
  "erro": "Dados inválidos",
  "campos": {
    "cpf": "CPF inválido"
  }
}
```

## Dashboard — Probabilidade e Estatística

O dashboard apresenta gráficos e estatísticas descritivas para análise das vendas.

| Gráfico | Tipo | Pergunta de negócio |
|---|---|---|
| Faturamento mensal | Série temporal | Qual a evolução das vendas? |
| Faturamento por categoria | Colunas | Quais categorias geram mais faturamento? |
| Mais vendidos | Barras | Quais produtos possuem maior saída? |
| Distribuição de preços | Histograma | Como os preços estão distribuídos? |
| Preço × unidades | Dispersão | Existe relação entre preço e quantidade vendida? |

Também são apresentadas medidas estatísticas como quantidade de registros, média, mediana, desvio padrão, mínimo e máximo.

Parte dos dados utilizados na apresentação acadêmica é simulada, permitindo demonstrar os métodos estatísticos mesmo com o histórico limitado de pedidos.

## Encapsulamento e orientação a objetos

O projeto utiliza conceitos de Programação Orientada a Objetos e separação de responsabilidades.

| Arquivo / classe | Conceito aplicado |
|---|---|
| `Cpf.ts` e `Email.ts` | Objetos de valor com validação |
| `Senha.ts` | Encapsulamento da senha |
| `Usuario.ts` | Estado privado e métodos controlados |
| `Produto.ts` e `Cupom.ts` | Validação e imutabilidade |
| `Papel.ts` | Representação dos papéis de usuário |
| `erros.ts` | Classes específicas de erro |
| `Carrinho.ts` | Carrinho imutável |
| `CupomDesconto.ts` | Validação do percentual de desconto |
| `services/` | Regras de negócio |
| `infra/` | Persistência e infraestrutura |

As dependências são organizadas e injetadas nas classes responsáveis, favorecendo a separação entre domínio, infraestrutura e regras de negócio.

## Histórico do projeto

O DarkMoon Store foi desenvolvido a partir de uma versão anterior em PHP e MySQL, sendo posteriormente reestruturado com React, TypeScript e Node.js.

Entre as mudanças estão:

- Substituição das páginas PHP por uma interface React.
- Criação de uma API REST em Node.js e TypeScript.
- Uso de consultas parametrizadas no acesso ao MySQL.
- Implementação de autenticação e autorização.
- Desenvolvimento do painel administrativo.
- Separação das regras de negócio em serviços e classes de domínio.
- Containerização da aplicação com Docker.
- Utilização do Nginx para servir o frontend e encaminhar as requisições à API.

O projeto mantém o foco em segurança, organização, orientação a objetos, testes e aplicação dos conteúdos acadêmicos.