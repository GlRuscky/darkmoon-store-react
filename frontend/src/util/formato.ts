export const formatarMoeda = (valor: number): string =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-03" -> "mar/26" */
export function formatarMes(aaaaMm: string): string {
  const [ano, mes] = aaaaMm.split("-");
  return `${MESES[Number(mes) - 1] ?? mes}/${(ano ?? "").slice(2)}`;
}

export const formatarNumero = (n: number, casas = 2): string =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas });
