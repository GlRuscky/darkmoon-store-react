import { ErroValidacao } from "./erros.ts";

/**
 * Objeto de valor CPF.
 *
 * - O construtor é privado: só se cria um Cpf por `Cpf.criar()`, que valida.
 *   Logo, NUNCA existe um objeto Cpf inválido no sistema.
 * - O estado (#digitos) é um campo privado nativo e imutável.
 * - Não há setter: CPF não muda depois de criado.
 */
export class Cpf {
  readonly #digitos: string;

  private constructor(digitos: string) {
    this.#digitos = digitos;
  }

  /** Aceita "123.456.789-09", "12345678909" ou com espaços; lança ErroValidacao se inválido. */
  static criar(entrada: unknown): Cpf {
    if (typeof entrada !== "string" || entrada.trim() === "") {
      throw new ErroValidacao({ cpf: "CPF é obrigatório" });
    }
    // Só aceitamos dígitos e a pontuação usual; letras = erro (e não "limpeza silenciosa").
    if (!/^[\d.\-\s]+$/.test(entrada)) {
      throw new ErroValidacao({ cpf: "CPF deve conter apenas números" });
    }
    const digitos = entrada.replace(/\D/g, "");
    if (digitos.length !== 11) {
      throw new ErroValidacao({ cpf: "CPF deve ter 11 dígitos" });
    }
    if (!Cpf.#digitosVerificadoresCorretos(digitos)) {
      throw new ErroValidacao({ cpf: "CPF inválido" });
    }
    return new Cpf(digitos);
  }

  /** Versão que não lança, útil para checagens rápidas. */
  static ehValido(entrada: unknown): boolean {
    try {
      Cpf.criar(entrada);
      return true;
    } catch {
      return false;
    }
  }

  /** Algoritmo oficial: dois dígitos verificadores módulo 11. */
  static #digitosVerificadoresCorretos(d: string): boolean {
    // 111.111.111-11, 000.000.000-00 etc. passam na conta mas são inválidos.
    if (/^(\d)\1{10}$/.test(d)) return false;

    const calcular = (base: string, pesoInicial: number): number => {
      let soma = 0;
      for (let i = 0; i < base.length; i++) {
        soma += Number(base[i]) * (pesoInicial - i);
      }
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };

    const dv1 = calcular(d.slice(0, 9), 10);
    const dv2 = calcular(d.slice(0, 10), 11);
    return dv1 === Number(d[9]) && dv2 === Number(d[10]);
  }

  /** Apenas os 11 dígitos — é o formato salvo no banco. */
  get numeros(): string {
    return this.#digitos;
  }

  /** 123.456.789-09 */
  get formatado(): string {
    const d = this.#digitos;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  /** ***.***.789-09 — o que a API devolve ao cliente (LGPD: não expor o CPF inteiro). */
  get mascarado(): string {
    const d = this.#digitos;
    return `***.***.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  equals(outro: Cpf): boolean {
    return this.#digitos === outro.#digitos;
  }

  toString(): string {
    return this.mascarado;
  }
}
