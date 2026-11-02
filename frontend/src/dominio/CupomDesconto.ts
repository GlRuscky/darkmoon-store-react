/**
 * Cupom de desconto (transcrição de validarCupom/aplicarDesconto do funcoes.php).
 * O percentual é validado no construtor e nunca muda depois: não há setter.
 */
export class CupomDesconto {
  readonly #codigo: string;
  readonly #percentual: number;

  constructor(codigo: string, percentual: number) {
    const c = codigo.trim().toUpperCase();
    if (c === "") throw new Error("Código do cupom é obrigatório");
    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
      throw new Error("Percentual de desconto deve estar entre 0 e 100");
    }
    this.#codigo = c;
    this.#percentual = percentual;
  }

  get codigo(): string {
    return this.#codigo;
  }

  get percentual(): number {
    return this.#percentual;
  }

  /** Aplica o desconto em centavos (inteiros) para não acumular erro de ponto flutuante. */
  aplicarEmCentavos(centavos: number): number {
    return Math.round(centavos - (centavos * this.#percentual) / 100);
  }
}
