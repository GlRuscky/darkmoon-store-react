
import { createContext, useContext } from "react";
import type { UsuarioLogado } from "../api/tipos";

export type AuthContextoValor = {
  usuario: UsuarioLogado | null;
  entrar: (email: string, senha: string) => Promise<UsuarioLogado>;
  sair: () => void;
  atualizarUsuario: (usuario: UsuarioLogado) => void;
};

export const AuthContexto = createContext<AuthContextoValor | null>(null);

export function useAuth(): AuthContextoValor {
  const ctx = useContext(AuthContexto);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
