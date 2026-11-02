import { Cpf } from "../domain/Cpf.ts";
import { Email } from "../domain/Email.ts";
import { Senha } from "../domain/Senha.ts";
import { SenhaHasher } from "../domain/SenhaHasher.ts";
import { Usuario } from "../domain/Usuario.ts";
import { ErroConflito, ErroNaoAutorizado, ErroNaoEncontrado, ErroProibido, ErroValidacao } from "../domain/erros.ts";
import { lerPapel } from "../domain/Papel.ts";
import { TokenService } from "../infra/TokenService.ts";
import { UsuarioRepository } from "../infra/UsuarioRepository.ts";

export class UsuarioService {
  readonly #repo: UsuarioRepository;
  readonly #hasher: SenhaHasher;
  readonly #tokens: TokenService;
  /** hash de uma senha qualquer, usado para gastar o mesmo tempo quando o e-mail não existe */
  readonly #hashFalso: string;

  constructor(repo: UsuarioRepository, hasher: SenhaHasher, tokens: TokenService) {
    this.#repo = repo;
    this.#hasher = hasher;
    this.#tokens = tokens;
    this.#hashFalso = hasher.hash("senha-que-ninguem-usa");
  }

  /**
   * Cadastro: valida TODOS os campos de uma vez (o front mostra todos os erros juntos,
   * em vez de o usuário corrigir um por tentativa) e só depois checa duplicidade.
   */
  cadastrar(corpo: unknown): Usuario {
    const dados = (typeof corpo === "object" && corpo !== null ? corpo : {}) as Record<string, unknown>;
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

    // Se o cliente mandou a confirmação, ela precisa bater (o front também confere).
    if (
      dados.confirmarSenha !== undefined &&
      dados.confirmarSenha !== dados.senha &&
      !erros.senha
    ) {
      erros.confirmarSenha = "As senhas não coincidem";
    }

    if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);

    // Daqui em diante os quatro valores existem (o TypeScript não sabe, então checamos).
    if (!nome || !email || !cpf || !senha) throw new ErroValidacao({ geral: "Dados inválidos" });

    const conflitos: Record<string, string> = {};
    if (this.#repo.existeEmail(email.endereco)) conflitos.email = "E-mail já cadastrado";
    if (this.#repo.existeCpf(cpf.numeros)) conflitos.cpf = "CPF já cadastrado";
    if (Object.keys(conflitos).length > 0) throw new ErroConflito(conflitos);

    const usuario = new Usuario({
      nome,
      email,
      cpf,
      senhaHash: senha.gerarHash(this.#hasher),
    });
    return this.#repo.salvar(usuario);
  }

  /**
   * Cria o administrador inicial se ainda não existir (chamado no start do servidor).
   * Nunca promove um usuário já existente: se o e-mail estiver em uso, não faz nada.
   */
  garantirAdmin(dados: { nome: string; email: string; cpf: string; senha: string }): boolean {
    const email = Email.criar(dados.email);
    if (this.#repo.existeEmail(email.endereco)) return false;
    this.#repo.salvar(new Usuario({
      nome: dados.nome,
      email,
      cpf: Cpf.criar(dados.cpf),
      senhaHash: Senha.criar(dados.senha).gerarHash(this.#hasher),
      papel: "admin",
    }));
    return true;
  }

  /**
   * Confere NO BANCO (e não só no token) se quem pediu é admin. Assim, se um admin for
   * rebaixado ou removido, o token antigo dele deixa de abrir o painel na hora.
   */
  exigirAdmin(usuarioId: number): Usuario {
    const usuario = this.#repo.buscarPorId(usuarioId);
    if (!usuario) throw new ErroNaoAutorizado("Sessão inválida. Faça login novamente");
    if (!usuario.ehAdmin) throw new ErroProibido();
    return usuario;
  }

  listar(): Usuario[] {
    return this.#repo.listar();
  }

  alterarPapel(solicitanteId: number, alvoId: number, corpo: unknown): Usuario {
    const dados = (typeof corpo === "object" && corpo !== null ? corpo : {}) as Record<string, unknown>;
    const papel = lerPapel(dados.papel);
    const alvo = this.#repo.buscarPorId(alvoId);
    if (!alvo) throw new ErroNaoEncontrado("Usuário não encontrado");
    // Impede o admin de se rebaixar sozinho (o sistema nunca fica sem administrador).
    if (alvoId === solicitanteId) throw new ErroValidacao({ papel: "Você não pode alterar o seu próprio papel" });
    this.#repo.atualizarPapel(alvoId, papel);
    return alvo.comPapel(papel);
  }

  remover(solicitanteId: number, alvoId: number): void {
    if (!this.#repo.buscarPorId(alvoId)) throw new ErroNaoEncontrado("Usuário não encontrado");
    if (alvoId === solicitanteId) throw new ErroValidacao({ geral: "Você não pode remover a sua própria conta" });
    this.#repo.remover(alvoId);
  }

  autenticar(corpo: unknown): { token: string; usuario: Usuario } {
    const dados = (typeof corpo === "object" && corpo !== null ? corpo : {}) as Record<string, unknown>;

    if (typeof dados.email !== "string" || dados.email.trim() === "" ||
        typeof dados.senha !== "string" || dados.senha === "") {
      const campos: Record<string, string> = {};
      if (typeof dados.email !== "string" || dados.email.trim() === "") campos.email = "E-mail é obrigatório";
      if (typeof dados.senha !== "string" || dados.senha === "") campos.senha = "Senha é obrigatória";
      throw new ErroValidacao(campos);
    }

    let usuario: Usuario | null = null;
    try {
      usuario = this.#repo.buscarPorEmail(Email.criar(dados.email).endereco);
    } catch {
      usuario = null; // e-mail malformado = mesmo tratamento de "não existe"
    }

    if (!usuario) {
      this.#hasher.verificar(dados.senha, this.#hashFalso); // iguala o tempo de resposta
      throw new ErroNaoAutorizado();
    }
    if (!usuario.conferirSenha(dados.senha, this.#hasher) || usuario.id === null) {
      throw new ErroNaoAutorizado();
    }
    return { token: this.#tokens.emitir(usuario.id, usuario.email), usuario };
  }
}
