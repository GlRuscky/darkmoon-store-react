---
name: backend
description: Orientações para desenvolver, revisar e testar o backend da DarkMoon Store.
---

# Skill — Backend DarkMoon Store

## Objetivo
Orientar alterações no backend da DarkMoon Store, respeitando a arquitetura existente, os requisitos do projeto e a segurança da aplicação.

## Estrutura do projeto
O backend utiliza Node.js, TypeScript e MySQL.

Organização principal:
- `src/domain`: entidades, regras de domínio e validações.
- `src/http`: servidor, rotas, autenticação e tratamento de requisições.
- `src/infra`: banco de dados, repositórios e infraestrutura.
- `src/services`: regras de aplicação e casos de uso.
- `tests`: testes automatizados.
- `scripts`: scripts auxiliares.

## Regras de desenvolvimento
1. Utilize TypeScript e evite `any`.
2. Respeite a separação entre domínio, serviços, infraestrutura e HTTP.
3. Mantenha regras de negócio nos locais apropriados.
4. Utilize consultas SQL parametrizadas.
5. Reaproveite entidades, serviços, repositórios e validações existentes.
6. Utilize as exceções personalizadas já existentes.
7. Preserve autenticação, autorização e validações.
8. Mantenha a paginação e os limites já definidos nas listagens.
9. Não adicione dependências sem necessidade e autorização.
10. Faça somente as alterações necessárias para atender à tarefa.

## Segurança
- Nunca leia, abra, imprima ou exponha arquivos `.env`.
- Nunca exponha senhas, tokens, hashes ou credenciais.
- Nunca retorne senhas ou hashes nas respostas da API.
- Verifique autenticação e autorização nas rotas protegidas.
- Garanta que usuários só acessem os próprios dados, quando aplicável.
- Não concatene dados recebidos do usuário diretamente em consultas SQL.

## Verificação
Após alterações, execute, quando aplicável:

```bash
npm run typecheck
npm test
```

Os comandos devem ser executados dentro da pasta `backend`.

Informe quais arquivos foram alterados e quais verificações foram executadas. Nunca afirme que um teste passou sem tê-lo executado.