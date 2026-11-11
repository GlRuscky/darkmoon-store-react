import { ErroValidacao } from "./erros.ts";

export class Cpf {
  readonly #digitos: string;

  private constructor(digitos: string) {
    this.#digitos = digitos;
  }

  static criar(entrada: unknown): Cpf {
    if (typeof entrada !== "string" || entrada.trim() === "") {
      throw new ErroValidacao({ cpf: "CPF é obrigatório" });
    }

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

  static ehValido(entrada: unknown): boolean {
    try {
      Cpf.criar(entrada);
      return true;
    } catch {
      return false;
    }
  }

  static #digitosVerificadoresCorretos(d: string): boolean {
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

  get numeros(): string {
    return this.#digitos;
  }

  get formatado(): string {
    const d = this.#digitos;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

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
