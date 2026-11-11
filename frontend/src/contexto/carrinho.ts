import { createContext, useContext } from "react";
import type { Carrinho } from "../dominio/Carrinho";

export type CarrinhoContextoValor = {
  carrinho: Carrinho;
  /** recebe uma função que transforma o carrinho atual em um novo (carrinho é imutável) */
  atualizar: (fn: (atual: Carrinho) => Carrinho) => void;
};

export const CarrinhoContexto = createContext<CarrinhoContextoValor | null>(null);

export function useCarrinho(): CarrinhoContextoValor {
  const ctx = useContext(CarrinhoContexto);
  if (!ctx) throw new Error("useCarrinho deve ser usado dentro de <CarrinhoProvider>");
  return ctx;
}
