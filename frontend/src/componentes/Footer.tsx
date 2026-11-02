import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h3>DarkMoon Store</h3>
          <p>Especializada em moda gótica, alternativa e darkwear. Trazer o estilo sombrio e elegante para o seu dia a dia.</p>
        </div>
        <div>
          <h4>Navegação</h4>
          <ul>
            <li><Link to="/">Início</Link></li>
            <li><Link to="/produtos">Produtos</Link></li>
            <li><Link to="/promocoes">Promoções</Link></li>
            <li><Link to="/sobre">Sobre Nós</Link></li>
          </ul>
        </div>
        <div>
          <h4>Categorias</h4>
          <ul>
            {["Camisas", "Vestidos", "Botas", "Acessórios"].map((c) => (
              <li key={c}><Link to={`/produtos?categoria=${encodeURIComponent(c)}`}>{c}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Contato</h4>
          <p>Santa Catarina, Brasil</p>
          <p>D4rkMoon@gmail.com</p>
        </div>
      </div>
      <p className="footer-copy">
        © 2026 DarkMoon Store — Todos os direitos reservados. <span>Feito com 🖤 para os filhos da noite.</span>
      </p>
    </footer>
  );
}
