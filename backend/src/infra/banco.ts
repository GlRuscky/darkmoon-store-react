import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { CUPONS_SEED, PRODUTOS_SEED } from "../data/catalogo.ts";
import { gerarPedidosSimulados } from "../data/vendas.ts";

/**
 * Abre (e prepara) o banco SQLite. O MySQL/XAMPP do projeto PHP deixa de ser necessário:
 * o SQLite é um arquivo, então o professor roda o projeto sem instalar banco nenhum.
 */
export function abrirBanco(caminho: string): DatabaseSync {
  if (caminho !== ":memory:") mkdirSync(dirname(caminho), { recursive: true });
  const db = new DatabaseSync(caminho);
  db.exec("PRAGMA foreign_keys = ON");
  criarEsquema(db);
  migrar(db);
  popularSeNecessario(db);
  return db;
}

function criarEsquema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      cpf        TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      papel      TEXT NOT NULL DEFAULT 'usuario' CHECK (papel IN ('usuario', 'admin')),
      criado_em  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id        INTEGER PRIMARY KEY,
      nome      TEXT NOT NULL,
      descricao TEXT,
      preco     REAL NOT NULL CHECK (preco >= 0),
      estoque   INTEGER NOT NULL CHECK (estoque >= 0),
      imagem    TEXT,
      genero    TEXT NOT NULL,
      categoria TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cupons (
      codigo     TEXT PRIMARY KEY,
      percentual REAL NOT NULL CHECK (percentual BETWEEN 0 AND 100),
      ativo      INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      data_pedido TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS itens_pedido (
      pedido_id      INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      produto_id     INTEGER NOT NULL REFERENCES produtos(id),
      quantidade     INTEGER NOT NULL CHECK (quantidade > 0),
      preco_unitario REAL NOT NULL,
      PRIMARY KEY (pedido_id, produto_id)
    );
  `);
}

/** Bancos criados antes do painel admin não têm a coluna `papel`: adiciona sem perder dados. */
function migrar(db: DatabaseSync): void {
  const colunas = db.prepare("PRAGMA table_info(usuarios)").all() as { name: string }[];
  if (!colunas.some((c) => c.name === "papel")) {
    db.exec(
      "ALTER TABLE usuarios ADD COLUMN papel TEXT NOT NULL DEFAULT 'usuario' CHECK (papel IN ('usuario', 'admin'))",
    );
  }
}

function popularSeNecessario(db: DatabaseSync): void {
  const { total } = db.prepare("SELECT COUNT(*) AS total FROM produtos").get() as { total: number };
  if (total > 0) return;

  db.exec("BEGIN");
  try {
    const inserirProduto = db.prepare(
      `INSERT INTO produtos (id, nome, descricao, preco, estoque, imagem, genero, categoria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const p of PRODUTOS_SEED) {
      inserirProduto.run(p.id, p.nome, p.descricao, p.preco, p.estoque, p.imagem, p.genero, p.categoria);
    }

    const inserirCupom = db.prepare("INSERT INTO cupons (codigo, percentual) VALUES (?, ?)");
    for (const c of CUPONS_SEED) inserirCupom.run(c.codigo, c.percentual);

    const inserirPedido = db.prepare("INSERT INTO pedidos (data_pedido) VALUES (?)");
    const inserirItem = db.prepare(
      `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)`,
    );
    for (const pedido of gerarPedidosSimulados()) {
      const r = inserirPedido.run(pedido.dataPedido);
      const pedidoId = Number(r.lastInsertRowid);
      for (const it of pedido.itens) {
        inserirItem.run(pedidoId, it.produtoId, it.quantidade, it.precoUnitario);
      }
    }

    // Simula a baixa de estoque causada pelas vendas (como o UPDATE do database.sql original).
    db.exec(`
      UPDATE produtos SET estoque = MAX(0, estoque - CAST(ROUND((
        SELECT COALESCE(SUM(quantidade), 0) FROM itens_pedido WHERE produto_id = produtos.id
      ) * 0.35) AS INTEGER))
    `);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
