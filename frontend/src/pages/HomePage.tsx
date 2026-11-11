import { Link } from "react-router-dom";
import { ProdutoCard } from "../componentes/ProdutoCard";
import { useProdutos } from "../hooks/useProdutos";

const CATEGORIAS = ["Camisas", "Vestidos", "Botas", "Acessórios"] as const;

export function HomePage() {
  const { produtos, carregando, erro } = useProdutos({ embaralhar: true });

  return (
    <>
      <section className="hero">
        <h1>DarkMoon Store</h1>
        <p>Loja especializada em moda gótica, alternativa e darkwear.</p>
      </section>

      {erro && <div className="alerta alerta-erro" role="alert">{erro}</div>}
      {carregando && <span className="loader" role="status" aria-label="Carregando" />}

      {!carregando && !erro && (
        <>
          <h2 className="titulo-secao">Produtos em destaque</h2>
          <div className="grade">
            {produtos.slice(0, 8).map((p) => <ProdutoCard key={p.id} produto={p} />)}
          </div>

          {CATEGORIAS.map((cat) => (
            <section key={cat}>
              <hr className="divisor" />
              <h2 className="titulo-secao">{cat}</h2>
              <div className="grade">
                {produtos.filter((p) => p.categoria === cat).slice(0, 8).map((p) => (
                  <ProdutoCard key={p.id} produto={p} />
                ))}
              </div>
              <p className="centro">
                <Link to={`/produtos?categoria=${encodeURIComponent(cat)}`} className="btn btn-outline">
                  Ver todos em {cat}
                </Link>
              </p>
            </section>
          ))}
        </>
      )}
    </>
  );
}
