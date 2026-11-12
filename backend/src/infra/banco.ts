
import { createPool, type Pool } from "mysql2/promise";

/** Pool de conexões MySQL compartilhado por toda a API. */
export type Banco = Pool;

export type ConfigBanco = {
  host: string;
  porta: number;
  usuario: string;
  senha: string;
  banco: string;
};

/** Lê as configurações do MySQL no arquivo .env. */
export function configDoAmbiente(): ConfigBanco {
  return {
    host: process.env.DB_HOST ?? "localhost",
    porta: Number(process.env.DB_PORT ?? 3306),
    usuario: process.env.DB_USER ?? "darkmoon",
    senha: process.env.DB_PASSWORD ?? "",
    banco: process.env.DB_NAME ?? "loja_gotica",
  };
}

const esperar = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Conecta ao MySQL existente.
 * Não cria, modifica ou popula tabelas.
 */
export async function abrirBanco(
  config: ConfigBanco = configDoAmbiente(),
  tentativas = 10,
): Promise<Banco> {
  const db = createPool({
    host: config.host,
    port: config.porta,
    user: config.usuario,
    password: config.senha,
    database: config.banco,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
  });

  for (let n = 1; ; n++) {
    try {
      await db.query("SELECT 1");
      console.log(`Conectado ao MySQL: ${config.banco}`);
      return db;
    } catch (erro) {
      if (n >= tentativas) {
        await db.end();
        throw erro;
      }

      console.log(
        `MySQL ainda não respondeu (tentativa ${n}/${tentativas}). Aguardando...`,
      );

      await esperar(2000);
    }
  }
}
