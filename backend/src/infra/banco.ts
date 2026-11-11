import {
  createPool,
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import { CUPONS_SEED, PRODUTOS_SEED } from "../data/catalogo.ts";
import { gerarPedidosSimulados } from "../data/vendas.ts";

/** Conexão com o MySQL: um pool (várias conexões reaproveitadas), usado por toda a API. */
export type Banco = Pool;

export type ConfigBanco = {
  host: string;
  porta: number;
  usuario: string;
  senha: string;
  banco: string;
};

/** Lê as variáveis DB_* do ambiente (.env). Os padrões servem para o XAMPP local. */
export function configDoAmbiente(): ConfigBanco {
  return {
    host: process.env.DB_HOST ?? "localhost",
    porta: Number(process.env.DB_PORT ?? 3306),
    usuario: process.env.DB_USER ?? "darkmoon",
    senha: process.env.DB_PASSWORD ?? "",
    banco: process.env.DB_NAME ?? "darkmoon",
  };
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Conecta ao MySQL, cria as tabelas (se não existirem) e popula o catálogo na primeira vez.
 * `tentativas`: no Docker o MySQL demora alguns segundos para ficar pronto, então a API tenta de novo.
 */
export async function abrirBanco(config: ConfigBanco = configDoAmbiente(), tentativas = 10): Promise<Banco> {
  const db = createPool({
    host: config.host,
    port: config.porta,
    user: config.usuario,
    password: config.senha,
    database: config.banco,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true, // DECIMAL volta como number (e não como texto "89.90")
  });

  for (let n = 1; ; n++) {
    try {
      await db.query("SELECT 1");
      break;
    } catch (e) {
      if (n >= tentativas) {
        await db.end();
        throw e;
      }
      console.log(`MySQL ainda não respondeu (tentativa ${n}/${tentativas}). Aguardando...`);
      await esperar(2000);
    }
  }

  await criarEsquema(db);
  await popularSeNecessario(db);
  return db;
}

async function criarEsquema(db: Banco): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      nome       VARCHAR(120) NOT NULL,
      email      VARCHAR(160) NOT NULL,
      cpf        VARCHAR(11)  NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      papel      ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
      criado_em  VARCHAR(30)  NOT NULL,
      CONSTRAINT uq_usuarios_email UNIQUE (email),
      CONSTRAINT uq_usuarios_cpf   UNIQUE (cpf)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      nome      VARCHAR(150) NOT NULL,
      descricao TEXT NULL,
      preco     DECIMAL(10,2) NOT NULL,
      estoque   INT NOT NULL,
      imagem    VARCHAR(255) NULL,
      genero    VARCHAR(20)  NOT NULL,
      categoria VARCHAR(60)  NOT NULL,
      CONSTRAINT ck_produtos_preco   CHECK (preco >= 0),
      CONSTRAINT ck_produtos_estoque CHECK (estoque >= 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cupons (
      codigo     VARCHAR(50) PRIMARY KEY,
      percentual DECIMAL(5,2) NOT NULL,
      ativo      TINYINT(1) NOT NULL DEFAULT 1,
      CONSTRAINT ck_cupons_percentual CHECK (percentual BETWEEN 0 AND 100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      data_pedido DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS itens_pedido (
      pedido_id      INT NOT NULL,
      produto_id     INT NOT NULL,
      quantidade     INT NOT NULL,
      preco_unitario DECIMAL(10,2) NOT NULL,
      PRIMARY KEY (pedido_id, produto_id),
      CONSTRAINT fk_itens_pedido  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id) ON DELETE CASCADE,
      CONSTRAINT fk_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos(id),
      CONSTRAINT ck_itens_quantidade CHECK (quantidade > 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/** "2026-03-05T14:30:00.000Z" -> "2026-03-05 14:30:00" (formato do DATETIME do MySQL). */
const paraDatetime = (iso: string): string => iso.slice(0, 19).replace("T", " ");

async function popularSeNecessario(db: Banco): Promise<void> {
  const [linhas] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM produtos");
  if (Number(linhas[0]?.total) > 0) return;

  // Uma conexão só, com transação: ou entra tudo, ou nada (não fica seed pela metade).
  const conn: PoolConnection = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const p of PRODUTOS_SEED) {
      await conn.execute(
        `INSERT INTO produtos (id, nome, descricao, preco, estoque, imagem, genero, categoria)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.nome, p.descricao, p.preco, p.estoque, p.imagem, p.genero, p.categoria],
      );
    }

    for (const c of CUPONS_SEED) {
      await conn.execute("INSERT INTO cupons (codigo, percentual) VALUES (?, ?)", [c.codigo, c.percentual]);
    }

    for (const pedido of gerarPedidosSimulados()) {
      const [r] = await conn.execute<ResultSetHeader>(
        "INSERT INTO pedidos (data_pedido) VALUES (?)",
        [paraDatetime(pedido.dataPedido)],
      );
      for (const it of pedido.itens) {
        await conn.execute(
          "INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)",
          [r.insertId, it.produtoId, it.quantidade, it.precoUnitario],
        );
      }
    }

    // Simula a baixa de estoque causada pelas vendas (como o UPDATE do database.sql original).
    await conn.query(`
      UPDATE produtos SET estoque = GREATEST(0, estoque - CAST(ROUND((
        SELECT COALESCE(SUM(quantidade), 0) FROM itens_pedido WHERE produto_id = produtos.id
      ) * 0.35) AS SIGNED))
    `);

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
} 