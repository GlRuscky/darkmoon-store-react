import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validarCpf, validarEmail, validarNome, validarSenha, validarConfirmacao,
  validarCadastro, formatarCpf, avaliarSenha,
} from "../src/dominio/validacao.ts";
import { Carrinho } from "../src/dominio/Carrinho.ts";
import { CupomDesconto } from "../src/dominio/CupomDesconto.ts";
import {
  media, mediana, desvioPadrao, histograma, binsSturges, regressaoLinear, mediaMovel,
  descreverCorrelacao, maximoBonito,
} from "../src/estatistica/estatistica.ts";

test("CPF", () => {
  assert.equal(validarCpf("529.982.247-25"), "");
  assert.equal(validarCpf("52998224725"), "");
  for (const ruim of ["", "123", "111.111.111-11", "529.982.247-26"]) assert.notEqual(validarCpf(ruim), "", ruim);
  assert.equal(formatarCpf("52998224725"), "529.982.247-25");
  assert.equal(formatarCpf("5299"), "529.9");
  assert.equal(formatarCpf("abc5299822472599999"), "529.982.247-25");
});

test("e-mail e nome", () => {
  assert.equal(validarEmail("ana@exemplo.com"), "");
  for (const ruim of ["", "ana", "ana@", "a@b", "a..b@x.com"]) assert.notEqual(validarEmail(ruim), "", ruim);
  assert.equal(validarNome("Ana Maria"), "");
  assert.notEqual(validarNome("A1"), "");
  assert.notEqual(validarNome(""), "");
});

test("senha e verificação dupla", () => {
  assert.equal(validarSenha("Corvo#Negro99"), "");
  assert.equal(validarSenha("Lua2Noite"), "");
  for (const ruim of ["", "curta1", "somenteletras", "12345678", "abcd1234"]) assert.notEqual(validarSenha(ruim), "", ruim);
  assert.equal(validarConfirmacao("abc", "abc"), "");
  assert.notEqual(validarConfirmacao("abc", "abd"), "");
  assert.equal(avaliarSenha("Lua2Noite!").nivel, "forte");
});

test("cadastro completo", () => {
  const ok = validarCadastro({ nome: "Ana Maria", email: "a@x.com", cpf: "52998224725", senha: "Lua2Noite!", confirmarSenha: "Lua2Noite!" });
  assert.deepEqual(ok, {});
  const ruim = validarCadastro({ nome: "", email: "x", cpf: "1", senha: "1", confirmarSenha: "2" });
  assert.deepEqual(Object.keys(ruim).sort(), ["confirmarSenha", "cpf", "email", "nome", "senha"]);
});

test("Carrinho é imutável e calcula em centavos", () => {
  const p = { id: 1, nome: "A", preco: 89.9, imagem: "a.webp" };
  const vazio = new Carrinho();
  const c1 = vazio.adicionar(p, 3);
  assert.equal(vazio.quantidadeTotal, 0);   // original intacto
  assert.equal(c1.quantidadeTotal, 3);
  assert.equal(c1.subtotal, 269.7);         // 3 * 89.90 sem erro de ponto flutuante
  const c2 = c1.comCupom(new CupomDesconto("dark10", 10));
  assert.equal(c2.total, 242.73);
  assert.equal(c2.desconto, 26.97);
  assert.equal(c2.alterarQuantidade(1, 0).vazio, true);
  assert.throws(() => c1.adicionar(p, 0));
  assert.throws(() => c1.adicionar(p, 1.5));
  // itens devolvidos são cópia
  (c1.itens as unknown[]).pop();
  assert.equal(c1.itens.length, 1);
  // persistência
  const volta = Carrinho.restaurar(c2.paraArmazenar());
  assert.equal(volta.total, 242.73);
  assert.equal(Carrinho.restaurar("lixo{").vazio, true);
});

test("CupomDesconto valida percentual", () => {
  assert.throws(() => new CupomDesconto("X", 101));
  assert.throws(() => new CupomDesconto("X", -1));
  assert.throws(() => new CupomDesconto(" ", 10));
  assert.equal(new CupomDesconto("x", 20).aplicarEmCentavos(10000), 8000);
});

test("estatística descritiva", () => {
  const v = [2, 4, 4, 4, 5, 5, 7, 9];
  assert.equal(media(v), 5);
  assert.equal(mediana(v), 4.5);
  assert.ok(Math.abs(desvioPadrao(v) - 2.13809) < 1e-4);
  assert.equal(mediana([3, 1, 2]), 2);
});

test("histograma soma n e inclui o máximo", () => {
  const v = [1, 2, 2, 3, 3, 3, 10];
  const h = histograma(v, 3);
  assert.equal(h.reduce((s, b) => s + b.quantidade, 0), v.length);
  assert.equal(h[2]!.quantidade, 1);
  assert.equal(binsSturges(33), 7);
  assert.equal(histograma([5, 5], 4).length, 1);
});

test("regressão linear: reta exata e correlação negativa", () => {
  const r = regressaoLinear([1, 2, 3, 4], [3, 5, 7, 9])!;
  assert.ok(Math.abs(r.inclinacao - 2) < 1e-9 && Math.abs(r.intercepto - 1) < 1e-9 && Math.abs(r.r2 - 1) < 1e-9);
  const neg = regressaoLinear([1, 2, 3, 4], [9, 7, 5, 3])!;
  assert.ok(neg.r < -0.999);
  assert.equal(regressaoLinear([2, 2, 2], [1, 2, 3]), null);
  assert.equal(regressaoLinear([1], [1]), null);
  assert.match(descreverCorrelacao(-0.8), /forte negativa/);
});

test("média móvel e eixo bonito", () => {
  assert.deepEqual(mediaMovel([1, 2, 3, 4], 2), [null, 1.5, 2.5, 3.5]);
  assert.equal(maximoBonito(87), 100);
  assert.equal(maximoBonito(1340), 1500);
  assert.equal(maximoBonito(0), 1);
});

import {
  faturamentoPorCategoria, topProdutos, estoqueCritico, produtoMaisVendido, indicadores, regressaoPrecoDemanda, resumir,
} from "../src/estatistica/analiseVendas.ts";

const P = (id: number, categoria: "Botas" | "Camisas", preco: number, estoque: number, v: number) => ({
  id, nome: `P${id}`, categoria, genero: "Unissex" as const, preco, estoque, quantidadeVendida: v, faturamento: preco * v,
});

test("análise de vendas", () => {
  const ps = [P(1, "Botas", 200, 3, 2), P(2, "Camisas", 100, 10, 8), P(3, "Camisas", 50, 5, 16)];
  assert.deepEqual(faturamentoPorCategoria(ps), [{ rotulo: "Camisas", valor: 1600 }, { rotulo: "Botas", valor: 400 }]);
  assert.equal(topProdutos(ps, 1)[0]!.rotulo, "P3");
  assert.deepEqual(estoqueCritico(ps).map((p) => p.id), [1]);
  assert.equal(produtoMaisVendido(ps)!.id, 3);
  assert.equal(produtoMaisVendido([P(9, "Botas", 1, 1, 0)]), null);
  const r = regressaoPrecoDemanda(ps)!;
  assert.ok(r.inclinacao < 0 && r.r < -0.9);
  assert.equal(indicadores([{ mes: "2026-01", pedidos: 2, unidades: 5, faturamento: 100 }, { mes: "2026-02", pedidos: 2, unidades: 3, faturamento: 300 }]).ticketMedio, 100);
  assert.equal(resumir("x", [1, 2, 3]).mediana, 2);
});

import { lerNumero, validarCupom, validarProduto, semCampo, PRODUTO_VAZIO } from "../src/dominio/validacaoAdmin.ts";

test("admin: validação de produto", () => {
  const ok = { nome: "Camisa Lua", descricao: "", preco: "79,90", estoque: "5", imagem: "camisa.webp", genero: "Unissex", categoria: "Camisas" };
  assert.deepEqual(validarProduto(ok), {});
  assert.equal(lerNumero("79,90"), 79.9);
  assert.ok(Number.isNaN(lerNumero("")));
  const ruim = validarProduto({ ...PRODUTO_VAZIO, preco: "-1", estoque: "1.5", imagem: "../x.sh" });
  for (const c of ["nome", "preco", "estoque", "imagem", "genero", "categoria"]) assert.ok(ruim[c], c);
});

test("admin: validação de cupom", () => {
  assert.deepEqual(validarCupom({ codigo: "lua25", percentual: "25", ativo: true }, false), {});
  assert.ok(validarCupom({ codigo: "x", percentual: "150", ativo: true }, false).codigo);
  assert.ok(validarCupom({ codigo: "", percentual: "0", ativo: true }, true).percentual);
  assert.deepEqual(validarCupom({ codigo: "", percentual: "10", ativo: true }, true), {}); // editar não exige código
  assert.deepEqual(semCampo({ a: "1", b: "2" }, "a"), { b: "2" });
});
