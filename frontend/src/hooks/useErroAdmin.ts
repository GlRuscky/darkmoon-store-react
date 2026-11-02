import { useCallback } from "react";
import { lerErroApi, type ErroApi } from "../api/erros";
import { useAuth } from "../contexto/auth";

/** Converte o erro da API e, se a sessão expirou (401), faz logout (a rota protegida leva ao login). */
export function useErroAdmin(): (e: unknown) => ErroApi {
  const { sair } = useAuth();
  return useCallback((e: unknown) => {
    const erro = lerErroApi(e);
    if (erro.status === 401) sair();
    if (erro.status === 403) erro.mensagem = "Você não tem permissão para isso (apenas administradores).";
    return erro;
  }, [sair]);
}
