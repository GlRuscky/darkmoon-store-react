import type { DatabaseSync } from "node:sqlite";
import { Cupom } from "../domain/Cupom.ts";
import { ErroConflito, ErroNaoEncontrado } from "../domain/erros.ts";
import { Produto } from "../domain/Produto.ts";

/** CRUD de produtos e cupons (uso exclusivo do painel admin). Prepared statements em tudo. */
export class CatalogoAdminService {
  readonly #db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.#db = db;
  }

  // ---------- Produtos ----------

  listarProdutos() {
    return this.#db
      .prepare("SELECT id, nome, descricao, preco, estoque, imagem, genero, categoria FROM produtos ORDER BY id")
      .all();
  }

  #produtoPorId(id: number) {
    const p = this.#db
      .prepare("SELECT id, nome, descricao, preco, estoque, imagem, genero, categoria FROM produtos WHERE id = ?")
      .get(id);
    if (!p) throw new ErroNaoEncontrado("Produto não encontrado");
    return p;
  }

  criarProduto(corpo: unknown) {
    const d = Produto.criar(corpo).paraPersistencia();
    const r = this.#db
      .prepare(
        `INSERT INTO produtos (nome, descricao, preco, estoque, imagem, genero, categoria)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(d.nome, d.descricao, d.preco, d.estoque, d.imagem, d.genero, d.categoria);
    return this.#produtoPorId(Number(r.lastInsertRowid));
  }

  atualizarProduto(id: number, corpo: unknown) {
    this.#produtoPorId(id);
    const d = Produto.criar(corpo).paraPersistencia();
    this.#db
      .prepare(
        `UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?, imagem = ?, genero = ?, categoria = ?
         WHERE id = ?`,
      )
      .run(d.nome, d.descricao, d.preco, d.estoque, d.imagem, d.genero, d.categoria, id);
    return this.#produtoPorId(id);
  }

  removerProduto(id: number): void {
    this.#produtoPorId(id);
    const { total } = this.#db
      .prepare("SELECT COUNT(*) AS total FROM itens_pedido WHERE produto_id = ?")
      .get(id) as { total: number };
    if (total > 0) {
      // Apagar quebraria o histórico de vendas (e os gráficos do dashboard).
      throw new ErroConflito(
        { geral: "Este produto já tem vendas" },
        "Este produto já foi vendido e não pode ser excluído. Zere o estoque para tirá-lo de venda.",
      );
    }
    this.#db.prepare("DELETE FROM produtos WHERE id = ?").run(id);
  }

  // ---------- Cupons ----------

  listarCupons() {
    return (this.#db.prepare("SELECT codigo, percentual, ativo FROM cupons ORDER BY codigo").all() as
      { codigo: string; percentual: number; ativo: number }[]).map((c) => ({ ...c, ativo: c.ativo === 1 }));
  }

  #cupomPorCodigo(codigo: string) {
    const c = this.#db.prepare("SELECT codigo, percentual, ativo FROM cupons WHERE codigo = ?")
      .get(codigo.trim().toUpperCase()) as { codigo: string; percentual: number; ativo: number } | undefined;
    if (!c) throw new ErroNaoEncontrado("Cupom não encontrado");
    return { ...c, ativo: c.ativo === 1 };
  }

  criarCupom(corpo: unknown) {
    const d = Cupom.criar(corpo).paraPersistencia();
    const existe = this.#db.prepare("SELECT 1 FROM cupons WHERE codigo = ?").get(d.codigo);
    if (existe) throw new ErroConflito({ codigo: "Já existe um cupom com este código" });
    this.#db
      .prepare("INSERT INTO cupons (codigo, percentual, ativo) VALUES (?, ?, ?)")
      .run(d.codigo, d.percentual, d.ativo ? 1 : 0);
    return this.#cupomPorCodigo(d.codigo);
  }

  /** O código identifica o cupom e não muda: só percentual e ativo são editáveis. */
  atualizarCupom(codigo: string, corpo: unknown) {
    const atual = this.#cupomPorCodigo(codigo);
    const dados = (typeof corpo === "object" && corpo !== null ? corpo : {}) as Record<string, unknown>;
    const d = Cupom.criar({ ativo: atual.ativo, ...dados, codigo: atual.codigo }).paraPersistencia();
    this.#db
      .prepare("UPDATE cupons SET percentual = ?, ativo = ? WHERE codigo = ?")
      .run(d.percentual, d.ativo ? 1 : 0, atual.codigo);
    return this.#cupomPorCodigo(atual.codigo);
  }

  removerCupom(codigo: string): void {
    const atual = this.#cupomPorCodigo(codigo);
    this.#db.prepare("DELETE FROM cupons WHERE codigo = ?").run(atual.codigo);
  }
}
