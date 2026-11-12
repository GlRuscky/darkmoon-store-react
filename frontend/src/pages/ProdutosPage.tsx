
import type { SubmitEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ProdutoCard } from "../componentes/ProdutoCard";
import { useProdutos } from "../hooks/useProdutos";

const CATEGORIAS = ["Camisas", "Vestidos", "Botas", "Acessórios"] as const;

export function ProdutosPage() {
  const [params, setParams] = useSearchParams();

  const busca = params.get("busca") ?? "";
  const categoria = params.get("categoria") ?? "";
  const precoMin = params.get("preco_min") ?? "";
  const precoMax = params.get("preco_max") ?? "";
  const paginaAtual = Math.max(1, Number(params.get("pagina") ?? "1") || 1);

  const {
    produtos,
    total,
    pagina,
    totalPaginas,
    carregando,
    erro,
  } = useProdutos({
    busca,
    categoria,
    preco_min: precoMin,
    preco_max: precoMax,
    pagina: paginaAtual,
  });

  function definir(chaves: Record<string, string>) {
    const novo = new URLSearchParams(params);

    for (const [k, v] of Object.entries(chaves)) {
      if (v) novo.set(k, v);
      else novo.delete(k);
    }

    setParams(novo);
  }

  function definirPagina(novaPagina: number) {
    definir({ pagina: String(novaPagina) });
  }

  function filtrarPreco(event: SubmitEvent) {
    event.preventDefault();

    const dados = new FormData(event.currentTarget as HTMLFormElement);

    definir({
      preco_min: String(dados.get("preco_min") ?? ""),
      preco_max: String(dados.get("preco_max") ?? ""),
      pagina: "",
    });
  }

  return (
    <section>
      <h1 className="titulo-pagina">Nossos Produtos</h1>

      <div className="filtros-categoria">
        <button
          type="button"
          className={`btn btn-outline ${!categoria ? "ativo" : ""}`}
          onClick={() => definir({ categoria: "", pagina: "" })}
        >
          Todos
        </button>

        {CATEGORIAS.map((c) => (
          <button
            key={c}
            type="button"
            className={`btn btn-outline ${categoria === c ? "ativo" : ""}`}
            onClick={() => definir({ categoria: c, pagina: "" })}
          >
            {c}
          </button>
        ))}
      </div>

      <form
        key={`${precoMin}-${precoMax}`}
        className="filtro-preco"
        onSubmit={filtrarPreco}
      >
        <label htmlFor="preco_min">Preço:</label>

        <input
          id="preco_min"
          name="preco_min"
          type="number"
          min="0"
          step="0.01"
          placeholder="Mín"
          defaultValue={precoMin}
        />

        <span>até</span>

        <input
          id="preco_max"
          name="preco_max"
          type="number"
          min="0"
          step="0.01"
          placeholder="Máx"
          defaultValue={precoMax}
          aria-label="Preço máximo"
        />

        <button type="submit" className="btn btn-primary">
          Filtrar
        </button>

        {(precoMin || precoMax) && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              definir({ preco_min: "", preco_max: "", pagina: "" })
            }
          >
            Limpar preço
          </button>
        )}
      </form>

      {!carregando && !erro && (
        <p className="centro texto-suave">
          {busca && (
            <>
              Resultados para "<strong>{busca}</strong>" —{" "}
            </>
          )}
          {total} produto{total !== 1 ? "s" : ""} encontrado
          {total !== 1 ? "s" : ""}
        </p>
      )}

      {erro && (
        <div className="alerta alerta-erro" role="alert">
          {erro}
        </div>
      )}

      {carregando && (
        <span className="loader" role="status" aria-label="Carregando" />
      )}

      {!carregando && !erro && produtos.length === 0 && (
        <p className="centro vazio">Nenhum produto encontrado.</p>
      )}

      <div className="grade">
        {!carregando &&
          produtos.map((p) => <ProdutoCard key={p.id} produto={p} />)}
      </div>

      {!carregando && !erro && totalPaginas > 1 && (
        <nav
          className="paginacao"
          aria-label="Navegação entre páginas de produtos"
        >
          <button
            type="button"
            className="btn btn-outline"
            disabled={pagina <= 1}
            onClick={() => definirPagina(pagina - 1)}
          >
            Anterior
          </button>

          <span>
            Página {pagina} de {totalPaginas}
          </span>

          <button
            type="button"
            className="btn btn-outline"
            disabled={pagina >= totalPaginas}
            onClick={() => definirPagina(pagina + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </section>
  );
}
