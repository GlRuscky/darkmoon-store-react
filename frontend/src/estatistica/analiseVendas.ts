import type { ProdutoDashboard, VendaMensal } from "../api/tipos";
import { desvioPadrao, media, mediana, regressaoLinear, soma } from "./estatistica";

export type ResumoDescritivo = {
  variavel: string; n: number; media: number; mediana: number;
  desvio: number; minimo: number; maximo: number;
};

export function resumir(variavel: string, v: number[]): ResumoDescritivo {
  return {
    variavel, n: v.length, media: media(v), mediana: mediana(v), desvio: desvioPadrao(v),
    minimo: v.length ? Math.min(...v) : NaN, maximo: v.length ? Math.max(...v) : NaN,
  };
}

/** Faturamento somado por categoria, do maior para o menor. */
export function faturamentoPorCategoria(produtos: ProdutoDashboard[]): { rotulo: string; valor: number }[] {
  const mapa = new Map<string, number>();
  for (const p of produtos) mapa.set(p.categoria, (mapa.get(p.categoria) ?? 0) + p.faturamento);
  return [...mapa.entries()].map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor);
}

/** Os `n` produtos mais vendidos (unidades). */
export function topProdutos(produtos: ProdutoDashboard[], n: number): { rotulo: string; valor: number }[] {
  return [...produtos]
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
    .slice(0, n)
    .map((p) => ({ rotulo: p.nome, valor: p.quantidadeVendida }));
}

export const estoqueCritico = (produtos: ProdutoDashboard[], limite = 5): ProdutoDashboard[] =>
  produtos.filter((p) => p.estoque < limite);

export function produtoMaisVendido(produtos: ProdutoDashboard[]): ProdutoDashboard | null {
  let melhor: ProdutoDashboard | null = null;
  for (const p of produtos) {
    if (p.quantidadeVendida > 0 && (melhor === null || p.quantidadeVendida > melhor.quantidadeVendida)) melhor = p;
  }
  return melhor;
}

export type Indicadores = { faturamentoTotal: number; pedidos: number; unidades: number; ticketMedio: number };

export function indicadores(meses: VendaMensal[]): Indicadores {
  const faturamentoTotal = soma(meses.map((m) => m.faturamento));
  const pedidos = soma(meses.map((m) => m.pedidos));
  return {
    faturamentoTotal, pedidos, unidades: soma(meses.map((m) => m.unidades)),
    ticketMedio: pedidos > 0 ? faturamentoTotal / pedidos : 0,
  };
}

/** Regressão preço × unidades vendidas (uma observação por produto). */
export const regressaoPrecoDemanda = (produtos: ProdutoDashboard[]) =>
  regressaoLinear(produtos.map((p) => p.preco), produtos.map((p) => p.quantidadeVendida));
