
import type { RowDataPacket } from "mysql2";
import { ErroNaoEncontrado } from "../domain/erros.ts";
import type { Banco } from "../infra/banco.ts";

export type FiltroProdutos = {
  busca?: string;
  categoria?: string;
  precoMin?: number;
  precoMax?: number;
};

type ProdutoLinha = RowDataPacket & {
  id: number;
  nome: string;
  descricao: string;
  preco: number | string;
  estoque: number;
  imagem: string | null;
  genero: string | null;
  categoria: string;
};

type CupomLinha = RowDataPacket & {
  codigo: string;
  percentual: number | string;
};

type ProdutoDashboard = RowDataPacket & {
  id: number;
  nome: string;
  categoria: string;
  genero: string | null;
  preco: number | string;
  estoque: number;
  quantidadeVendida: number | string;
  faturamento: number | string;
};

type VendaMes = RowDataPacket & {
  mes: string;
  pedidos: number | string;
  unidades: number | string;
  faturamento: number | string;
};

/** Consultas da loja (catálogo, cupom) e do dashboard. */
export class LojaService {
  readonly #db: Banco;

  constructor(db: Banco) {
    this.#db = db;
  }

  async listarProdutos(f: FiltroProdutos) {
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

    const sql = `
      SELECT id, nome, descricao, preco, estoque, imagem, genero, categoria
      FROM produtos
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY nome ASC
    `;

    const [produtos] = await this.#db.execute<ProdutoLinha[]>(sql, params);

    return produtos.map((p) => ({
      ...p,
      preco: Number(p.preco),
    }));
  }

  async validarCupom(
    codigo: string,
  ): Promise<{ codigo: string; percentual: number }> {
    const [cupons] = await this.#db.execute<CupomLinha[]>(
      `SELECT codigo, percentual
       FROM cupons
       WHERE codigo = ? AND ativo = 1`,
      [codigo.trim().toUpperCase()],
    );

    const cupom = cupons[0];

    if (!cupom) {
      throw new ErroNaoEncontrado("Cupom inválido ou expirado");
    }

    return {
      codigo: cupom.codigo,
      percentual: Number(cupom.percentual),
    };
  }

  /** Dados brutos para o front desenhar os gráficos. */
  async dashboard() {
    const [produtosRows] = await this.#db.execute<ProdutoDashboard[]>(
      `SELECT
         p.id,
         p.nome,
         p.categoria,
         p.genero,
         p.preco,
         p.estoque,
         COALESCE(SUM(ip.quantidade), 0) AS quantidadeVendida,
         COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) AS faturamento
       FROM produtos p
       LEFT JOIN itens_pedido ip ON ip.produto_id = p.id
       GROUP BY p.id
       ORDER BY p.id`,
    );

    const [vendasRows] = await this.#db.execute<VendaMes[]>(
      `SELECT
         DATE_FORMAT(pd.data_pedido, '%Y-%m') AS mes,
         COUNT(DISTINCT pd.id) AS pedidos,
         SUM(ip.quantidade) AS unidades,
         ROUND(SUM(ip.quantidade * ip.preco_unitario), 2) AS faturamento
       FROM pedidos pd
       JOIN itens_pedido ip ON ip.pedido_id = pd.id
       GROUP BY DATE_FORMAT(pd.data_pedido, '%Y-%m')
       ORDER BY mes`,
    );

    const produtos = produtosRows.map((p) => ({
      ...p,
      preco: Number(p.preco),
      quantidadeVendida: Number(p.quantidadeVendida),
      faturamento: Number(p.faturamento),
    }));

    const vendasPorMes = vendasRows.map((v) => ({
      ...v,
      pedidos: Number(v.pedidos),
      unidades: Number(v.unidades),
      faturamento: Number(v.faturamento),
    }));

    return { produtos, vendasPorMes };
  }
}
