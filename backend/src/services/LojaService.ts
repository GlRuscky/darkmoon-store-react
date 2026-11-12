
import type { RowDataPacket } from "mysql2";
import { ErroNaoEncontrado } from "../domain/erros.ts";
import type { Banco } from "../infra/banco.ts";

export type FiltroProdutos = {
  busca?: string;
  categoria?: string;
  precoMin?: number;
  precoMax?: number;
  pagina?: number;
  porPagina?: number;
};

type ProdutoLinha = RowDataPacket & {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number | string;
  estoque: number;
  imagem: string | null;
  genero: string | null;
  categoria: string;
};

type ContagemLinha = RowDataPacket & {
  total: number | string;
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

/** Consultas do catálogo, cupons e dashboard. */
export class LojaService {
  readonly #db: Banco;

  constructor(db: Banco) {
    this.#db = db;
  }

  async listarProdutos(f: FiltroProdutos) {
    const where: string[] = [];
    const params: (string | number)[] = [];

    if (f.busca) {
      where.push("(p.nome LIKE ? OR p.descricao LIKE ?)");
      params.push(`%${f.busca}%`, `%${f.busca}%`);
    }

    if (f.categoria) {
      where.push(`
        EXISTS (
          SELECT 1
          FROM produto_categoria pc
          INNER JOIN categorias c
            ON c.id_categoria = pc.id_categoria
          WHERE pc.id_produto = p.id_produto
            AND c.nome = ?
        )
      `);
      params.push(f.categoria);
    }

    if (f.precoMin !== undefined) {
      where.push("p.preco >= ?");
      params.push(f.precoMin);
    }

    if (f.precoMax !== undefined) {
      where.push("p.preco <= ?");
      params.push(f.precoMax);
    }

    const condicao = where.length
      ? "WHERE " + where.join(" AND ")
      : "";

    const [contagem] = await this.#db.execute<ContagemLinha[]>(
      `SELECT COUNT(*) AS total
       FROM produtos p
       ${condicao}`,
      params,
    );

    const total = Number(contagem[0]?.total ?? 0);

    const porPagina = Math.min(
      50,
      Math.max(1, Math.floor(f.porPagina ?? 8)),
    );

    const totalPaginas = Math.ceil(total / porPagina);

    const paginaSolicitada = Math.max(
      1,
      Math.floor(f.pagina ?? 1),
    );

    const pagina = Math.min(
      paginaSolicitada,
      Math.max(1, totalPaginas),
    );

    const offset = (pagina - 1) * porPagina;

    const sql = `
      SELECT
        p.id_produto AS id,
        p.nome,
        p.descricao,
        p.preco,
        p.estoque,
        p.imagem,
        p.genero,
        COALESCE(
          (
            SELECT GROUP_CONCAT(
              c.nome ORDER BY c.nome SEPARATOR ', '
            )
            FROM produto_categoria pc
            INNER JOIN categorias c
              ON c.id_categoria = pc.id_categoria
            WHERE pc.id_produto = p.id_produto
          ),
          ''
        ) AS categoria
      FROM produtos p
      ${condicao}
      ORDER BY p.nome ASC
      LIMIT ? OFFSET ?
    `;

    const [produtos] = await this.#db.execute<ProdutoLinha[]>(
      sql,
      [...params, porPagina, offset],
    );

    return {
      produtos: produtos.map((p) => ({
        ...p,
        preco: Number(p.preco),
      })),
      total,
      pagina,
      porPagina,
      totalPaginas,
    };
  }

  async validarCupom(
    codigo: string,
  ): Promise<{ codigo: string; percentual: number }> {
    const [cupons] = await this.#db.execute<CupomLinha[]>(
      `SELECT
         codigo,
         percentual_desconto AS percentual
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

  /** Dados para os gráficos do dashboard. */
  async dashboard() {
    const [produtosRows] =
      await this.#db.execute<ProdutoDashboard[]>(
        `SELECT
           p.id_produto AS id,
           p.nome,
           COALESCE(
             (
               SELECT GROUP_CONCAT(
                 c.nome ORDER BY c.nome SEPARATOR ', '
               )
               FROM produto_categoria pc
               INNER JOIN categorias c
                 ON c.id_categoria = pc.id_categoria
               WHERE pc.id_produto = p.id_produto
             ),
             ''
           ) AS categoria,
           p.genero,
           p.preco,
           p.estoque,
           COALESCE(SUM(ip.quantidade), 0) AS quantidadeVendida,
           COALESCE(
             SUM(ip.quantidade * ip.preco_unitario),
             0
           ) AS faturamento
         FROM produtos p
         LEFT JOIN itens_pedido ip
           ON ip.id_produto = p.id_produto
         GROUP BY
           p.id_produto,
           p.nome,
           p.genero,
           p.preco,
           p.estoque
         ORDER BY p.id_produto`,
      );

    const [vendasRows] =
      await this.#db.execute<VendaMes[]>(
        `SELECT
           DATE_FORMAT(pd.data_pedido, '%Y-%m') AS mes,
           COUNT(DISTINCT pd.id_pedido) AS pedidos,
           COALESCE(SUM(ip.quantidade), 0) AS unidades,
           ROUND(
             COALESCE(
               SUM(ip.quantidade * ip.preco_unitario),
               0
             ),
             2
           ) AS faturamento
         FROM pedidos pd
         INNER JOIN itens_pedido ip
           ON ip.id_pedido = pd.id_pedido
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
