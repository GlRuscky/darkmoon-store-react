
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
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
  percentual: number | string;
  ativo: number;
};

type CategoriaLinha = RowDataPacket & {
  id_categoria: number;
};

export class CatalogoAdminService {
  readonly #db: Banco;

  constructor(db: Banco) {
    this.#db = db;
  }

  async #comTransacao<T>(
    operacao: (conexao: PoolConnection) => Promise<T>,
  ): Promise<T> {
    const conexao = await this.#db.getConnection();
    let transacaoIniciada = false;

    try {
      await conexao.beginTransaction();
      transacaoIniciada = true;

      const resultado = await operacao(conexao);

      await conexao.commit();
      return resultado;
    } catch (erro) {
      if (transacaoIniciada) {
        try {
          await conexao.rollback();
        } catch {
          // Preserva o erro original da operação.
        }
      }

      throw erro;
    } finally {
      conexao.release();
    }
  }

  async #categoriaPorNome(
    nome: string,
    conexao: PoolConnection,
  ): Promise<number> {
    const [linhas] = await conexao.execute<CategoriaLinha[]>(
      `SELECT id_categoria
       FROM categorias
       WHERE nome = ?`,
      [nome],
    );

    if (!linhas[0]) {
      throw new ErroNaoEncontrado("Categoria não encontrada");
    }

    return linhas[0].id_categoria;
  }

  // ---------- Categorias ----------

  async listarCategorias(): Promise<{ id: number; nome: string }[]> {
    const [linhas] = await this.#db.execute<
      (RowDataPacket & { id_categoria: number; nome: string })[]
    >(
      `SELECT id_categoria, nome
      FROM categorias
      ORDER BY nome`,
    );

    return linhas.map((categoria) => ({
      id: categoria.id_categoria,
      nome: categoria.nome,
    }));
  }

    async criarCategoria(corpo: unknown): Promise<{ id: number; nome: string }> {
    const dados = (
      typeof corpo === "object" && corpo !== null ? corpo : {}
    ) as Record<string, unknown>;

    const nome =
      typeof dados.nome === "string" ? dados.nome.trim() : "";

    if (nome.length < 2 || nome.length > 100) {
      throw new ErroConflito({
        nome: "O nome da categoria deve ter entre 2 e 100 caracteres",
      });
    }

    const [existentes] = await this.#db.execute<RowDataPacket[]>(
      `SELECT id_categoria
      FROM categorias
      WHERE LOWER(nome) = LOWER(?)`,
      [nome],
    );

    if (existentes.length > 0) {
      throw new ErroConflito({
        nome: "Já existe uma categoria com esse nome",
      });
    }

    try {
      const [resultado] = await this.#db.execute<ResultSetHeader>(
        `INSERT INTO categorias (nome) VALUES (?)`,
        [nome],
      );

      return {
        id: Number(resultado.insertId),
        nome,
      };
    } catch (erro) {
      const erroSql = erro as { code?: string };

      if (erroSql.code === "ER_DUP_ENTRY") {
        throw new ErroConflito({
          nome: "Já existe uma categoria com esse nome",
        });
      }

      throw erro;
    }
  }

    async atualizarCategoria(
    id: number,
    corpo: unknown,
  ): Promise<{ id: number; nome: string }> {
    const dados = (
      typeof corpo === "object" && corpo !== null ? corpo : {}
    ) as Record<string, unknown>;

    const nome =
      typeof dados.nome === "string" ? dados.nome.trim() : "";

    if (nome.length < 2 || nome.length > 100) {
      throw new ErroConflito({
        nome: "O nome da categoria deve ter entre 2 e 100 caracteres",
      });
    }

    const [atuais] = await this.#db.execute<
      (RowDataPacket & { id_categoria: number; nome: string })[]
    >(
      `SELECT id_categoria, nome
      FROM categorias
      WHERE id_categoria = ?`,
      [id],
    );

    if (!atuais[0]) {
      throw new ErroNaoEncontrado("Categoria não encontrada");
    }

    const [duplicadas] = await this.#db.execute<RowDataPacket[]>(
      `SELECT id_categoria
      FROM categorias
      WHERE LOWER(nome) = LOWER(?)
        AND id_categoria <> ?`,
      [nome, id],
    );

    if (duplicadas.length > 0) {
      throw new ErroConflito({
        nome: "Já existe outra categoria com esse nome",
      });
    }

    await this.#db.execute(
      `UPDATE categorias
      SET nome = ?
      WHERE id_categoria = ?`,
      [nome, id],
    );

    return { id, nome };
  }

  async removerCategoria(id: number): Promise<void> {
    const [categorias] = await this.#db.execute<
      (RowDataPacket & { id_categoria: number })[]
    >(
      `SELECT id_categoria
      FROM categorias
      WHERE id_categoria = ?`,
      [id],
    );

    if (!categorias[0]) {
      throw new ErroNaoEncontrado("Categoria não encontrada");
    }

    const [produtos] = await this.#db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
      FROM produto_categoria
      WHERE id_categoria = ?`,
      [id],
    );

    if (Number(produtos[0]?.total ?? 0) > 0) {
      throw new ErroConflito(
        { geral: "Categoria possui produtos associados" },
        "Não é possível excluir uma categoria que possui produtos associados.",
      );
    }

    await this.#db.execute(
      `DELETE FROM categorias
      WHERE id_categoria = ?`,
      [id],
    );
  }

  // ---------- Produtos ----------

  async listarProdutos(): Promise<ProdutoLinha[]> {
    const [linhas] = await this.#db.execute<ProdutoLinha[]>(
      `SELECT
         p.id_produto AS id,
         p.nome,
         p.descricao,
         p.preco,
         p.estoque,
         p.imagem,
         p.genero,
         COALESCE(
           (
             SELECT c.nome
             FROM produto_categoria pc
             INNER JOIN categorias c
               ON c.id_categoria = pc.id_categoria
             WHERE pc.id_produto = p.id_produto
             LIMIT 1
           ),
           ''
         ) AS categoria
       FROM produtos p
       ORDER BY p.id_produto`,
    );

    return linhas;
  }

  async #produtoPorId(id: number): Promise<ProdutoLinha> {
    const [linhas] = await this.#db.execute<ProdutoLinha[]>(
      `SELECT
         p.id_produto AS id,
         p.nome,
         p.descricao,
         p.preco,
         p.estoque,
         p.imagem,
         p.genero,
         COALESCE(
           (
             SELECT c.nome
             FROM produto_categoria pc
             INNER JOIN categorias c
               ON c.id_categoria = pc.id_categoria
             WHERE pc.id_produto = p.id_produto
             LIMIT 1
           ),
           ''
         ) AS categoria
       FROM produtos p
       WHERE p.id_produto = ?`,
      [id],
    );

    if (!linhas[0]) {
      throw new ErroNaoEncontrado("Produto não encontrado");
    }

    return linhas[0];
  }

  async criarProduto(corpo: unknown): Promise<ProdutoLinha> {
    const d = Produto.criar(corpo).paraPersistencia();

    const resultado = await this.#comTransacao(async (conexao) => {
      const idCategoria = await this.#categoriaPorNome(
        d.categoria,
        conexao,
      );

      const [insercao] = await conexao.execute<ResultSetHeader>(
        `INSERT INTO produtos
          (nome, descricao, preco, estoque, imagem, genero)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          d.nome,
          d.descricao,
          d.preco,
          d.estoque,
          d.imagem,
          d.genero,
        ],
      );

      const idProduto = Number(insercao.insertId);

      await conexao.execute(
        `INSERT INTO produto_categoria
          (id_produto, id_categoria)
         VALUES (?, ?)`,
        [idProduto, idCategoria],
      );

      return idProduto;
    });

    return this.#produtoPorId(resultado);
  }

  async atualizarProduto(
    id: number,
    corpo: unknown,
  ): Promise<ProdutoLinha> {
    await this.#produtoPorId(id);

    const d = Produto.criar(corpo).paraPersistencia();

    await this.#comTransacao(async (conexao) => {
      const idCategoria = await this.#categoriaPorNome(
        d.categoria,
        conexao,
      );

      await conexao.execute(
        `UPDATE produtos
         SET nome = ?,
             descricao = ?,
             preco = ?,
             estoque = ?,
             imagem = ?,
             genero = ?
         WHERE id_produto = ?`,
        [
          d.nome,
          d.descricao,
          d.preco,
          d.estoque,
          d.imagem,
          d.genero,
          id,
        ],
      );

      await conexao.execute(
        `DELETE FROM produto_categoria
         WHERE id_produto = ?`,
        [id],
      );

      await conexao.execute(
        `INSERT INTO produto_categoria
          (id_produto, id_categoria)
         VALUES (?, ?)`,
        [id, idCategoria],
      );
    });

    return this.#produtoPorId(id);
  }

  async removerProduto(id: number): Promise<void> {
    await this.#produtoPorId(id);

    const [linhas] = await this.#db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM itens_pedido
       WHERE id_produto = ?`,
      [id],
    );

    const total = Number(linhas[0]?.total ?? 0);

    if (total > 0) {
      throw new ErroConflito(
        { geral: "Este produto já tem vendas" },
        "Este produto já foi vendido e não pode ser excluído. Zere o estoque para tirá-lo de venda.",
      );
    }

    await this.#comTransacao(async (conexao) => {
      await conexao.execute(
        `DELETE FROM produto_categoria
         WHERE id_produto = ?`,
        [id],
      );

      await conexao.execute(
        `DELETE FROM produtos
         WHERE id_produto = ?`,
        [id],
      );
    });
  }

  // ---------- Cupons ----------

  async listarCupons(): Promise<
    { codigo: string; percentual: number; ativo: boolean }[]
  > {
    const [linhas] = await this.#db.execute<CupomLinha[]>(
      `SELECT
         codigo,
         percentual_desconto AS percentual,
         ativo
       FROM cupons
       ORDER BY codigo`,
    );

    return linhas.map((c) => ({
      codigo: c.codigo,
      percentual: Number(c.percentual),
      ativo: Number(c.ativo) === 1,
    }));
  }

  async #cupomPorCodigo(
    codigo: string,
  ): Promise<{ codigo: string; percentual: number; ativo: boolean }> {
    const [linhas] = await this.#db.execute<CupomLinha[]>(
      `SELECT
         codigo,
         percentual_desconto AS percentual,
         ativo
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
      percentual: Number(c.percentual),
      ativo: Number(c.ativo) === 1,
    };
  }

  async criarCupom(
    corpo: unknown,
  ): Promise<{ codigo: string; percentual: number; ativo: boolean }> {
    const d = Cupom.criar(corpo).paraPersistencia();

    const [existentes] = await this.#db.execute<RowDataPacket[]>(
      `SELECT 1 AS encontrado
       FROM cupons
       WHERE codigo = ?`,
      [d.codigo],
    );

    if (existentes.length > 0) {
      throw new ErroConflito({
        codigo: "Já existe um cupom com este código",
      });
    }

    try {
      await this.#db.execute<ResultSetHeader>(
        `INSERT INTO cupons
          (codigo, percentual_desconto, ativo)
         VALUES (?, ?, ?)`,
        [d.codigo, d.percentual, d.ativo ? 1 : 0],
      );
    } catch (erro) {
      const erroSql = erro as { code?: string };

      if (erroSql.code === "ER_DUP_ENTRY") {
        throw new ErroConflito({
          codigo: "Já existe um cupom com este código",
        });
      }

      throw erro;
    }

    return this.#cupomPorCodigo(d.codigo);
  }

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
       SET percentual_desconto = ?,
           ativo = ?
       WHERE codigo = ?`,
      [d.percentual, d.ativo ? 1 : 0, atual.codigo],
    );

    return this.#cupomPorCodigo(atual.codigo);
  }

  async removerCupom(codigo: string): Promise<void> {
    const atual = await this.#cupomPorCodigo(codigo);

    await this.#db.execute(
      `DELETE FROM cupons
       WHERE codigo = ?`,
      [atual.codigo],
    );
  }
}
