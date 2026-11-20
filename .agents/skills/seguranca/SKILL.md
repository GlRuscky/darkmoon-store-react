---
name: seguranca
description: Regras obrigatórias de segurança para alterações no backend e frontend da DarkMoon Store.
---

# Skill — Segurança DarkMoon Store

## Objetivo
Estabelecer práticas de segurança para proteger os dados dos usuários, as credenciais e a integridade da aplicação.

## Proteção de arquivos e credenciais
1. Nunca leia, abra, imprima, copie ou exponha o conteúdo de arquivos `.env`.
2. Nunca exiba valores de variáveis de ambiente, senhas, tokens, chaves privadas ou credenciais.
3. Não copie segredos para arquivos de documentação, código-fonte, logs ou mensagens.
4. O arquivo `.env.example` pode ser consultado somente se contiver valores fictícios, nunca credenciais reais.
5. Preserve as regras do `.gitignore` que impedem o versionamento de arquivos `.env`.
6. Nunca execute comandos que imprimam o conteúdo de arquivos de configuração sensíveis.
7. Se uma tarefa exigir acesso a uma credencial, interrompa e solicite que o responsável execute a operação localmente, sem compartilhar o segredo.

## Autenticação e autorização
- Utilize JWT conforme a implementação existente.
- Preserve a verificação de tokens nas rotas protegidas.
- Garanta que operações administrativas exijam autorização adequada.
- Não permita que um usuário consulte ou altere dados privados de outro usuário.
- Não confie apenas nas verificações realizadas pelo frontend.

## Senhas e dados pessoais
- Senhas devem ser armazenadas utilizando hash seguro, conforme a implementação existente com `bcryptjs`.
- Nunca armazene ou retorne senhas em texto puro.
- Nunca retorne hashes de senha nas respostas da API.
- Preserve as validações de CPF, e-mail e senha.
- Evite registrar dados pessoais ou credenciais em logs.

## Banco de dados
- Utilize consultas SQL parametrizadas.
- Nunca concatene entradas do usuário diretamente em comandos SQL.
- Preserve as verificações de integridade e os relacionamentos existentes.
- Não execute exclusões, alterações estruturais ou operações destrutivas no banco sem autorização.

## Alterações e verificações
- Não desative autenticação, autorização ou validações para facilitar testes.
- Não remova proteções existentes sem justificativa e autorização.
- Não instale dependências de segurança sem autorização.
- Informe possíveis riscos encontrados antes de realizar alterações relevantes.
- Faça somente as mudanças necessárias para atender aos requisitos do projeto.

## Regra final
A segurança deve ser preservada em todas as alterações, tanto no backend quanto no frontend. Em caso de dúvida sobre uma operação que possa expor credenciais ou comprometer dados, não execute a operação sem autorização.