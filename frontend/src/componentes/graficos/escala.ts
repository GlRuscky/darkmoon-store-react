export const LARGURA = 640;
export const ALTURA = 360;
export const MARGEM = { t: 24, r: 24, b: 56, l: 88 };

export type Margem = typeof MARGEM;

/** Mapeia um valor do domínio [d0,d1] para a faixa de pixels [r0,r1]. */
export function linear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0 || 1;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** Passo "redondo" (1, 2, 5 × 10^n) para dividir [min,max] em ~alvo marcas. */
export function passoBonito(min: number, max: number, alvo = 5): number {
  const intervalo = max - min || Math.abs(max) || 1;
  const bruto = intervalo / alvo;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / pot;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pot;
}

export type Dominio = { min: number; max: number; marcas: number[] };

/** Expande [min,max] até múltiplos do passo e devolve as marcas do eixo. */
export function dominioBonito(min: number, max: number, alvo = 5): Dominio {
  const passo = passoBonito(min, max, alvo);
  const lo = Math.floor(min / passo) * passo;
  let hi = Math.ceil(max / passo) * passo;
  if (hi === lo) hi = lo + passo;
  const n = Math.round((hi - lo) / passo);
  const marcas = Array.from({ length: n + 1 }, (_, i) => Number((lo + i * passo).toFixed(10)));
  return { min: lo, max: hi, marcas };
}

export function truncar(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}
