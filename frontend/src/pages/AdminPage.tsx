import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminCupons } from "../componentes/admin/AdminCupons";
import { AdminProdutos } from "../componentes/admin/AdminProdutos";
import { AdminUsuarios } from "../componentes/admin/AdminUsuarios";
import { AdminCategorias } from "../componentes/admin/AdminCategorias";
import { useAuth } from "../contexto/auth";

const ABAS = [
  { id: "produtos", rotulo: "Produtos" },
  { id: "cupons", rotulo: "Cupons" },
  { id: "categorias", rotulo: "Categorias"},
  { id: "usuarios", rotulo: "Usuários" },
] as const;
type AbaId = (typeof ABAS)[number]["id"];

/** Painel administrativo. Só chega aqui quem passou pela <RotaProtegida papel="admin" />. */
export function AdminPage() {
  const { usuario } = useAuth();
  const [aba, setAba] = useState<AbaId>("produtos");

  return (
    <section>
      <h1 className="titulo-pagina">Painel Admin</h1>
      <p className="centro texto-suave">
        Olá, {usuario?.nome.split(" ")[0]}. Aqui você gerencia a loja. <Link to="/dashboard">Ver dashboard →</Link>
      </p>

      <div className="abas" role="tablist" aria-label="Áreas do painel">
        {ABAS.map((a) => (
          <button
            key={a.id} type="button" role="tab" id={`aba-${a.id}`} aria-selected={aba === a.id}
            aria-controls={`painel-${a.id}`}
            className={`btn btn-outline ${aba === a.id ? "ativo" : ""}`} onClick={() => setAba(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`} className="bloco">
        {aba === "categorias" && <AdminCategorias />}
        {aba === "produtos" && <AdminProdutos />}
        {aba === "cupons" && <AdminCupons />}
        {aba === "usuarios" && <AdminUsuarios />}
      </div>
    </section>
  );
}
