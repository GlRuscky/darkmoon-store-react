import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Carrinho } from "../dominio/Carrinho";
import { CarrinhoContexto } from "./carrinho";

const CHAVE = "darkmoon.carrinho";

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [carrinho, setCarrinho] = useState<Carrinho>(() => Carrinho.restaurar(localStorage.getItem(CHAVE)));

  const atualizar = useCallback((fn: (atual: Carrinho) => Carrinho) => {
    setCarrinho((atual) => {
      const novo = fn(atual);
      localStorage.setItem(CHAVE, novo.paraArmazenar());
      return novo;
    });
  }, []);

  const valor = useMemo(() => ({ carrinho, atualizar }), [carrinho, atualizar]);
  return <CarrinhoContexto.Provider value={valor}>{children}</CarrinhoContexto.Provider>;
}
