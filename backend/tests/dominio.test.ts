import { test } from "node:test";
import assert from "node:assert/strict";
import { Cpf } from "../src/domain/Cpf.ts";
import { Email } from "../src/domain/Email.ts";
import { Senha } from "../src/domain/Senha.ts";
import { SenhaHasher } from "../src/domain/SenhaHasher.ts";
import { Usuario } from "../src/domain/Usuario.ts";
import { ErroValidacao } from "../src/domain/erros.ts";

test("CPF válido, com e sem máscara", () => {
  assert.equal(Cpf.criar("529.982.247-25").numeros, "52998224725");
  assert.equal(Cpf.criar("52998224725").formatado, "529.982.247-25");
  assert.equal(Cpf.criar("52998224725").mascarado, "***.***.247-25");
});

test("CPF inválido", () => {
  for (const ruim of ["111.111.111-11", "529.982.247-26", "123", "abc.def.ghi-jk", "", null, 12345678909]) {
    assert.throws(() => Cpf.criar(ruim), ErroValidacao, String(ruim));
  }
});

test("E-mail normaliza e valida", () => {
  assert.equal(Email.criar("  Ana@Exemplo.COM ").endereco, "ana@exemplo.com");
  for (const ruim of ["ana", "ana@", "@x.com", "a@b", "a..b@x.com", ".a@x.com", "a@x..com", "a b@x.com", ""]) {
    assert.throws(() => Email.criar(ruim), ErroValidacao, ruim);
  }
});

test("Senha: níveis", () => {
  assert.equal(Senha.avaliar("abc").nivel, "fraca");
  assert.equal(Senha.avaliar("12345678").nivel, "fraca");
  assert.equal(Senha.avaliar("Lua2Noite").nivel, "media");
  assert.equal(Senha.avaliar("Lua2Noite!").nivel, "forte");
});

test("Senha: rejeita fraca, aceita média e forte", () => {
  for (const ruim of ["curta1", "somenteletras", "12345678", "abcd1234", "aaaaaaa1", "Abcd1234", ""]) {
    assert.throws(() => Senha.criar(ruim), ErroValidacao, ruim);
  }
  assert.doesNotThrow(() => Senha.criar("Lua2Noite"));
  assert.doesNotThrow(() => Senha.criar("Corvo#Negro99"));
});

test("Senha não vaza em JSON/string", () => {
  const s = Senha.criar("Abcd1234!");
  assert.equal(JSON.stringify({ s }), '{"s":"********"}');
  assert.equal(String(s), "********");
});

test("Usuario: encapsulamento e setter com regra", () => {
  const h = new SenhaHasher();
  const u = new Usuario({
    nome: "  Ana   Maria ",
    email: Email.criar("ana@x.com"),
    cpf: Cpf.criar("52998224725"),
    senhaHash: Senha.criar("Abcd1234!").gerarHash(h),
  });
  assert.equal(u.nome, "Ana Maria");
  u.nome = "Bruna Souza";
  assert.equal(u.nome, "Bruna Souza");
  assert.throws(() => { u.nome = "X1"; }, ErroValidacao);
  assert.equal(u.nome, "Bruna Souza"); // setter inválido não altera o estado

  assert.equal(u.conferirSenha("Abcd1234!", h), true);
  assert.equal(u.conferirSenha("errada", h), false);

  const json = JSON.stringify(u);
  assert.ok(!json.includes("scrypt"), "hash não pode vazar");
  assert.ok(!json.includes("52998224725"), "CPF completo não pode vazar");
  assert.ok(!("senhaHash" in u) && !Object.keys(u).length, "sem propriedades públicas de estado");
});
