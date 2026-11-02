import type { DatabaseSync } from "node:sqlite";
import { ErroConflito } from "../domain/erros.ts";
import type { Papel } from "../domain/Papel.ts";
import { Usuario } from "../domain/Usuario.ts";

type Linha = {
  id: number; nome: string; email: string; cpf: string; senha_hash: string; papel: Papel; criado_em: string;
};

const paraUsuario = (l: Linha): Usuario =>
  Usuario.reidratar({
    id: l.id, nome: l.nome, email: l.email, cpf: l.cpf, senhaHash: l.senha_hash, papel: l.papel, criadoEm: l.criado_em,
  });

export class UsuarioRepository {
  readonly #db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.#db = db;
  }

  buscarPorEmail(email: string): Usuario | null {
    const l = this.#db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email) as Linha | undefined;
    return l ? paraUsuario(l) : null;
  }

  buscarPorId(id: number): Usuario | null {
    const l = this.#db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id) as Linha | undefined;
    return l ? paraUsuario(l) : null;
  }

  listar(): Usuario[] {
    return (this.#db.prepare("SELECT * FROM usuarios ORDER BY id").all() as Linha[]).map(paraUsuario);
  }

  atualizarPapel(id: number, papel: Papel): void {
    this.#db.prepare("UPDATE usuarios SET papel = ? WHERE id = ?").run(papel, id);
  }

  remover(id: number): void {
    this.#db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
  }

  existeEmail(email: string): boolean {
    return this.#db.prepare("SELECT 1 FROM usuarios WHERE email = ?").get(email) !== undefined;
  }

  existeCpf(cpf: string): boolean {
    return this.#db.prepare("SELECT 1 FROM usuarios WHERE cpf = ?").get(cpf) !== undefined;
  }

  /**
   * Prepared statement (?) em todas as queries: acaba com o risco de SQL Injection
   * que existia no cadastro.php (que montava SQL concatenando strings).
   */
  salvar(usuario: Usuario): Usuario {
    const d = usuario.paraPersistencia();
    try {
      const r = this.#db
        .prepare(
          "INSERT INTO usuarios (nome, email, cpf, senha_hash, papel, criado_em) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(d.nome, d.email, d.cpf, d.senhaHash, d.papel, d.criadoEm);
      return usuario.comId(Number(r.lastInsertRowid));
    } catch (e) {
      // Duas requisições simultâneas podem passar pela checagem prévia; o UNIQUE do banco é a garantia final.
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("UNIQUE") && msg.includes("usuarios.email")) {
        throw new ErroConflito({ email: "E-mail já cadastrado" });
      }
      if (msg.includes("UNIQUE") && msg.includes("usuarios.cpf")) {
        throw new ErroConflito({ cpf: "CPF já cadastrado" });
      }
      throw e;
    }
  }
}
