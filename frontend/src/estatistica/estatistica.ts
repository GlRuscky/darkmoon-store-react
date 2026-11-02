/** Estatística descritiva usada no dashboard. Funções puras: fáceis de testar. */

export const soma = (v: number[]): number => v.reduce((a, b) => a + b, 0);

export function media(v: number[]): number {
  return v.length === 0 ? NaN : soma(v) / v.length;
}

export function mediana(v: number[]): number {
  if (v.length === 0) return NaN;
  const o = [...v].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 === 0 ? (o[m - 1]! + o[m]!) / 2 : o[m]!;
}

/** Desvio padrão amostral (n - 1). */
export function desvioPadrao(v: number[]): number {
  if (v.length < 2) return NaN;
  const m = media(v);
  return Math.sqrt(soma(v.map((x) => (x - m) ** 2)) / (v.length - 1));
}

export type Bin = { de: number; ate: number; quantidade: number };

/**
 * Histograma: divide a amplitude em `nBins` faixas iguais.
 * O último bin é fechado dos dois lados para incluir o valor máximo.
 */
export function histograma(v: number[], nBins: number): Bin[] {
  if (v.length === 0 || nBins < 1) return [];
  const min = Math.min(...v);
  const max = Math.max(...v);
  if (min === max) return [{ de: min, ate: max, quantidade: v.length }];

  const largura = (max - min) / nBins;
  const bins: Bin[] = Array.from({ length: nBins }, (_, i) => ({
    de: min + i * largura,
    ate: min + (i + 1) * largura,
    quantidade: 0,
  }));
  for (const x of v) {
    const i = Math.min(Math.floor((x - min) / largura), nBins - 1);
    bins[i]!.quantidade++;
  }
  return bins;
}

/** Regra de Sturges: nº de faixas sugerido = 1 + log2(n). */
export const binsSturges = (n: number): number => Math.max(1, Math.ceil(1 + Math.log2(n)));

export type Regressao = {
  inclinacao: number;   // b em y = a + b·x
  intercepto: number;   // a
  r: number;            // correlação de Pearson
  r2: number;           // coeficiente de determinação
  n: number;
};

/** Regressão linear simples por mínimos quadrados. */
export function regressaoLinear(x: number[], y: number[]): Regressao | null {
  const n = Math.min(x.length, y.length);
  if (n < 2) return null;
  const mx = media(x.slice(0, n));
  const my = media(y.slice(0, n));
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - mx;
    const dy = y[i]! - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0) return null; // x constante: não existe reta
  const inclinacao = sxy / sxx;
  const intercepto = my - inclinacao * mx;
  const r = syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
  return { inclinacao, intercepto, r, r2: r * r, n };
}

/** Média móvel simples de janela `k` (primeiros k-1 pontos ficam null). */
export function mediaMovel(v: number[], k: number): (number | null)[] {
  return v.map((_, i) => (i < k - 1 ? null : media(v.slice(i - k + 1, i + 1))));
}

/** Descreve a força da correlação em palavras (convenção usual). */
export function descreverCorrelacao(r: number): string {
  const a = Math.abs(r);
  const forca = a >= 0.7 ? "forte" : a >= 0.4 ? "moderada" : a >= 0.2 ? "fraca" : "muito fraca/inexistente";
  const sentido = r < 0 ? "negativa" : "positiva";
  return a < 0.2 ? forca : `${forca} ${sentido}`;
}

/** "Bonito" para eixos: arredonda o máximo para cima (ex.: 87 → 100, 1340 → 1500). */
export function maximoBonito(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.floor(Math.log10(max));
  const base = 10 ** exp;
  for (const f of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (f * base >= max) return f * base;
  }
  return 10 * base;
}
