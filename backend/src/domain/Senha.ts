import { ErroValidacao } from "./erros.ts";

export type NivelSenha = "fraca" | "media" | "forte";

export type AvaliacaoSenha = {
  readonly nivel: NivelSenha;
  readonly pontos: number;
  readonly sugestoes: readonly string[];
};

const SENHAS_COMUNS = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "senha123",
  "qwerty123", "qwertyui", "abc12345", "11111111", "iloveyou", "admin123",
  "senha1234", "mudar123", "brasil123", "12341234", "00000000", "abcd1234",
]);

const MIN = 8;
const MAX = 128;

export class Senha {
  readonly #texto: string;

  private constructor(texto: string) {
    this.#texto = texto;
  }

  static avaliar(texto: string): AvaliacaoSenha {
    const sugestoes: string[] = [];
    let pontos = 0;

    if (texto.length >= MIN) pontos++;
    else sugestoes.push(`usar pelo menos ${MIN} caracteres`);

    if (texto.length >= 12) pontos++;
    else sugestoes.push("usar 12 ou mais caracteres");

    if (/[a-z]/.test(texto)) pontos++;
    else sugestoes.push("incluir letra minúscula");

    if (/[A-Z]/.test(texto)) pontos++;
    else sugestoes.push("incluir letra maiúscula");

    if (/\d/.test(texto)) pontos++;
    else sugestoes.push("incluir número");

    if (/[^A-Za-z0-9]/.test(texto)) pontos++;
    else sugestoes.push("incluir símbolo (ex.: !@#$)");

    const previsivel =
      SENHAS_COMUNS.has(texto.toLowerCase()) ||
      /^(.)\1+$/.test(texto) ||
      Senha.#ehSequencia(texto);

    let nivel: NivelSenha = pontos >= 5 ? "forte" : pontos === 4 ? "media" : "fraca";
    if (previsivel) {
      nivel = "fraca";
      sugestoes.unshift("evitar senhas comuns ou sequências (123456, abcdef, aaaa)");
    }
    return { nivel, pontos, sugestoes };
  }

  static #ehSequencia(texto: string): boolean {
    if (texto.length < 4) return false;
    const t = texto.toLowerCase();
    let cresc = true;
    let decresc = true;
    for (let i = 1; i < t.length; i++) {
      const diff = t.charCodeAt(i) - t.charCodeAt(i - 1);
      if (diff !== 1) cresc = false;
      if (diff !== -1) decresc = false;
    }
    return cresc || decresc;
  }

  
  static criar(texto: unknown): Senha {
    if (typeof texto !== "string" || texto === "") {
      throw new ErroValidacao({ senha: "Senha é obrigatória" });
    }
    if (texto.length < MIN) {
      throw new ErroValidacao({ senha: `Senha deve ter pelo menos ${MIN} caracteres` });
    }
    if (texto.length > MAX) {
      throw new ErroValidacao({ senha: `Senha deve ter no máximo ${MAX} caracteres` });
    }
    if (!/[A-Za-z]/.test(texto) || !/\d/.test(texto)) {
      throw new ErroValidacao({ senha: "Senha deve conter letras e números" });
    }
    const { nivel, sugestoes } = Senha.avaliar(texto);
    if (nivel === "fraca") {
      throw new ErroValidacao({
        senha: `Senha fraca. Tente ${sugestoes.slice(0, 2).join(" e ")}`,
      });
    }
    return new Senha(texto);
  }

  gerarHash(hasher: { hash(texto: string): string }): string {
    return hasher.hash(this.#texto);
  }

  toString(): string {
    return "********";
  }

  toJSON(): string {
    return "********";
  }
}
