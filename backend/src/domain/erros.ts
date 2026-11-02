/**
 * Erros de domínio. Cada um carrega o status HTTP que a camada de rede deve usar,
 * assim o domínio não precisa conhecer HTTP: quem converte é o servidor.
 */

/** Dados inválidos (HTTP 400). Guarda uma mensagem por campo. */
export class ErroValidacao extends Error {
  readonly #campos: Readonly<Record<string, string>>;

  constructor(campos: Record<string, string>) {
    super("Dados inválidos");
    this.name = "ErroValidacao";
    this.#campos = Object.freeze({ ...campos });
  }

  /** Cópia congelada: quem recebe não consegue alterar o erro por fora. */
  get campos(): Readonly<Record<string, string>> {
    return this.#campos;
  }
}

/** Recurso já existe (HTTP 409), ex.: e-mail ou CPF duplicado. */
export class ErroConflito extends Error {
  readonly #campos: Readonly<Record<string, string>>;

  constructor(campos: Record<string, string>, mensagem = "Dados já cadastrados") {
    super(mensagem);
    this.name = "ErroConflito";
    this.#campos = Object.freeze({ ...campos });
  }

  get campos(): Readonly<Record<string, string>> {
    return this.#campos;
  }
}

/** Login ou token inválido (HTTP 401). Mensagem propositalmente genérica. */
export class ErroNaoAutorizado extends Error {
  constructor(mensagem = "E-mail ou senha inválidos") {
    super(mensagem);
    this.name = "ErroNaoAutorizado";
  }
}

/** Recurso não encontrado (HTTP 404). */
export class ErroNaoEncontrado extends Error {
  constructor(mensagem = "Recurso não encontrado") {
    super(mensagem);
    this.name = "ErroNaoEncontrado";
  }
}

/** Logado, mas sem permissão para a ação (HTTP 403). */
export class ErroProibido extends Error {
  constructor(mensagem = "Acesso restrito a administradores") {
    super(mensagem);
    this.name = "ErroProibido";
  }
}
