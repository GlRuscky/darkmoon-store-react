import { Cpf } from "./Cpf.ts";
import { Email } from "./Email.ts";
import { ErroValidacao } from "./erros.ts";
import type { Papel } from "./Papel.ts";

export type DadosPersistidos = {
  id: number | null;
  nome: string;
  email: string;
  cpf: string;
  senhaHash: string;
  papel: Papel;
  criadoEm: string;
};

export type UsuarioPublico = {
  id: number | null;
  nome: string;
  email: string;
  cpf: string;
  papel: Papel;
  criadoEm: string;
};

/**
 * Entidade Usuario.
 *
 * Encapsulamento:
 *  - Todo estado é campo privado (#). Nada é alterável por fora.
 *  - `nome` tem getter E setter porque o setter tem regra de negócio (validação).
 *  - `email`, `cpf`, `id`, `criadoEm` só têm getter: são imutáveis depois de criados.
 *  - `papel` só tem getter: ninguém troca o papel "por dentro". Promover/rebaixar gera uma cópia
 *    (`comPapel`), e quem decide isso é o serviço, depois de checar que quem pediu é admin.
 *  - `senhaHash` NÃO tem getter: ninguém de fora precisa lê-lo. Quem verifica a senha é o
 *    próprio objeto (`conferirSenha`) e quem persiste usa `paraPersistencia()`.
 */
export class Usuario {
  readonly #id: number | null;
  #nome: string;
  readonly #email: Email;
  readonly #cpf: Cpf;
  readonly #senhaHash: string;
  readonly #papel: Papel;
  readonly #criadoEm: Date;

  constructor(args: {
    id?: number | null;
    nome: string;
    email: Email;
    cpf: Cpf;
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

  /** Pública e estática: o serviço valida o nome junto com os outros campos antes de criar o objeto. */
  static validarNome(entrada: unknown): string {
    if (typeof entrada !== "string" || entrada.trim() === "") {
      throw new ErroValidacao({ nome: "Nome é obrigatório" });
    }
    // colapsa espaços repetidos: "  Ana   Maria " -> "Ana Maria"
    const nome = entrada.trim().replace(/\s+/g, " ");
    if (nome.length < 3) {
      throw new ErroValidacao({ nome: "Nome deve ter pelo menos 3 caracteres" });
    }
    if (nome.length > 150) {
      throw new ErroValidacao({ nome: "Nome deve ter no máximo 150 caracteres" });
    }
    // letras (com acento), espaço, apóstrofo, ponto e hífen
    if (!/^[\p{L}][\p{L}\s'.\-]*$/u.test(nome)) {
      throw new ErroValidacao({ nome: "Nome deve conter apenas letras" });
    }
    return nome;
  }

  /** Reconstrói a entidade a partir do que veio do banco. */
  static reidratar(d: DadosPersistidos): Usuario {
    return new Usuario({
      id: d.id,
      nome: d.nome,
      email: Email.criar(d.email),
      cpf: Cpf.criar(d.cpf),
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

  /** Setter com regra: o nome novo passa pela mesma validação do construtor. */
  set nome(novo: string) {
    this.#nome = Usuario.validarNome(novo);
  }

  get email(): string {
    return this.#email.endereco;
  }

  get cpf(): Cpf {
    return this.#cpf;
  }

  get papel(): Papel {
    return this.#papel;
  }

  get ehAdmin(): boolean {
    return this.#papel === "admin";
  }

  get criadoEm(): Date {
    // devolve cópia: Date é mutável e não queremos que ninguém altere o original
    return new Date(this.#criadoEm);
  }

  /** Verifica a senha sem nunca expor o hash. */
  conferirSenha(texto: string, verificador: { verificar(t: string, h: string): boolean }): boolean {
    return verificador.verificar(texto, this.#senhaHash);
  }

  /** Cópia da entidade com o id gerado pelo banco (a original não é alterada). */
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

  /** Cópia com outro papel (a original não muda). */
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

  /** Único caminho que entrega o hash: para o repositório gravar no banco. */
  paraPersistencia(): DadosPersistidos {
    return {
      id: this.#id,
      nome: this.#nome,
      email: this.#email.endereco,
      cpf: this.#cpf.numeros,
      senhaHash: this.#senhaHash,
      papel: this.#papel,
      criadoEm: this.#criadoEm.toISOString(),
    };
  }

  /** O que pode sair pela API: sem hash e com CPF mascarado. */
  paraResposta(): UsuarioPublico {
    return {
      id: this.#id,
      nome: this.#nome,
      email: this.#email.endereco,
      cpf: this.#cpf.mascarado,
      papel: this.#papel,
      criadoEm: this.#criadoEm.toISOString(),
    };
  }

  toJSON(): UsuarioPublico {
    return this.paraResposta();
  }
}
