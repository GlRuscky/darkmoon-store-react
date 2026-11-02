import type { SubmitEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ProdutoCard } from "../componentes/ProdutoCard";
import { useProdutos } from "../hooks/useProdutos";

const CATEGORIAS = ["Camisas", "Vestidos", "Botas", "Acessórios"] as const;

export function ProdutosPage() {
  // Os filtros vivem na URL (?busca=&categoria=&preco_min=&preco_max=), igual ao produtos.php.
  const [params, setParams] = useSearchParams();
  const busca = params.get("busca") ?? "";
  const categoria = params.get("categoria") ?? "";
  const precoMin = params.get("preco_min") ?? "";
  const precoMax = params.get("preco_max") ?? "";

  const { produtos, carregando, erro } = useProdutos({
    busca, categoria, preco_min: precoMin, preco_max: precoMax,
  });

  function definir(chaves: Record<string, string>) {
    const novo = new URLSearchParams(params);
    for (const [k, v] of Object.entries(chaves)) {
      if (v) novo.set(k, v); else novo.delete(k);
    }
    setParams(novo);
  }

  function filtrarPreco(event: SubmitEvent) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget as HTMLFormElement);
    definir({ preco_min: String(dados.get("preco_min") ?? ""), preco_max: String(dados.get("preco_max") ?? "") });
  }

  return (
    <section>
      <h1 className="titulo-pagina">Nossos Produtos</h1>

      <div className="filtros-categoria">
        <button type="button" className={`btn btn-outline ${!categoria ? "ativo" : ""}`} onClick={() => definir({ categoria: "" })}>
          Todos
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c} type="button"
            className={`btn btn-outline ${categoria === c ? "ativo" : ""}`}
            onClick={() => definir({ categoria: c })}
          >
            {c}
          </button>
        ))}
      </div>

      <form key={`${precoMin}-${precoMax}`} className="filtro-preco" onSubmit={filtrarPreco}>
        <label htmlFor="preco_min">Preço:</label>
        <input id="preco_min" name="preco_min" type="number" min="0" step="0.01" placeholder="Mín" defaultValue={precoMin} />
        <span>até</span>
        <input id="preco_max" name="preco_max" type="number" min="0" step="0.01" placeholder="Máx" defaultValue={precoMax} aria-label="Preço máximo" />
        <button type="submit" className="btn btn-primary">Filtrar</button>
        {(precoMin || precoMax) && (
          <button type="button" className="btn btn-outline" onClick={() => definir({ preco_min: "", preco_max: "" })}>
            Limpar preço
          </button>
        )}
      </form>

      {busca && !carregando && !erro && (
        <p className="centro texto-suave">
          Resultados para "<strong>{busca}</strong>" — {produtos.length} produto{produtos.length !== 1 ? "s" : ""} encontrado{produtos.length !== 1 ? "s" : ""}
        </p>
      )}

      {erro && <div className="alerta alerta-erro" role="alert">{erro}</div>}
      {carregando && <span className="loader" role="status" aria-label="Carregando" />}

      {!carregando && !erro && produtos.length === 0 && (
        <p className="centro vazio">Nenhum produto encontrado.</p>
      )}
      <div className="grade">
        {!carregando && produtos.map((p) => <ProdutoCard key={p.id} produto={p} />)}
      </div>
    </section>
  );
}
