import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { abrirBanco } from "../src/infra/banco.ts";
import { criarApp } from "../src/http/app.ts";
import { SenhaHasher } from "../src/domain/SenhaHasher.ts";
import { TokenService } from "../src/infra/TokenService.ts";
import { UsuarioRepository } from "../src/infra/UsuarioRepository.ts";
import { UsuarioService } from "../src/services/UsuarioService.ts";

let server: Server;
let base = "";
let tokenAdmin = "";
let tokenComum = "";
let idComum = 0;
let idAdmin = 0;

const ADMIN = { nome: "Admin Teste", email: "admin@teste.com", cpf: "111.444.777-35", senha: "Admin#Lua2026" };
const COMUM = { nome: "Ana Maria", email: "ana@exemplo.com", cpf: "529.982.247-25", senha: "Corvo#Negro99" };

const chamar = (metodo: string, rota: string, token?: string, corpo?: unknown) =>
  fetch(base + rota, {
    method: metodo,
    headers: {
      ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

const login = async (email: string, senha: string): Promise<{ token: string; usuario: { id: number; papel: string } }> =>
  (await (await chamar("POST", "/login", undefined, { email, senha })).json()) as never;

before(async () => {
  const db = abrirBanco(":memory:");
  new UsuarioService(new UsuarioRepository(db), new SenhaHasher(), new TokenService()).garantirAdmin(ADMIN);
  server = criarApp(db, { segredo: "teste" });
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;

  await chamar("POST", "/usuarios", undefined, COMUM);
  const a = await login(ADMIN.email, ADMIN.senha);
  const c = await login(COMUM.email, COMUM.senha);
  tokenAdmin = a.token; idAdmin = a.usuario.id;
  tokenComum = c.token; idComum = c.usuario.id;
});
after(() => server.close());

test("login devolve o papel; cadastro pelo site é sempre 'usuario'", async () => {
  assert.equal((await login(ADMIN.email, ADMIN.senha)).usuario.papel, "admin");
  assert.equal((await login(COMUM.email, COMUM.senha)).usuario.papel, "usuario");
});

test("não dá para se cadastrar como admin mandando 'papel' no corpo", async () => {
  const r = await chamar("POST", "/usuarios", undefined, {
    nome: "Hacker Teste", email: "h@x.com", cpf: "168.995.350-09", senha: "Corvo#Negro99", papel: "admin",
  });
  assert.equal(r.status, 201);
  assert.equal(((await r.json()) as { papel: string }).papel, "usuario");
});

test("sem login -> 401; usuário comum -> 403; admin -> 200 (dashboard e /admin)", async () => {
  for (const rota of ["/dashboard", "/admin/produtos", "/admin/cupons", "/admin/usuarios"]) {
    assert.equal((await chamar("GET", rota)).status, 401, `${rota} sem token`);
    assert.equal((await chamar("GET", rota, tokenComum)).status, 403, `${rota} comum`);
    assert.equal((await chamar("GET", rota, tokenAdmin)).status, 200, `${rota} admin`);
  }
  const dash = (await (await chamar("GET", "/dashboard", tokenAdmin)).json()) as
    { produtos: unknown[]; vendasPorMes: unknown[] };
  assert.equal(dash.produtos.length, 33);
  assert.equal(dash.vendasPorMes.length, 12);
});

test("usuário comum não consegue escrever no painel", async () => {
  assert.equal((await chamar("POST", "/admin/produtos", tokenComum, {})).status, 403);
  assert.equal((await chamar("DELETE", "/admin/produtos/1", tokenComum)).status, 403);
  assert.equal((await chamar("PATCH", `/admin/usuarios/${idComum}`, tokenComum, { papel: "admin" })).status, 403);
});

test("CRUD de produtos", async () => {
  const novo = {
    nome: "Camisa Teste Lua", descricao: "feita no teste", preco: 79.9, estoque: 5,
    imagem: "camisa-teste.webp", genero: "Unissex", categoria: "Camisas",
  };
  const criado = await chamar("POST", "/admin/produtos", tokenAdmin, novo);
  assert.equal(criado.status, 201);
  const p = (await criado.json()) as { id: number; preco: number };
  assert.equal(p.preco, 79.9);
  assert.equal(((await (await chamar("GET", "/produtos")).json()) as unknown[]).length, 34); // aparece na loja

  const edit = await chamar("PUT", `/admin/produtos/${p.id}`, tokenAdmin, { ...novo, preco: 89.9, estoque: 2 });
  assert.equal(edit.status, 200);
  assert.equal(((await edit.json()) as { preco: number }).preco, 89.9);

  assert.equal((await chamar("DELETE", `/admin/produtos/${p.id}`, tokenAdmin)).status, 204);
  assert.equal((await chamar("DELETE", `/admin/produtos/${p.id}`, tokenAdmin)).status, 404);
});

test("produto: validação devolve todos os erros por campo", async () => {
  const r = await chamar("POST", "/admin/produtos", tokenAdmin, {
    nome: "", preco: -5, estoque: 1.5, genero: "X", categoria: "Y", imagem: "../../etc/passwd",
  });
  assert.equal(r.status, 400);
  const { campos } = (await r.json()) as { campos: Record<string, string> };
  for (const c of ["nome", "preco", "estoque", "genero", "categoria", "imagem"]) assert.ok(campos[c], c);
});

test("produto que já foi vendido não pode ser excluído (409)", async () => {
  const produtos = (await (await chamar("GET", "/dashboard", tokenAdmin)).json()) as
    { produtos: { id: number; quantidadeVendida: number }[] };
  const vendido = produtos.produtos.find((p) => p.quantidadeVendida > 0)!;
  const r = await chamar("DELETE", `/admin/produtos/${vendido.id}`, tokenAdmin);
  assert.equal(r.status, 409);
});

test("SQL injection no id da rota não funciona", async () => {
  assert.equal((await chamar("DELETE", "/admin/produtos/1%20OR%201=1", tokenAdmin)).status, 404);
  assert.equal(((await (await chamar("GET", "/produtos")).json()) as unknown[]).length, 33);
});

test("CRUD de cupons", async () => {
  const c = await chamar("POST", "/admin/cupons", tokenAdmin, { codigo: "lua25", percentual: 25 });
  assert.equal(c.status, 201);
  assert.deepEqual(await c.json(), { codigo: "LUA25", percentual: 25, ativo: true });
  assert.equal((await chamar("POST", "/admin/cupons", tokenAdmin, { codigo: "LUA25", percentual: 5 })).status, 409);
  assert.equal((await chamar("POST", "/admin/cupons", tokenAdmin, { codigo: "x", percentual: 150 })).status, 400);

  // ativo -> aparece na loja; desativado -> some
  assert.equal(((await (await fetch(base + "/cupons/LUA25")).json()) as { percentual: number }).percentual, 25);
  const off = await chamar("PUT", "/admin/cupons/LUA25", tokenAdmin, { percentual: 30, ativo: false });
  assert.deepEqual(await off.json(), { codigo: "LUA25", percentual: 30, ativo: false });
  assert.equal((await fetch(base + "/cupons/LUA25")).status, 404);

  assert.equal((await chamar("DELETE", "/admin/cupons/LUA25", tokenAdmin)).status, 204);
  assert.equal((await chamar("DELETE", "/admin/cupons/LUA25", tokenAdmin)).status, 404);
});

test("usuários: listar sem hash, promover, rebaixar, remover; admin não mexe em si mesmo", async () => {
  const lista = (await (await chamar("GET", "/admin/usuarios", tokenAdmin)).json()) as Record<string, unknown>[];
  assert.ok(lista.length >= 3);
  assert.ok(lista.every((u) => u.senhaHash === undefined && u.senha === undefined));
  assert.ok(lista.every((u) => String(u.cpf).startsWith("***")));

  assert.equal((await chamar("PATCH", `/admin/usuarios/${idAdmin}`, tokenAdmin, { papel: "usuario" })).status, 400);
  assert.equal((await chamar("DELETE", `/admin/usuarios/${idAdmin}`, tokenAdmin)).status, 400);
  assert.equal((await chamar("PATCH", `/admin/usuarios/${idComum}`, tokenAdmin, { papel: "superuser" })).status, 400);

  const promo = await chamar("PATCH", `/admin/usuarios/${idComum}`, tokenAdmin, { papel: "admin" });
  assert.equal(((await promo.json()) as { papel: string }).papel, "admin");
  assert.equal((await chamar("GET", "/dashboard", tokenComum)).status, 200); // o papel vale na hora, mesmo token

  await chamar("PATCH", `/admin/usuarios/${idComum}`, tokenAdmin, { papel: "usuario" });
  assert.equal((await chamar("GET", "/dashboard", tokenComum)).status, 403); // rebaixado: perde o acesso na hora

  assert.equal((await chamar("DELETE", `/admin/usuarios/${idComum}`, tokenAdmin)).status, 204);
  assert.equal((await chamar("GET", "/admin/produtos", tokenComum)).status, 401); // conta removida: token não vale
});

test("rota admin inexistente e token adulterado", async () => {
  assert.equal((await chamar("GET", "/admin/segredos", tokenAdmin)).status, 404);
  const [corpo, ass] = tokenAdmin.split(".");
  const falso = Buffer.from(JSON.stringify({ sub: idAdmin, email: "x", exp: 9999999999 })).toString("base64url");
  assert.equal((await chamar("GET", "/admin/produtos", `${falso}.${ass}`)).status, 401);
  assert.ok(corpo);
});
