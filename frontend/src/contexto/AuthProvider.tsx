
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { api, CHAVE_TOKEN } from "../api/axios";
import type { UsuarioLogado } from "../api/tipos";
import { AuthContexto } from "./auth";

const CHAVE_USUARIO = "darkmoon.usuario";

function lerUsuarioSalvo(): UsuarioLogado | null {
  try {
    const texto = localStorage.getItem(CHAVE_USUARIO);
    return texto && localStorage.getItem(CHAVE_TOKEN)
      ? (JSON.parse(texto) as UsuarioLogado)
      : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(lerUsuarioSalvo);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post<{ token: string; usuario: UsuarioLogado }>(
      "/login",
      { email, senha },
    );

    localStorage.setItem(CHAVE_TOKEN, data.token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback((usuarioAtualizado: UsuarioLogado) => {
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuarioAtualizado));
    setUsuario(usuarioAtualizado);
  }, []);

  const valor = useMemo(
    () => ({ usuario, entrar, sair, atualizarUsuario }),
    [usuario, entrar, sair, atualizarUsuario],
  );

  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}
