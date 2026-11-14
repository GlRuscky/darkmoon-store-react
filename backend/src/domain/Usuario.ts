
import { Cpf } from "./Cpf.ts";
import { Email } from "./Email.ts";
import { ErroValidacao } from "./erros.ts";
import type { Papel } from "./Papel.ts";

export type DadosPersistidos = {
  id: number | null;
  nome: string;
  email: string;
  cpf: string | null;
  senhaHash: string;
  papel: Papel;
  criadoEm: string;
};

export type UsuarioPublico = {
  id: number | null;
  nome: string;
  email: string;
  cpf: string | null;
  papel: Papel;
  criadoEm: string;
};

export class Usuario {
  readonly #id: number | null;
  #nome: string;
  readonly #email: Email;
  readonly #cpf: Cpf | null;
  readonly #senhaHash: string;
  readonly #papel: Papel;
  readonly #criadoEm: Date;

  constructor(args: {
    id?: number | null;
    nome: string;
    email: Email;
    cpf: Cpf | null;
    senhaHash: string;
    papel?: Papel;
    criadoEm?: Date;
  }) {
    if (!args.senhaHash) {
      throw new ErroValidacao({ senha: "Senha é obrigatória" });
    }

    this.#id = args.id ?? null;
    this.#nome = Usuario.validarNome(args.nome);
    this.#email = args.email;
    this.#cpf = args.cpf;
    this.#senhaHash = args.senhaHash;
    this.#papel = args.papel ?? "usuario";
    this.#criadoEm = args.criadoEm ?? new Date();
  }

  static validarNome(entrada: unknown): string {
    if (typeof entrada !== "string" || entrada.trim() === "") {
      throw new ErroValidacao({ nome: "Nome é obrigatório" });
    }

    const nome = entrada.trim().replace(/\s+/g, " ");

    if (nome.length < 3) {
      throw new ErroValidacao({
        nome: "Nome deve ter pelo menos 3 caracteres",
      });
    }

    if (nome.length > 150) {
      throw new ErroValidacao({
        nome: "Nome deve ter no máximo 150 caracteres",
      });
    }

    if (!/^[\p{L}][\p{L}\s'.\-]*$/u.test(nome)) {
      throw new ErroValidacao({
        nome: "Nome deve conter apenas letras",
      });
    }

    return nome;
  }

  static reidratar(d: DadosPersistidos): Usuario {
    return new Usuario({
      id: d.id,
      nome: d.nome,
      email: Email.criar(d.email),
      cpf: d.cpf === null ? null : Cpf.criar(d.cpf),
      senhaHash: d.senhaHash,
      papel: d.papel,
      criadoEm: new Date(d.criadoEm),
    });
  }

  get id(): number | null {
    return this.#id;
  }

  get nome(): string {
    return this.#nome;
  }

  set nome(novo: string) {
    this.#nome = Usuario.validarNome(novo);
  }

  get email(): string {
    return this.#email.endereco;
  }

  get cpf(): Cpf | null {
    return this.#cpf;
  }

  get papel(): Papel {
    return this.#papel;
  }

  get ehAdmin(): boolean {
    return this.#papel === "admin";
  }

  get criadoEm(): Date {
    return new Date(this.#criadoEm);
  }

  conferirSenha(
    texto: string,
    verificador: { verificar(t: string, h: string): boolean },
  ): boolean {
    return verificador.verificar(texto, this.#senhaHash);
  }

  comId(id: number): Usuario {
    return new Usuario({
      id,
      nome: this.#nome,
      email: this.#email,
      cpf: this.#cpf,
      senhaHash: this.#senhaHash,
      papel: this.#papel,
      criadoEm: this.#criadoEm,
    });
  }

  comPapel(papel: Papel): Usuario {
    return new Usuario({
      id: this.#id,
      nome: this.#nome,
      email: this.#email,
      cpf: this.#cpf,
      senhaHash: this.#senhaHash,
      papel,
      criadoEm: this.#criadoEm,
    });
  }


  comPerfil(nome: string, cpf: Cpf, senhaHash: string): Usuario {
    return new Usuario({
      id: this.#id,
      nome,
      email: this.#email,
      cpf,
      senhaHash,
      papel: this.#papel,
      criadoEm: this.#criadoEm,
    });
  }


  paraPersistencia(): DadosPersistidos {
    return {
      id: this.#id,
      nome: this.#nome,
      email: this.#email.endereco,
      cpf: this.#cpf?.numeros ?? null,
      senhaHash: this.#senhaHash,
      papel: this.#papel,
      criadoEm: this.#criadoEm.toISOString(),
    };
  }

  paraResposta(): UsuarioPublico {
    return {
      id: this.#id,
      nome: this.#nome,
      email: this.#email.endereco,
      cpf: this.#cpf?.mascarado ?? null,
      papel: this.#papel,
      criadoEm: this.#criadoEm.toISOString(),
    };
  }

  toJSON(): UsuarioPublico {
    return this.paraResposta();
  }
}
