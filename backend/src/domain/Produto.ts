import { ErroValidacao } from "./erros.ts";

export const GENEROS = ["Masculino", "Feminino", "Unissex"] as const;
export const CATEGORIAS = ["Camisas", "Vestidos", "Botas", "Acessórios"] as const;

export type DadosProduto = {
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  imagem: string;
  genero: (typeof GENEROS)[number];
  categoria: (typeof CATEGORIAS)[number];
};

/**
 * Produto do catálogo (objeto de valor, imutável).
 * O construtor é privado: o único jeito de criar é `Produto.criar()`, que valida TUDO e
 * devolve todos os erros de uma vez. Não existe setter: para "editar", cria-se outro Produto.
 */
export class Produto {
  readonly #dados: Readonly<DadosProduto>;

  private constructor(dados: DadosProduto) {
    this.#dados = Object.freeze({ ...dados });
  }

  static criar(corpo: unknown): Produto {
    const c = (typeof corpo === "object" && corpo !== null ? corpo : {}) as Record<string, unknown>;
    const erros: Record<string, string> = {};

    const nome = typeof c.nome === "string" ? c.nome.trim().replace(/\s+/g, " ") : "";
    if (nome === "") erros.nome = "Nome é obrigatório";
    else if (nome.length < 3 || nome.length > 120) erros.nome = "Nome deve ter entre 3 e 120 caracteres";

    const descricao = typeof c.descricao === "string" ? c.descricao.trim() : "";
    if (c.descricao !== undefined && c.descricao !== null && typeof c.descricao !== "string") {
      erros.descricao = "Descrição inválida";
    } else if (descricao.length > 500) erros.descricao = "Descrição deve ter no máximo 500 caracteres";

    const preco = Produto.#numero(c.preco);
    if (preco === null) erros.preco = "Preço é obrigatório e deve ser um número";
    else if (preco < 0 || preco > 100_000) erros.preco = "Preço deve estar entre 0 e 100.000";

    const estoque = Produto.#numero(c.estoque);
    if (estoque === null) erros.estoque = "Estoque é obrigatório e deve ser um número";
    else if (!Number.isInteger(estoque) || estoque < 0 || estoque > 100_000) {
      erros.estoque = "Estoque deve ser um número inteiro entre 0 e 100.000";
    }

    const imagem = typeof c.imagem === "string" ? c.imagem.trim() : "";
    if (c.imagem !== undefined && c.imagem !== null && typeof c.imagem !== "string") {
      erros.imagem = "Imagem inválida";
    } else if (imagem !== "" && !/^[A-Za-z0-9_-]{1,100}\.(webp|jpe?g|png|gif|svg)$/.test(imagem)) {
      erros.imagem = "Use só o nome do arquivo, ex.: bota1.webp";
    }

    if (!(GENEROS as readonly unknown[]).includes(c.genero)) erros.genero = "Gênero inválido";
    if (!(CATEGORIAS as readonly unknown[]).includes(c.categoria)) erros.categoria = "Categoria inválida";

    if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);

    return new Produto({
      nome,
      descricao,
      preco: Math.round((preco as number) * 100) / 100,
      estoque: estoque as number,
      imagem,
      genero: c.genero as DadosProduto["genero"],
      categoria: c.categoria as DadosProduto["categoria"],
    });
  }

  /** Aceita número ou texto numérico ("19,90" não: só ponto). Vazio/NaN/Infinity viram null. */
  static #numero(v: unknown): number | null {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  get nome(): string { return this.#dados.nome; }
  get preco(): number { return this.#dados.preco; }
  get estoque(): number { return this.#dados.estoque; }

  /** Cópia: quem recebe não altera o estado interno. */
  paraPersistencia(): DadosProduto {
    return { ...this.#dados };
  }
}
