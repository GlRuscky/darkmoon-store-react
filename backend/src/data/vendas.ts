import { PRODUTOS_SEED } from "./catalogo.ts";

/**
 * Gera vendas SIMULADAS e DETERMINÍSTICAS (mesma semente = mesmos dados sempre).
 * O banco original só tinha 5 pedidos, pouco para qualquer análise estatística.
 *
 * Premissas do simulador (dá para citar no relatório):
 *  - demanda cai com o preço (produto barato vende mais);
 *  - sazonalidade: Black Friday (nov), Natal (dez) e Halloween (out) vendem mais;
 *  - leve tendência de crescimento ao longo do ano.
 */
export type PedidoSeed = {
  dataPedido: string; // ISO
  itens: { produtoId: number; quantidade: number; precoUnitario: number }[];
};

function mulberry32(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 12 meses completos: nov/2025 a out/2026, com fator sazonal. */
const MESES: { ano: number; mes: number; fator: number }[] = [
  { ano: 2025, mes: 11, fator: 1.6 }, // Black Friday
  { ano: 2025, mes: 12, fator: 1.4 }, // Natal
  { ano: 2026, mes: 1, fator: 0.8 },
  { ano: 2026, mes: 2, fator: 0.8 },
  { ano: 2026, mes: 3, fator: 0.9 },
  { ano: 2026, mes: 4, fator: 0.95 },
  { ano: 2026, mes: 5, fator: 1.0 },
  { ano: 2026, mes: 6, fator: 1.0 },
  { ano: 2026, mes: 7, fator: 1.05 },
  { ano: 2026, mes: 8, fator: 1.1 },
  { ano: 2026, mes: 9, fator: 1.15 },
  { ano: 2026, mes: 10, fator: 1.8 }, // Halloween
];

export function gerarPedidosSimulados(): PedidoSeed[] {
  const rand = mulberry32(2026);

  // popularidade de cada produto: cai com o preço + ruído fixo por produto
  const pesos = PRODUTOS_SEED.map((p) => {
    const ruido = 0.55 + rand() * 0.9; // 0.55 .. 1.45
    return Math.pow(100 / p.preco, 1.6) * ruido;
  });

  const escolher = (excluir: Set<number>): number => {
    const total = pesos.reduce((s, w, i) => (excluir.has(i) ? s : s + w), 0);
    let r = rand() * total;
    for (let i = 0; i < pesos.length; i++) {
      if (excluir.has(i)) continue;
      r -= pesos[i]!;
      if (r <= 0) return i;
    }
    return 0;
  };

  const pedidos: PedidoSeed[] = [];
  MESES.forEach(({ ano, mes, fator }, idx) => {
    const tendencia = 1 + idx * 0.02;
    const qtdPedidos = Math.round(16 * fator * tendencia);
    const diasNoMes = new Date(ano, mes, 0).getDate();

    for (let n = 0; n < qtdPedidos; n++) {
      const dia = 1 + Math.floor(rand() * diasNoMes);
      const hora = 8 + Math.floor(rand() * 14);
      const data = new Date(Date.UTC(ano, mes - 1, dia, hora, Math.floor(rand() * 60)));

      const nItens = 1 + Math.floor(rand() * 3); // 1 a 3 produtos diferentes
      const usados = new Set<number>();
      const itens: PedidoSeed["itens"] = [];
      for (let k = 0; k < nItens; k++) {
        const i = escolher(usados);
        usados.add(i);
        const p = PRODUTOS_SEED[i]!;
        const quantidade = rand() < 0.75 ? 1 : 2;
        itens.push({ produtoId: p.id, quantidade, precoUnitario: p.preco });
      }
      pedidos.push({ dataPedido: data.toISOString(), itens });
    }
  });

  return pedidos.sort((a, b) => a.dataPedido.localeCompare(b.dataPedido));
}
