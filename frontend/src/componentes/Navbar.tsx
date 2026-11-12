import { useState, type SubmitEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/auth";
import { useCarrinho } from "../contexto/carrinho";

export function Navbar() {
  const { usuario, sair } = useAuth();
  const { carrinho } = useCarrinho();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  function buscar(event: SubmitEvent) {
    event.preventDefault();
    const termo = busca.trim();
    navigate(termo ? `/produtos?busca=${encodeURIComponent(termo)}` : "/produtos");
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">DarkMoon Store</Link>

        <ul className="navbar-links">
          <li><NavLink to="/" end>Início</NavLink></li>
          <li><NavLink to="/produtos">Produtos</NavLink></li>
          <li><NavLink to="/promocoes">Promoções</NavLink></li>
          <li><NavLink to="/sobre">Sobre Nós</NavLink></li>
          {usuario?.papel === "admin" && (
            <>
              <li><NavLink to="/admin">Admin</NavLink></li>
              <li><NavLink to="/dashboard">Dashboard</NavLink></li>
            </>
          )}
        </ul>

        <form className="navbar-busca" onSubmit={buscar} role="search">
          <input
            type="search"
            placeholder="Buscar produtos..."
            aria-label="Buscar produtos"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Buscar</button>
        </form>

        <div className="navbar-acoes">
          <Link to="/carrinho" className="btn btn-outline" aria-label={`Carrinho, ${carrinho.quantidadeTotal} itens`}>
            Carrinho <span className="badge">{carrinho.quantidadeTotal}</span>
          </Link>
                {usuario ? (
                  <>
                    <Link to="/perfil" className="btn btn-outline">
                      Meu perfil
                    </Link>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={sair}
                      title={usuario.email}
                    >
                      Sair ({usuario.nome.split(" ")[0]})
                    </button>
                  </>
                ) : (
                  <>
              <Link to="/login" className="btn btn-outline">Entrar</Link>
              <Link to="/cadastro" className="btn btn-primary">Criar conta</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
