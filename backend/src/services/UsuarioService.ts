import { Cpf } from "../domain/Cpf.ts";
import { Email } from "../domain/Email.ts";
import { Senha } from "../domain/Senha.ts";
import { SenhaHasher } from "../domain/SenhaHasher.ts";
import { Usuario } from "../domain/Usuario.ts";
import {
  ErroConflito,
  ErroNaoAutorizado,
  ErroNaoEncontrado,
  ErroProibido,
  ErroValidacao,
} from "../domain/erros.ts";
import { lerPapel } from "../domain/Papel.ts";
import { TokenService } from "../infra/TokenService.ts";
import { UsuarioRepository } from "../infra/UsuarioRepository.ts";

export class UsuarioService {
  readonly #repo: UsuarioRepository;
  readonly #hasher: SenhaHasher;
  readonly #tokens: TokenService;
  /** Hash de uma senha qualquer, usado para gastar o mesmo tempo quando o e-mail não existe. */
  readonly #hashFalso: string;

  constructor(
    repo: UsuarioRepository,
    hasher: SenhaHasher,
    tokens: TokenService,
  ) {
    this.#repo = repo;
    this.#hasher = hasher;
    this.#tokens = tokens;
    this.#hashFalso = hasher.hash("senha-que-ninguem-usa");
  }

  /**
   * Cadastro: valida todos os campos de uma vez e só depois checa duplicidade.
   */
  async cadastrar(corpo: unknown): Promise<Usuario> {
    const dados = (
      typeof corpo === "object" && corpo !== null ? corpo : {}
    ) as Record<string, unknown>;

    const erros: Record<string, string> = {};

    const tentar = <T>(fn: () => T): T | undefined => {
      try {
        return fn();
      } catch (e) {
        if (e instanceof ErroValidacao) {
          Object.assign(erros, e.campos);
          return undefined;
        }
        throw e;
      }
    };

    const nome = tentar(() => Usuario.validarNome(dados.nome));
    const email = tentar(() => Email.criar(dados.email));
    const cpf = tentar(() => Cpf.criar(dados.cpf));
    const senha = tentar(() => Senha.criar(dados.senha));

    if (
      dados.confirmarSenha !== undefined &&
      dados.confirmarSenha !== dados.senha &&
      !erros.senha
    ) {
      erros.confirmarSenha = "As senhas não coincidem";
    }

    if (Object.keys(erros).length > 0) {
      throw new ErroValidacao(erros);
    }

    if (!nome || !email || !cpf || !senha) {
      throw new ErroValidacao({ geral: "Dados inválidos" });
    }

    const conflitos: Record<string, string> = {};

    if (await this.#repo.existeEmail(email.endereco)) {
      conflitos.email = "E-mail já cadastrado";
    }

    if (await this.#repo.existeCpf(cpf.numeros)) {
      conflitos.cpf = "CPF já cadastrado";
    }

    if (Object.keys(conflitos).length > 0) {
      throw new ErroConflito(conflitos);
    }

    const usuario = new Usuario({
      nome,
      email,
      cpf,
      senhaHash: senha.gerarHash(this.#hasher),
    });

    return await this.#repo.salvar(usuario);
  }

  /**
   * Cria o administrador inicial se ainda não existir.
   * Nunca promove um usuário já existente.
   */
  async garantirAdmin(
    dados: { nome: string; email: string; cpf: string; senha: string },
  ): Promise<boolean> {
    const email = Email.criar(dados.email);

    if (await this.#repo.existeEmail(email.endereco)) {
      return false;
    }

    await this.#repo.salvar(
      new Usuario({
        nome: dados.nome,
        email,
        cpf: Cpf.criar(dados.cpf),
        senhaHash: Senha.criar(dados.senha).gerarHash(this.#hasher),
        papel: "admin",
      }),
    );

    return true;
  }

  /**
   * Confere no banco se quem pediu é administrador.
   */
  async exigirAdmin(usuarioId: number): Promise<Usuario> {
    const usuario = await this.#repo.buscarPorId(usuarioId);

    if (!usuario) {
      throw new ErroNaoAutorizado(
        "Sessão inválida. Faça login novamente",
      );
    }

    if (!usuario.ehAdmin) {
      throw new ErroProibido();
    }

    return usuario;
  }

  async listar(): Promise<Usuario[]> {
    return await this.#repo.listar();
  }

  async alterarPapel(
    solicitanteId: number,
    alvoId: number,
    corpo: unknown,
  ): Promise<Usuario> {
    const dados = (
      typeof corpo === "object" && corpo !== null ? corpo : {}
    ) as Record<string, unknown>;

    const papel = lerPapel(dados.papel);

    const alvo = await this.#repo.buscarPorId(alvoId);

    if (!alvo) {
      throw new ErroNaoEncontrado("Usuário não encontrado");
    }

    // Impede o administrador de alterar o próprio papel.
    if (alvoId === solicitanteId) {
      throw new ErroValidacao({
        papel: "Você não pode alterar o seu próprio papel",
      });
    }

    await this.#repo.atualizarPapel(alvoId, papel);

    return alvo.comPapel(papel);
  }

  async remover(
    solicitanteId: number,
    alvoId: number,
  ): Promise<void> {
    if (!(await this.#repo.buscarPorId(alvoId))) {
      throw new ErroNaoEncontrado("Usuário não encontrado");
    }

    if (alvoId === solicitanteId) {
      throw new ErroValidacao({
        geral: "Você não pode remover a sua própria conta",
      });
    }

    await this.#repo.remover(alvoId);
  }
  

  
  async atualizarPerfil(id: number, corpo: unknown): Promise<Usuario> {
    const dados = (
      typeof corpo === "object" && corpo !== null ? corpo : {}
    ) as Record<string, unknown>;

    const usuarioAtual = await this.#repo.buscarPorId(id);

    if (!usuarioAtual) {
      throw new ErroNaoEncontrado("Usuário não encontrado");
    }

    const erros: Record<string, string> = {};

    let nome: string | undefined;
    let email: Email | undefined;
    let cpf: Cpf | null = usuarioAtual.cpf;

    try {
      nome = Usuario.validarNome(dados.nome);
    } catch (e) {
      if (e instanceof ErroValidacao) Object.assign(erros, e.campos);
      else throw e;
    }

    try {
      email = Email.criar(dados.email);
    } catch (e) {
      if (e instanceof ErroValidacao) Object.assign(erros, e.campos);
      else throw e;
    }

    // CPF só é alterado quando o campo é enviado explicitamente.
    if (dados.cpf !== undefined) {
      try {
        cpf = dados.cpf === null || dados.cpf === ""
          ? null
          : Cpf.criar(dados.cpf);
      } catch (e) {
        if (e instanceof ErroValidacao) Object.assign(erros, e.campos);
        else throw e;
      }
    }

    if (Object.keys(erros).length > 0 || !nome || !email) {
      throw new ErroValidacao(erros);
    }

    const conflitos: Record<string, string> = {};

    if (await this.#repo.existeEmail(email.endereco, id)) {
      conflitos.email = "E-mail já cadastrado";
    }

    if (cpf && await this.#repo.existeCpf(cpf.numeros, id)) {
      conflitos.cpf = "CPF já cadastrado";
    }

    if (Object.keys(conflitos).length > 0) {
      throw new ErroConflito(conflitos);
    }

    const usuarioAtualizado = usuarioAtual.comPerfil(nome, email, cpf);

    await this.#repo.atualizarPerfil(usuarioAtualizado);

    return usuarioAtualizado;
  }


  async autenticar(
    corpo: unknown,
  ): Promise<{ token: string; usuario: Usuario }> {
    const dados = (
      typeof corpo === "object" && corpo !== null ? corpo : {}
    ) as Record<string, unknown>;

    if (
      typeof dados.email !== "string" ||
      dados.email.trim() === "" ||
      typeof dados.senha !== "string" ||
      dados.senha === ""
    ) {
      const campos: Record<string, string> = {};

      if (
        typeof dados.email !== "string" ||
        dados.email.trim() === ""
      ) {
        campos.email = "E-mail é obrigatório";
      }

      if (
        typeof dados.senha !== "string" ||
        dados.senha === ""
      ) {
        campos.senha = "Senha é obrigatória";
      }

      throw new ErroValidacao(campos);
    }

    let emailNormalizado: string;

    try {
      emailNormalizado = Email.criar(dados.email).endereco;
    } catch {
      // E-mail malformado recebe o mesmo tratamento de usuário inexistente.
      this.#hasher.verificar(dados.senha, this.#hashFalso);
      throw new ErroNaoAutorizado();
    }

    const usuario = await this.#repo.buscarPorEmail(emailNormalizado);

    if (!usuario) {
      this.#hasher.verificar(dados.senha, this.#hashFalso);
      throw new ErroNaoAutorizado();
    }

    if (
      !usuario.conferirSenha(dados.senha, this.#hasher) ||
      usuario.id === null
    ) {
      throw new ErroNaoAutorizado();
    }

    return {
      token: this.#tokens.emitir(usuario.id, usuario.email),
      usuario,
    };
  }
}
