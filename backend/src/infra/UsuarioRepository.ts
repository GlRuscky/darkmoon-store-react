
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { Banco } from "../infra/banco.ts";
import { ErroConflito } from "../domain/erros.ts";
import type { Papel } from "../domain/Papel.ts";
import { Usuario } from "../domain/Usuario.ts";

type Linha = RowDataPacket & {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  senha_hash: string;
  papel: Papel;
  criado_em: string;
};

const paraUsuario = (l: Linha): Usuario =>
  Usuario.reidratar({
    id: l.id,
    nome: l.nome,
    email: l.email,
    cpf: l.cpf,
    senhaHash: l.senha_hash,
    papel: l.papel,
    criadoEm: l.criado_em,
  });

export class UsuarioRepository {
  readonly #db: Banco;

  constructor(db: Banco) {
    this.#db = db;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const [linhas] = await this.#db.execute<Linha[]>(
      "SELECT * FROM usuarios WHERE email = ?",
      [email],
    );

    return linhas[0] ? paraUsuario(linhas[0]) : null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const [linhas] = await this.#db.execute<Linha[]>(
      "SELECT * FROM usuarios WHERE id = ?",
      [id],
    );

    return linhas[0] ? paraUsuario(linhas[0]) : null;
  }

  async listar(): Promise<Usuario[]> {
    const [linhas] = await this.#db.execute<Linha[]>(
      "SELECT * FROM usuarios ORDER BY id",
    );

    return linhas.map(paraUsuario);
  }

  async atualizarPapel(id: number, papel: Papel): Promise<void> {
    await this.#db.execute(
      "UPDATE usuarios SET papel = ? WHERE id = ?",
      [papel, id],
    );
  }

  async remover(id: number): Promise<void> {
    await this.#db.execute(
      "DELETE FROM usuarios WHERE id = ?",
      [id],
    );
  }

  async existeEmail(email: string): Promise<boolean> {
    const [linhas] = await this.#db.execute<Linha[]>(
      "SELECT 1 AS encontrado FROM usuarios WHERE email = ?",
      [email],
    );

    return linhas.length > 0;
  }

  async existeCpf(cpf: string): Promise<boolean> {
    const [linhas] = await this.#db.execute<Linha[]>(
      "SELECT 1 AS encontrado FROM usuarios WHERE cpf = ?",
      [cpf],
    );

    return linhas.length > 0;
  }

  /**
   * Prepared statements (?) em todas as queries:
   * protege contra SQL Injection.
   */
  async salvar(usuario: Usuario): Promise<Usuario> {
    const d = usuario.paraPersistencia();

    try {
      const [resultado] = await this.#db.execute<ResultSetHeader>(
        `INSERT INTO usuarios
          (nome, email, cpf, senha_hash, papel, criado_em)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          d.nome,
          d.email,
          d.cpf,
          d.senhaHash,
          d.papel,
          d.criadoEm,
        ],
      );

      return usuario.comId(Number(resultado.insertId));
    } catch (e) {
      const erro = e as {
        code?: string;
        message?: string;
        sqlMessage?: string;
      };

      const mensagem = erro.message ?? erro.sqlMessage ?? "";

      if (erro.code === "ER_DUP_ENTRY") {
        const chave = mensagem.match(/for key ['`](.*?)['`]/)?.[1] ?? "";

        if (chave.endsWith("email")) {
          throw new ErroConflito({
            email: "E-mail já cadastrado",
          });
        }

        if (chave.endsWith("cpf")) {
          throw new ErroConflito({
            cpf: "CPF já cadastrado",
          });
        }
      }

      throw e;
    }
  }
}
