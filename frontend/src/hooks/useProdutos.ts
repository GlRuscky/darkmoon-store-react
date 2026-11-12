
import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { lerErroApi } from "../api/erros";
import type { Produto } from "../api/tipos";

export type FiltroProdutos = {
  busca?: string;
  categoria?: string;
  preco_min?: string;
  preco_max?: string;
  pagina?: number;
  por_pagina?: number;
  /** Embaralha a ordem dos produtos da página atual. */
  embaralhar?: boolean;
};

type RespostaProdutos = {
  produtos: Produto[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

function embaralharLista<T>(lista: T[]): T[] {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }

  return copia;
}

/** Busca produtos na API sempre que o filtro mudar. */
export function useProdutos(filtro: FiltroProdutos = {}) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(8);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const {
    busca,
    categoria,
    preco_min,
    preco_max,
    pagina: paginaFiltro,
    por_pagina,
    embaralhar,
  } = filtro;

  useEffect(() => {
    let cancelado = false;
    const params: Record<string, string> = {};

    if (busca) params.busca = busca;
    if (categoria) params.categoria = categoria;
    if (preco_min) params.preco_min = preco_min;
    if (preco_max) params.preco_max = preco_max;
    if (paginaFiltro) params.pagina = String(paginaFiltro);
    if (por_pagina) params.por_pagina = String(por_pagina);

    async function buscar() {
      setCarregando(true);
      setErro("");

      try {
        const { data } = await api.get<RespostaProdutos>("/produtos", {
          params,
        });

        if (!cancelado) {
          setProdutos(
            embaralhar ? embaralharLista(data.produtos) : data.produtos,
          );
          setTotal(data.total);
          setPagina(data.pagina);
          setPorPagina(data.porPagina);
          setTotalPaginas(data.totalPaginas);
        }
      } catch (e) {
        if (!cancelado) setErro(lerErroApi(e).mensagem);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    buscar();

    return () => {
      cancelado = true;
    };
  }, [
    busca,
    categoria,
    preco_min,
    preco_max,
    paginaFiltro,
    por_pagina,
    embaralhar,
  ]);

  return {
    produtos,
    total,
    pagina,
    porPagina,
    totalPaginas,
    carregando,
    erro,
  };
}
