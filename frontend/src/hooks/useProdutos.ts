import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { lerErroApi } from "../api/erros";
import type { Produto } from "../api/tipos";

export type FiltroProdutos = {
  busca?: string;
  categoria?: string;
  preco_min?: string;
  preco_max?: string;
  /** embaralha a ordem (como o shuffle()/ORDER BY RAND() do PHP) */
  embaralhar?: boolean;
};

function embaralharLista<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

/** Busca produtos na API sempre que o filtro mudar. Ignora respostas "atrasadas". */
export function useProdutos(filtro: FiltroProdutos = {}) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const { busca, categoria, preco_min, preco_max, embaralhar } = filtro;

  useEffect(() => {
    let cancelado = false;
    const params: Record<string, string> = {};
    if (busca) params.busca = busca;
    if (categoria) params.categoria = categoria;
    if (preco_min) params.preco_min = preco_min;
    if (preco_max) params.preco_max = preco_max;

    async function buscar() {
      setCarregando(true);
      setErro("");
      try {
        const { data } = await api.get<Produto[]>("/produtos", { params });
        if (!cancelado) setProdutos(embaralhar ? embaralharLista(data) : data);
      } catch (e) {
        if (!cancelado) setErro(lerErroApi(e).mensagem);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    buscar();
    return () => { cancelado = true; };
  }, [busca, categoria, preco_min, preco_max, embaralhar]);

  return { produtos, carregando, erro };
}
