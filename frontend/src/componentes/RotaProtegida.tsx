import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import type { Papel } from "../api/tipos";
import { useAuth } from "../contexto/auth";

/**
 * Só deixa passar quem está logado (e, se `papel` for informado, quem tem esse papel).
 * Sem login -> /login (lembrando de onde veio). Logado sem permissão -> "Acesso restrito".
 * Atenção: isto só esconde as telas. Quem protege os dados de verdade é a API (401/403).
 */
export function RotaProtegida({ papel }: { papel?: Papel }) {
  const { usuario } = useAuth();
  const local = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  if (papel && usuario.papel !== papel) {
    return (
      <section className="formulario-pagina centro" role="alert">
        <h1 className="titulo-pagina">Acesso restrito</h1>
        <p className="texto-suave">Esta área é só para administradores.</p>
        <p className="formulario-rodape"><Link to="/">Voltar para a loja</Link></p>
      </section>
    );
  }
  return <Outlet />;
}
