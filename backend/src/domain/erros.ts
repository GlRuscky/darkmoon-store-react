export class ErroValidacao extends Error {
  readonly #campos: Readonly<Record<string, string>>;

  constructor(campos: Record<string, string>) {
    super("Dados inválidos");
    this.name = "ErroValidacao";
    this.#campos = Object.freeze({ ...campos });
  }

  get campos(): Readonly<Record<string, string>> {
    return this.#campos;
  }
}

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

export class ErroNaoAutorizado extends Error {
  constructor(mensagem = "E-mail ou senha inválidos") {
    super(mensagem);
    this.name = "ErroNaoAutorizado";
  }
}

export class ErroNaoEncontrado extends Error {
  constructor(mensagem = "Recurso não encontrado") {
    super(mensagem);
    this.name = "ErroNaoEncontrado";
  }
}

export class ErroProibido extends Error {
  constructor(mensagem = "Acesso restrito a administradores") {
    super(mensagem);
    this.name = "ErroProibido";
  }
}
