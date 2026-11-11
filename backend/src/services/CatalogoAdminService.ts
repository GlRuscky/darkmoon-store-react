
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { Banco } from "../infra/banco.ts";
import { Cupom } from "../domain/Cupom.ts";
import { ErroConflito, ErroNaoEncontrado } from "../domain/erros.ts";
import { Produto } from "../domain/Produto.ts";

type ProdutoLinha = RowDataPacket & {
  id: number;
  nome: string;
  descricao: string;
  preco: number | string;
  estoque: number;
  imagem: string;
  genero: string;
  categoria: string;
};

type CupomLinha = RowDataPacket & {
  codigo: string;
  percentual: number;
  ativo: number;
};

export class CatalogoAdminService {
  readonly #db: Banco;

  constructor(db: Banco) {
    this.#db = db;
  }

  // ---------- Produtos ----------

  async listarProdutos(): Promise<ProdutoLinha[]> {
    const [linhas] = await this.#db.execute<ProdutoLinha[]>(
      `SELECT id, nome, descricao, preco, estoque, imagem, genero, categoria
       FROM produtos
       ORDER BY id`,
    );

    return linhas;
  }

  async #produtoPorId(id: number): Promise<ProdutoLinha> {
    const [linhas] = await this.#db.execute<ProdutoLinha[]>(
      `SELECT id, nome, descricao, preco, estoque, imagem, genero, categoria
       FROM produtos
       WHERE id = ?`,
      [id],
    );

    if (!linhas[0]) {
      throw new ErroNaoEncontrado("Produto não encontrado");
    }

    return linhas[0];
  }

  async criarProduto(corpo: unknown): Promise<ProdutoLinha> {
    const d = Produto.criar(corpo).paraPersistencia();

    const [resultado] = await this.#db.execute<ResultSetHeader>(
      `INSERT INTO produtos
        (nome, descricao, preco, estoque, imagem, genero, categoria)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        d.nome,
        d.descricao,
        d.preco,
        d.estoque,
        d.imagem,
        d.genero,
        d.categoria,
      ],
    );

    return this.#produtoPorId(Number(resultado.insertId));
  }

  async atualizarProduto(
    id: number,
    corpo: unknown,
  ): Promise<ProdutoLinha> {
    await this.#produtoPorId(id);

    const d = Produto.criar(corpo).paraPersistencia();

    await this.#db.execute(
      `UPDATE produtos
       SET nome = ?, descricao = ?, preco = ?, estoque = ?,
           imagem = ?, genero = ?, categoria = ?
       WHERE id = ?`,
      [
        d.nome,
        d.descricao,
        d.preco,
        d.estoque,
        d.imagem,
        d.genero,
        d.categoria,
        id,
      ],
    );

    return this.#produtoPorId(id);
  }

  async removerProduto(id: number): Promise<void> {
    await this.#produtoPorId(id);

    const [linhas] = await this.#db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM itens_pedido
       WHERE produto_id = ?`,
      [id],
    );

    const total = Number(linhas[0].total);

    if (total > 0) {
      // Preserva o histórico de vendas e os gráficos do dashboard.
      throw new ErroConflito(
        { geral: "Este produto já tem vendas" },
        "Este produto já foi vendido e não pode ser excluído. Zere o estoque para tirá-lo de venda.",
      );
    }

    await this.#db.execute(
      "DELETE FROM produtos WHERE id = ?",
      [id],
    );
  }

  // ---------- Cupons ----------

  async listarCupons(): Promise<
    { codigo: string; percentual: number; ativo: boolean }[]
  > {
    const [linhas] = await this.#db.execute<CupomLinha[]>(
      `SELECT codigo, percentual, ativo
       FROM cupons
       ORDER BY codigo`,
    );

    return linhas.map((c) => ({
      codigo: c.codigo,
      percentual: c.percentual,
      ativo: Number(c.ativo) === 1,
    }));
  }

  async #cupomPorCodigo(
    codigo: string,
  ): Promise<{ codigo: string; percentual: number; ativo: boolean }> {
    const [linhas] = await this.#db.execute<CupomLinha[]>(
      `SELECT codigo, percentual, ativo
       FROM cupons
       WHERE codigo = ?`,
      [codigo.trim().toUpperCase()],
    );

    const c = linhas[0];

    if (!c) {
      throw new ErroNaoEncontrado("Cupom não encontrado");
    }

    return {
      codigo: c.codigo,
      percentual: c.percentual,
      ativo: Number(c.ativo) === 1,
    };
  }

  async criarCupom(
    corpo: unknown,
  ): Promise<{ codigo: string; percentual: number; ativo: boolean }> {
    const d = Cupom.criar(corpo).paraPersistencia();

    const [existentes] = await this.#db.execute<RowDataPacket[]>(
      "SELECT 1 AS encontrado FROM cupons WHERE codigo = ?",
      [d.codigo],
    );

    if (existentes.length > 0) {
      throw new ErroConflito({
        codigo: "Já existe um cupom com este código",
      });
    }

    try {
      await this.#db.execute<ResultSetHeader>(
        `INSERT INTO cupons (codigo, percentual, ativo)
         VALUES (?, ?, ?)`,
        [d.codigo, d.percentual, d.ativo ? 1 : 0],
      );
    } catch (e) {
      const erro = e as { code?: string };

      if (erro.code === "ER_DUP_ENTRY") {
        throw new ErroConflito({
          codigo: "Já existe um cupom com este código",
        });
      }

      throw e;
    }

    return this.#cupomPorCodigo(d.codigo);
  }

  /**
   * O código identifica o cupom e não muda:
   * só percentual e ativo são editáveis.
   */
  async atualizarCupom(
    codigo: string,
    corpo: unknown,
  ): Promise<{ codigo: string; percentual: number; ativo: boolean }> {
    const atual = await this.#cupomPorCodigo(codigo);

    const dados = (
      typeof corpo === "object" && corpo !== null ? corpo : {}
    ) as Record<string, unknown>;

    const d = Cupom.criar({
      ativo: atual.ativo,
      ...dados,
      codigo: atual.codigo,
    }).paraPersistencia();

    await this.#db.execute(
      `UPDATE cupons
       SET percentual = ?, ativo = ?
       WHERE codigo = ?`,
      [d.percentual, d.ativo ? 1 : 0, atual.codigo],
    );

    return this.#cupomPorCodigo(atual.codigo);
  }

  async removerCupom(codigo: string): Promise<void> {
    const atual = await this.#cupomPorCodigo(codigo);

    await this.#db.execute(
      "DELETE FROM cupons WHERE codigo = ?",
      [atual.codigo],
    );
  }
}
