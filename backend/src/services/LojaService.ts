import type { DatabaseSync } from "node:sqlite";
import { ErroNaoEncontrado } from "../domain/erros.ts";

export type FiltroProdutos = {
  busca?: string;
  categoria?: string;
  precoMin?: number;
  precoMax?: number;
};

/** Consultas da loja (catálogo, cupom) e do dashboard. Sempre com prepared statements. */
export class LojaService {
  readonly #db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.#db = db;
  }

  listarProdutos(f: FiltroProdutos) {
    const where: string[] = [];
    const params: (string | number)[] = [];

    if (f.busca) {
      where.push("(nome LIKE ? OR descricao LIKE ?)");
      params.push(`%${f.busca}%`, `%${f.busca}%`);
    }
    if (f.categoria) {
      where.push("categoria = ?");
      params.push(f.categoria);
    }
    if (f.precoMin !== undefined) {
      where.push("preco >= ?");
      params.push(f.precoMin);
    }
    if (f.precoMax !== undefined) {
      where.push("preco <= ?");
      params.push(f.precoMax);
    }

    const sql = `SELECT id, nome, descricao, preco, estoque, imagem, genero, categoria
                 FROM produtos ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY nome ASC`;
    return this.#db.prepare(sql).all(...params);
  }

  validarCupom(codigo: string): { codigo: string; percentual: number } {
    const c = this.#db
      .prepare("SELECT codigo, percentual FROM cupons WHERE codigo = ? AND ativo = 1")
      .get(codigo.trim().toUpperCase()) as { codigo: string; percentual: number } | undefined;
    if (!c) throw new ErroNaoEncontrado("Cupom inválido ou expirado");
    return c;
  }

  /** Dados brutos para o front desenhar os gráficos (as estatísticas são calculadas lá). */
  dashboard() {
    const produtos = this.#db
      .prepare(
        `SELECT p.id, p.nome, p.categoria, p.genero, p.preco, p.estoque,
                COALESCE(SUM(ip.quantidade), 0)                      AS quantidadeVendida,
                COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0)  AS faturamento
         FROM produtos p
         LEFT JOIN itens_pedido ip ON ip.produto_id = p.id
         GROUP BY p.id
         ORDER BY p.id`,
      )
      .all();

    const vendasPorMes = this.#db
      .prepare(
        `SELECT substr(pd.data_pedido, 1, 7)                AS mes,
                COUNT(DISTINCT pd.id)                       AS pedidos,
                SUM(ip.quantidade)                          AS unidades,
                ROUND(SUM(ip.quantidade * ip.preco_unitario), 2) AS faturamento
         FROM pedidos pd
         JOIN itens_pedido ip ON ip.pedido_id = pd.id
         GROUP BY mes
         ORDER BY mes`,
      )
      .all();

    return { produtos, vendasPorMes };
  }
}
