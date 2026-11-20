# AGENTS.md — DarkMoon Store

## 1. Contexto do projeto

DarkMoon Store é um e-commerce desenvolvido com TypeScript, React, Node.js e MySQL.

O projeto está dividido em:

- `backend/`: API, regras de negócio, autenticação e acesso ao banco de dados.
- `frontend/`: interface React, páginas, componentes e comunicação com a API.
- `docker-compose.yml`: configuração dos serviços Docker.
- `loja_gotica.sql`: estrutura e dados iniciais do banco.

## 2. Tecnologias

### Backend
- Node.js
- TypeScript
- MySQL
- mysql2
- bcryptjs
- JWT

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios

## 3. Organização do código

### Backend

O código principal fica em `backend/src/`:

- `domain/`: entidades, validações e regras de domínio.
- `http/`: aplicação HTTP, rotas e tratamento de requisições.
- `infra/`: banco de dados, repositórios e infraestrutura.
- `services/`: casos de uso e regras de aplicação.

Respeite a separação de responsabilidades existente.

### Frontend

O código principal fica em `frontend/src/`:

- `api/`: comunicação com o backend e tipos.
- `componentes/`: componentes reutilizáveis.
- `contexto/`: contextos globais.
- `dominio/`: validações e regras de domínio.
- `estatistica/`: funcionalidades de estatísticas.
- `hooks/`: hooks reutilizáveis.
- `pages/`: páginas da aplicação.
- `util/`: funções auxiliares.

## 4. Regras obrigatórias

1. Utilize TypeScript em todo código novo.
2. Não utilize `any` sem justificativa técnica.
3. Respeite a arquitetura e os padrões já existentes.
4. Não duplique funcionalidades ou validações existentes.
5. Prefira alterações pequenas e diretamente relacionadas à tarefa.
6. Não crie dependências ou funcionalidades desnecessárias.
7. Preserve o comportamento das funcionalidades já implementadas.
8. Não altere contratos da API sem necessidade e autorização.
9. Não remova validações de segurança.
10. Antes de finalizar, informe os arquivos alterados e os testes executados.

## 5. Guardrails e segurança

### Arquivos e informações proibidos

- Nunca leia, abra, imprima, copie ou exponha o conteúdo de arquivos `.env`.
- Nunca exponha senhas, tokens, chaves privadas, credenciais ou dados de conexão.
- Nunca inclua segredos em logs, respostas, documentação ou commits.
- Não leia arquivos de credenciais locais.
- Não substitua credenciais reais por valores fictícios dentro dos arquivos `.env` locais.

O arquivo `.env.example` pode ser consultado, desde que contenha somente valores fictícios.

### Ações que exigem autorização

Peça autorização antes de:

- Instalar, remover ou atualizar dependências.
- Alterar configurações de banco de dados.
- Executar comandos que apaguem ou modifiquem dados.
- Executar migrations ou importar novamente o banco.
- Alterar configurações Docker ou infraestrutura.
- Modificar arquivos de configuração sensíveis.
- Fazer commits, pushes ou publicar alterações.

### Proteção de dados

- Utilize consultas SQL parametrizadas.
- Nunca armazene senhas em texto puro.
- Não exponha hashes de senha nas respostas da API.
- Valide autenticação e autorização nas rotas protegidas.
- Não permita que um usuário altere dados de outro usuário sem autorização.

## 6. Verificações

Antes de finalizar alterações, execute os comandos adequados à tarefa.

Backend:

```bash
cd backend
npm run typecheck
npm test
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
npm test
```

Não afirme que testes foram executados se não foram.

## 7. Skills disponíveis

As Skills específicas do projeto ficam em `.agents/skills/`.

- `backend`: desenvolvimento e manutenção da API.
- `frontend`: desenvolvimento da interface React.
- `seguranca`: autenticação, autorização e proteção de dados.

Sempre consulte a Skill correspondente antes de executar tarefas relacionadas a essas áreas.

## 8. Regra final

A prioridade é manter a DarkMoon Store funcional, segura, organizada e compatível com os requisitos do projeto.

Não invente requisitos, não faça refatorações desnecessárias e não amplie o escopo da tarefa sem autorização.