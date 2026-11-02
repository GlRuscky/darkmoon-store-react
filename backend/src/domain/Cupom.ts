import { ErroValidacao } from "./erros.ts";

export type DadosCupom = { codigo: string; percentual: number; ativo: boolean };

/** Cupom de desconto (objeto de valor). Construtor privado + validação em `criar()`. */
export class Cupom {
  readonly #dados: Readonly<DadosCupom>;

  private constructor(dados: DadosCupom) {
    this.#dados = Object.freeze({ ...dados });
  }

  static criar(corpo: unknown): Cupom {
    const c = (typeof corpo === "object" && corpo !== null ? corpo : {}) as Record<string, unknown>;
    const erros: Record<string, string> = {};

    const codigo = typeof c.codigo === "string" ? c.codigo.trim().toUpperCase() : "";
    if (codigo === "") erros.codigo = "Código é obrigatório";
    else if (!/^[A-Z0-9_-]{3,20}$/.test(codigo)) {
      erros.codigo = "Código deve ter de 3 a 20 letras, números, - ou _";
    }

    const percentual = typeof c.percentual === "string" && c.percentual.trim() !== ""
      ? Number(c.percentual)
      : c.percentual;
    if (typeof percentual !== "number" || !Number.isFinite(percentual)) {
      erros.percentual = "Percentual é obrigatório e deve ser um número";
    } else if (percentual <= 0 || percentual > 100) {
      erros.percentual = "Percentual deve ser maior que 0 e no máximo 100";
    }

    if (c.ativo !== undefined && typeof c.ativo !== "boolean") erros.ativo = "Valor inválido para ativo";

    if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);

    return new Cupom({
      codigo,
      percentual: Math.round((percentual as number) * 100) / 100,
      ativo: c.ativo === undefined ? true : (c.ativo as boolean),
    });
  }

  get codigo(): string { return this.#dados.codigo; }

  paraPersistencia(): DadosCupom {
    return { ...this.#dados };
  }
}
