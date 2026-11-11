import { abrirBanco } from "./infra/banco.ts";
import { criarApp } from "./http/app.ts";
import { SenhaHasher } from "./domain/SenhaHasher.ts";
import { TokenService } from "./infra/TokenService.ts";
import { UsuarioRepository } from "./infra/UsuarioRepository.ts";
import { UsuarioService } from "./services/UsuarioService.ts";

const porta = Number(process.env.PORT ?? 3000);
const db = abrirBanco(process.env.DB_PATH ?? "data/darkmoon.db");
const origens = process.env.CORS_ORIGENS?.split(",").map((s) => s.trim());

// Administrador inicial (só é criado se o e-mail ainda não existir). Troque a senha em produção!
const admin = {
  nome: process.env.ADMIN_NOME ?? "Administrador DarkMoon",
  email: process.env.ADMIN_EMAIL ?? "admin@darkmoon.com",
  cpf: process.env.ADMIN_CPF ?? "111.444.777-35",
  senha: process.env.ADMIN_SENHA ?? "Admin#Lua2026",
};
const criou = new UsuarioService(new UsuarioRepository(db), new SenhaHasher(), new TokenService())
  .garantirAdmin(admin);
if (criou) console.log(`Admin criado: ${admin.email} (a senha é a de ADMIN_SENHA ou a padrão do README)`);

criarApp(db, { segredo: process.env.JWT_SECRET, origensPermitidas: origens }).listen(porta, () => {
  console.log(`API DarkMoon rodando em http://localhost:${porta}`);
});
