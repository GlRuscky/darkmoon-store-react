import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Banco } from "../src/infra/banco.ts";
import { abrirBanco, configDoAmbiente } from "../src/infra/banco.ts";
import { criarApp } from "../src/http/app.ts";

const BANCO_DE_TESTE = "loja_gotica_test";

let server: Server;
let db: Banco;
let base = "";

before(async () => {
  db = await abrirBanco({ ...configDoAmbiente(), banco: BANCO_DE_TESTE });

  server = criarApp(db, { segredo: "teste" });

  await new Promise<void>((r) => server.listen(0, r));

  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((erro) => {
        if (erro) reject(erro);
        else resolve();
      });
    });
  } finally {
    try {
      await db.execute(
        "DELETE FROM usuarios WHERE email = ?",
        [valido.email],
      );
    } finally {
      await db.end();
    }
  }
});

const post = (
  rota: string,
  corpo: unknown,
  headers: Record<string, string> = {},
) =>
  fetch(base + rota, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });

const valido = {
  nome: "Ana Maria",
  email: "ana@exemplo.com",
  cpf: "529.982.247-25",
  senha: "Corvo#Negro99",
};

type ErrosDeCampos = { campos: Record<string, string> };
type RespostaLogin = { token: string };
type Produto = { preco: number };
type Cupom = { percentual: number };

test("cadastro válido -> 201 sem hash e com CPF mascarado", async () => {
  const r = await post("/usuarios", valido);
  assert.equal(r.status, 201);
  const j = (await r.json()) as {
    email?: string;
    cpf?: string;
    senha?: string;
    senhaHash?: string;
    campos?: Record<string, string>;
  };
  assert.equal(j.email, "ana@exemplo.com");
  assert.equal(j.cpf, "***.***.247-25");
  assert.equal(j.senha, undefined);
  assert.equal(j.senhaHash, undefined);
});

test("cadastro devolve todos os erros de campo de uma vez (400)", async () => {
  const r = await post("/usuarios", {
    nome: "",
    email: "x",
    cpf: "111.111.111-11",
    senha: "123",
  });
  assert.equal(r.status, 400);
  const j = (await r.json()) as { campos: Record<string, string> };
  assert.deepEqual(Object.keys(j.campos).sort(), [
    "cpf",
    "email",
    "nome",
    "senha",
  ]);
});

test("e-mail e CPF duplicados -> 409", async () => {
  const r = await post("/usuarios", { ...valido, nome: "Outra Pessoa" });
  assert.equal(r.status, 409);
  const j = (await r.json()) as ErrosDeCampos;
  assert.equal(j.campos.email, "E-mail já cadastrado");
  assert.equal(j.campos.cpf, "CPF já cadastrado");
});

test("e-mail com maiúsculas conta como duplicado", async () => {
  const r = await post("/usuarios", {
    ...valido,
    email: "ANA@Exemplo.com",
    cpf: "168.995.350-09",
  });
  assert.equal(r.status, 409);
});

test("confirmarSenha diferente -> 400", async () => {
  const r = await post("/usuarios", {
    ...valido,
    email: "b@x.com",
    cpf: "168.995.350-09",
    confirmarSenha: "outra",
  });
  assert.equal(r.status, 400);
  assert.ok(((await r.json()) as ErrosDeCampos).campos.confirmarSenha);
});

test("JSON quebrado -> 400, sem content-type -> 415", async () => {
  assert.equal((await post("/usuarios", "{nao-eh-json")).status, 400);
  const r = await fetch(base + "/usuarios", {
    method: "POST",
    body: "x",
  });
  assert.equal(r.status, 415);
});

test("SQL injection no e-mail não funciona", async () => {
  const r = await post("/login", {
    email: "' OR '1'='1",
    senha: "qualquer",
  });
  assert.equal(r.status, 401);
});

test("login ok -> token; senha errada -> 401 genérico", async () => {
  const ok = await post("/login", {
    email: "ana@exemplo.com",
    senha: valido.senha,
  });
  assert.equal(ok.status, 200);
  const { token } = (await ok.json()) as RespostaLogin;
  assert.ok(token);

  const ruim = await post("/login", {
    email: "ana@exemplo.com",
    senha: "errada123",
  });
  const inexistente = await post("/login", {
    email: "nao@existe.com",
    senha: "errada123",
  });
  assert.equal(ruim.status, 401);
  assert.equal(inexistente.status, 401);
  assert.deepEqual(await ruim.json(), await inexistente.json());
});

test("dashboard exige token e papel admin (usuário comum leva 403)", async () => {
  assert.equal((await fetch(base + "/dashboard")).status, 401);
  assert.equal(
    (
      await fetch(base + "/dashboard", {
        headers: { Authorization: "Bearer lixo.lixo" },
      })
    ).status,
    401,
  );

  const { token } = (await (
    await post("/login", {
      email: "ana@exemplo.com",
      senha: valido.senha,
    })
  ).json()) as RespostaLogin;

  const r = await fetch(base + "/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(r.status, 403);
});

test("produtos com filtros e cupom", async () => {
  const todos = (await (await fetch(base + "/produtos?por_pagina=50")).json()) as {
  produtos: Produto[];
};

assert.equal(todos.produtos.length, 33);

  const botas = (await (
  await fetch(base + "/produtos?categoria=Botas&por_pagina=50")
).json()) as { produtos: Produto[] };

assert.equal(botas.produtos.length, 10);

  const baratos = (await (
  await fetch(base + "/produtos?preco_max=70&por_pagina=50")
).json()) as { produtos: Produto[] };

assert.ok(baratos.produtos.every((p) => p.preco <= 70));

  const injecao = (await (
  await fetch(
    base +
      "/produtos?busca=" +
      encodeURIComponent("'; DROP TABLE produtos;--") +
      "&por_pagina=50",
  )
).json()) as { produtos: unknown[] };

assert.deepEqual(injecao.produtos, []);

  const cupom = (await (
    await fetch(base + "/cupons/dark10")
  ).json()) as Cupom;
  assert.equal(cupom.percentual, 10);
  assert.equal((await fetch(base + "/cupons/NAOEXISTE")).status, 404);
});