# DarkMoon Store — React + Node/TypeScript

Transcrição do projeto DarkMoon Store (antes PHP + MySQL) para **React + TypeScript (Vite)** no front-end e
**Node + TypeScript + SQLite** no back-end. Não há PHP nem banco para instalar.

```
backend/    API REST (Node 22, sem dependências em runtime)
frontend/   Site em React (Vite + react-router-dom + axios)
```

## Como rodar

Requisito: **Node 22.5 ou superior** (a API usa o SQLite embutido do Node).

```bash
# Terminal 1 — API (http://localhost:3000)
cd backend
npm install
npm start

# Terminal 2 — site (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Na primeira execução a API cria `backend/data/darkmoon.db` e popula produtos, cupons e 12 meses de vendas simuladas.
Se a API estiver em outra porta, copie `frontend/.env.example` para `frontend/.env` e ajuste `VITE_API_URL`.

Testes automatizados: `npm test` (em `backend/` e em `frontend/`).

**Docker é opcional.** Com Docker instalado: `docker compose up --build` e abra http://localhost:5173 (o banco SQLite fica no volume `dados`). O arquivo `loja_gotica.sql` é o dump antigo do MySQL/PHP e **não é usado** pelo projeto.

## Rotas do site

| Rota | O que é |
|---|---|
| `/` `/produtos` `/promocoes` `/sobre` | Páginas da loja (transcritas do PHP) |
| `/carrinho` | Carrinho com cupom, salvo no navegador |
| `/cadastro` | **Cadastro de usuário** |
| `/login` | Login (recebe o aviso de cadastro concluído) |
| `/dashboard` | **Análise descritiva** (**só administrador**) |
| `/admin` | **Painel admin**: CRUD de produtos, cupons e usuários (**só administrador**) |

## API

| Método e rota | Descrição |
|---|---|
| `POST /usuarios` | Cadastro: `{ nome, email, cpf, senha, confirmarSenha? }` → 201 / 400 / 409 |
| `POST /login` | `{ email, senha }` → `{ token, usuario }` / 401 |
| `GET /produtos` | Filtros: `busca`, `categoria`, `preco_min`, `preco_max` |
| `GET /cupons/:codigo` | `{ codigo, percentual }` ou 404 |
| `GET /dashboard` | Dados para os gráficos (**admin**, com `Authorization: Bearer <token>`) |
| `GET/POST /admin/produtos`, `PUT/DELETE /admin/produtos/:id` | CRUD de produtos (**admin**) |
| `GET/POST /admin/cupons`, `PUT/DELETE /admin/cupons/:codigo` | CRUD de cupons (**admin**) |
| `GET /admin/usuarios`, `PATCH /admin/usuarios/:id` `{ papel }`, `DELETE /admin/usuarios/:id` | Gerenciar usuários (**admin**) |

Sem token a API responde **401**; com token de usuário comum, **403**.

Erros de validação seguem sempre o mesmo formato, para o front exibir cada mensagem no campo certo:

```json
{ "erro": "Dados inválidos", "campos": { "cpf": "CPF inválido", "senha": "Senha fraca. Tente ..." } }
```

## Administrador e painel `/admin`

O administrador inicial é criado na primeira vez que a API sobe (se o e-mail ainda não existir):

| | |
|---|---|
| E-mail | `admin@darkmoon.com` |
| Senha | `Admin#Lua2026` |

Para trocar, defina `ADMIN_EMAIL`, `ADMIN_SENHA`, `ADMIN_NOME` e `ADMIN_CPF` antes de `npm start`
(**troque a senha padrão se for publicar o site**). Quem se cadastra pelo site é sempre usuário comum;
o papel só muda pelo painel (aba *Usuários*), e o admin não consegue rebaixar nem excluir a própria conta.

- O papel é conferido **no banco a cada requisição** (não só no token): rebaixou ou excluiu um admin, o acesso some na hora.
- O front esconde as telas (`RotaProtegida papel="admin"`), mas **quem protege os dados é a API** (401/403).
- Produto que já tem vendas não pode ser excluído (apagaria o histórico do dashboard): zere o estoque.
- Bancos criados antes do painel são migrados sozinhos (a coluna `papel` é adicionada, nenhum dado se perde).

## Cadastro de usuário

**Campos obrigatórios:** nome, e-mail, senha e CPF.

- **CPF** — 11 dígitos, aceita com ou sem máscara, confere os 2 dígitos verificadores (módulo 11) e rejeita
  sequências repetidas (`111.111.111-11`). Salvo só com números; a API devolve mascarado (`***.***.247-25`).
- **E-mail** — formato validado (parte local, domínio, TLD), normalizado para minúsculas; único no banco.
- **Senha** — mínimo 8 caracteres, com letras e números, e nível **média ou forte**. A pontuação (0–6) soma:
  8+ caracteres, 12+ caracteres, minúscula, maiúscula, número e símbolo. 4 pontos = média, 5 ou mais = forte;
  senhas comuns (`12345678`, `abcd1234`...) e sequências (`123456`, `aaaa`) ficam sempre "fracas".
  Guardada com **scrypt** (salt aleatório) e comparada em tempo constante.
- **Front** — verificação dupla da senha, máscara de CPF, medidor de força, erros por campo, bloqueio de duplo clique,
  tratamento de API fora do ar / timeout / 400 / 409 / 5xx e **redirecionamento para `/login`** após o sucesso.

## Gráficos (Probabilidade e Estatística)

Cada gráfico responde a uma pergunta de negócio, descrita na própria página.

| Gráfico | Tipo | Pergunta de negócio |
|---|---|---|
| Faturamento mensal | Série temporal + média móvel | Qual a tendência e a sazonalidade das vendas? |
| Faturamento por categoria | Colunas | Em qual linha de produto investir? |
| Mais vendidos | Barras horizontais | O que repor primeiro no estoque? |
| Distribuição de preços | Histograma (regra de Sturges) | Onde o catálogo se concentra? |
| Preço × unidades | Dispersão + regressão linear | O preço influencia a demanda? (r, R², equação) |

Mais uma tabela de estatísticas descritivas (n, média, mediana, desvio padrão, mínimo, máximo).
**Os dados de venda são simulados** (semente fixa, resultado sempre igual): o banco original tinha só 5 pedidos.
O simulador está em `backend/src/data/vendas.ts`.

## Tech Forge — encapsulamento

| Classe | O que mostra |
|---|---|
| `backend/src/domain/Cpf.ts`, `Email.ts` | Objetos de valor: construtor privado + `criar()` que valida. Nunca existe um CPF/e-mail inválido. Sem setters. |
| `backend/src/domain/Senha.ts` | Texto da senha em campo `#privado`, **sem getter**; só `gerarHash()` o utiliza. `toString`/`toJSON` devolvem `********`. |
| `backend/src/domain/Usuario.ts` | Todo estado em `#campos`. `nome` tem **get + set com validação**; `email`, `cpf`, `id` só têm get; `senhaHash` não tem getter (usa `conferirSenha()` e `paraPersistencia()`). `criadoEm` devolve cópia. |
| `backend/src/domain/Produto.ts`, `Cupom.ts` | Objetos de valor imutáveis: construtor privado, `#dados` congelado, `criar()` valida todos os campos; sem setters. |
| `backend/src/domain/Papel.ts` | Papéis permitidos; `Usuario.papel` só tem getter e mudar o papel gera uma cópia (`comPapel`). |
| `backend/src/domain/erros.ts` | Erros com `#campos` congelado. |
| `backend/src/infra/*`, `services/*` | Dependências em `#privados`, injetadas pelo construtor. |
| `frontend/src/dominio/Carrinho.ts` | Carrinho **imutável**: `#itens` nunca muda por fora; getters só do que a tela lê; cada operação devolve um novo carrinho. |
| `frontend/src/dominio/CupomDesconto.ts` | Percentual validado (0–100) no construtor; sem setter. |

## O que mudou em relação ao PHP

- `cadastro.php` montava SQL com texto concatenado (risco de SQL Injection) → agora só *prepared statements*.
- `$_SESSION['carrinho']` → `Carrinho` salvo no `localStorage`.
- `dashboard/api.php` + `app.ts` → `GET /dashboard` + página React.
- O painel `admin/` não estava no repositório PHP enviado, então foi **criado do zero** neste projeto (seção *Administrador e painel `/admin`*).
