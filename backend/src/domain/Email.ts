import { ErroValidacao } from "./erros.ts";

export class Email {
  readonly #endereco: string;

  private constructor(endereco: string) {
    this.#endereco = endereco;
  }

  static criar(entrada: unknown): Email {
    if (typeof entrada !== "string" || entrada.trim() === "") {
      throw new ErroValidacao({ email: "E-mail é obrigatório" });
    }
    const email = entrada.trim().toLowerCase();

    if (email.length > 254) {
      throw new ErroValidacao({ email: "E-mail muito longo" });
    }

    const partes = email.split("@");
    if (partes.length !== 2) {
      throw new ErroValidacao({ email: "E-mail inválido" });
    }
    const [local, dominio] = partes as [string, string];

    const localOk =
      local.length >= 1 &&
      local.length <= 64 &&
      /^[a-z0-9._%+\-]+$/.test(local) &&
      !local.startsWith(".") &&
      !local.endsWith(".") &&
      !local.includes("..");

    // domínio: labels separados por ponto, TLD com 2+ letras, sem hífen nas pontas
    const dominioOk =
      /^([a-z0-9]([a-z0-9\-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(dominio);

    if (!localOk || !dominioOk) {
      throw new ErroValidacao({ email: "E-mail inválido" });
    }
    return new Email(email);
  }

  get endereco(): string {
    return this.#endereco;
  }

  equals(outro: Email): boolean {
    return this.#endereco === outro.#endereco;
  }

  toString(): string {
    return this.#endereco;
  }
}
