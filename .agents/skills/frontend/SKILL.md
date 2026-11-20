---
name: frontend
description: Orientações para desenvolver, revisar e testar o frontend da DarkMoon Store.
---

# Skill — Frontend DarkMoon Store

## Objetivo
Orientar o desenvolvimento do frontend, respeitando a arquitetura existente, os requisitos do projeto e a experiência do usuário.

## Estrutura do projeto
O frontend utiliza React, TypeScript, Vite, React Router e Axios.

Organização principal:
- `src/api`: comunicação com o backend.
- `src/componentes`: componentes reutilizáveis.
- `src/contexto`: contextos globais, incluindo autenticação.
- `src/dominio`: regras e tipos do domínio.
- `src/estatistica`: recursos relacionados a estatísticas.
- `src/hooks`: hooks personalizados.
- `src/pages`: páginas da aplicação.
- `src/util`: funções auxiliares e validações.
- `tests`: testes automatizados.

## Regras de desenvolvimento
1. Utilize React com TypeScript.
2. Evite `any` e mantenha tipagem adequada.
3. Reutilize componentes existentes antes de criar novos.
4. Utilize os componentes de formulário compartilhados, como `Campo` e `CampoSelect`, quando apropriado.
5. Centralize e reutilize validações existentes.
6. Mantenha páginas e componentes organizados conforme a estrutura atual.
7. Separe telas de listagem dos formulários de criação e edição, conforme o padrão já utilizado no painel administrativo.
8. Preserve a paginação das listagens.
9. Utilize o cliente Axios existente para chamadas à API.
10. Respeite o contexto de autenticação e o gerenciamento de sessão.
11. Apresente mensagens de erro claras e amigáveis.
12. Não adicione dependências sem necessidade e autorização.
13. Faça somente as alterações necessárias para atender à tarefa.

## Segurança
- Nunca leia, abra, imprima ou exponha arquivos `.env`.
- Não armazene senhas ou credenciais diretamente no código.
- Preserve o uso do token de autenticação conforme a implementação existente.
- Não permita que o frontend substitua as verificações de autorização do backend.
- Não exponha dados sensíveis nas telas ou mensagens de erro.

## Verificação
Após alterações, execute, quando aplicável:

```bash
npm run build
npm run lint
npm test
```

Os comandos devem ser executados dentro da pasta `frontend`.

Informe quais arquivos foram alterados e quais verificações foram executadas. Nunca afirme que um teste passou sem tê-lo executado.