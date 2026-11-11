// Teste rápido do passo 2: conecta, cria as tabelas, popula e mostra as contagens.
// Rode na pasta backend:  node --env-file=.env scripts/testar-banco.ts
import { abrirBanco, configDoAmbiente } from "../src/infra/banco.ts";

const cfg = configDoAmbiente();
console.log(`Conectando em ${cfg.usuario}@${cfg.host}:${cfg.porta}/${cfg.banco} ...`);

const db = await abrirBanco(cfg, 2);
for (const tabela of ["usuarios", "produtos", "cupons", "pedidos", "itens_pedido"]) {
  const [linhas] = await db.query(`SELECT COUNT(*) AS total FROM ${tabela}`);
  console.log(`${tabela.padEnd(13)} ${(linhas as { total: number }[])[0]?.total}`);
}
const [amostra] = await db.query("SELECT id, nome, preco, estoque FROM produtos ORDER BY id LIMIT 2");
console.log("amostra:", amostra);
await db.end();
console.log("OK: banco pronto.");