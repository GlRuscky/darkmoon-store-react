
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { Banco } from "./banco.ts";
import { ErroConflito } from "../domain/erros.ts";
import type { Papel } from "../domain/Papel.ts";
import { Usuario } from "../domain/Usuario.ts";

type Linha = RowDataPacket & {
  id: number;
  nome: string;
  email: string;
  cpf: string | null;
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

const SELECT_USUARIO = `
  SELECT
    id_usuario AS id,
    nome,
    email,
    cpf,
    senha AS senha_hash,
    papel,
    data_cadastro AS criado_em
  FROM usuarios
`;

export class UsuarioRepository {
  readonly #db: Banco;

  constructor(db: Banco) {
    this.#db = db;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const [linhas] = await this.#db.execute<Linha[]>(
      `${SELECT_USUARIO} WHERE email = ?`,
      [email],
    );

    return linhas[0] ? paraUsuario(linhas[0]) : null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const [linhas] = await this.#db.execute<Linha[]>(
      `${SELECT_USUARIO} WHERE id_usuario = ?`,
      [id],
    );

    return linhas[0] ? paraUsuario(linhas[0]) : null;
  }

  async listar(): Promise<Usuario[]> {
    const [linhas] = await this.#db.execute<Linha[]>(
      `${SELECT_USUARIO} ORDER BY id_usuario`,
    );

    return linhas.map(paraUsuario);
  }

  async atualizarPapel(id: number, papel: Papel): Promise<void> {
    await this.#db.execute(
      "UPDATE usuarios SET papel = ? WHERE id_usuario = ?",
      [papel, id],
    );
  }

  async remover(id: number): Promise<void> {
    await this.#db.execute(
      "DELETE FROM usuarios WHERE id_usuario = ?",
      [id],
    );
  }

  
  async existeEmail(email: string, excetoId?: number): Promise<boolean> {
    const [linhas] = await this.#db.execute<RowDataPacket[]>(
      `SELECT 1 AS encontrado
       FROM usuarios
       WHERE email = ?
       AND (? IS NULL OR id_usuario <> ?)`,
      [email, excetoId ?? null, excetoId ?? null],
    );
    return linhas.length > 0;
  }

  async existeCpf(cpf: string, excetoId?: number): Promise<boolean> {
    const [linhas] = await this.#db.execute<RowDataPacket[]>(
      `SELECT 1 AS encontrado
       FROM usuarios
       WHERE cpf = ?
       AND (? IS NULL OR id_usuario <> ?)`,
      [cpf, excetoId ?? null, excetoId ?? null],
    );
    return linhas.length > 0;
  }


  /**
   * Utiliza prepared statements para proteger contra SQL Injection.
   */
  async salvar(usuario: Usuario): Promise<Usuario> {
    const d = usuario.paraPersistencia();

    try {
      const [resultado] = await this.#db.execute<ResultSetHeader>(
        `INSERT INTO usuarios
          (nome, email, cpf, senha, papel)
         VALUES (?, ?, ?, ?, ?)`,
        [
          d.nome,
          d.email,
          d.cpf,
          d.senhaHash,
          d.papel,
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
        if (mensagem.includes("email")) {
          throw new ErroConflito({
            email: "E-mail já cadastrado",
          });
        }

        if (mensagem.includes("cpf")) {
          throw new ErroConflito({
            cpf: "CPF já cadastrado",
          });
        }
      }

      throw e;
    }
  }

  async atualizarPerfil(usuario: Usuario): Promise<void> {
  const dados = usuario.paraPersistencia();

  if (dados.id === null) {
    throw new Error("Não é possível atualizar usuário sem ID");
  }

  try {
    await this.#db.execute(
      `UPDATE usuarios
       SET nome = ?, cpf = ?, senha = ?
       WHERE id_usuario = ?`,
      [dados.nome, dados.cpf, dados.senhaHash, dados.id],
    );
  } catch (e) {
    const erro = e as {
      code?: string;
      message?: string;
      sqlMessage?: string;
    };

    const mensagem = erro.message ?? erro.sqlMessage ?? "";

    if (erro.code === "ER_DUP_ENTRY" && mensagem.includes("cpf")) {
      throw new ErroConflito({
        cpf: "CPF já cadastrado",
      });
    }

    throw e;
    }
  }
}