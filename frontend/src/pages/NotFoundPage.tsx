import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="centro">
      <h1 className="titulo-pagina">Página não encontrada</h1>
      <p>Essa página se perdeu na escuridão.</p>
      <Link to="/" className="btn btn-primary">Voltar ao início</Link>
    </section>
  );
}
