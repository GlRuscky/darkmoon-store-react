import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";
import type { CategoriaAdmin } from "../api/tipos";
import { Campo } from "../componentes/Campo";
import { useErroAdmin } from "../hooks/useErroAdmin";

/**
 * Cadastro (/admin/categorias/novo) e edição (/admin/categorias/:id/editar) de categoria.
 * Sem `id` na URL é cadastro; com `id`, a categoria é carregada e o formulário vem preenchido.
 */
export function CategoriaFormPage() {
  const tratar = useErroAdmin();
  const navigate = useNavigate();
  const { id } = useParams();

  const urlCategoria =
    id === undefined ? null : `/admin/categorias/${encodeURIComponent(id)}`;

  // No cadastro o campo já nasce vazio; na edição só existe depois do GET.
  const [nome, setNome] = useState<string | null>(
    id === undefined ? "" : null,
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (urlCategoria === null) return;

    let cancelado = false;

    async function carregar(url: string) {
      try {
        const { data } = await api.get<CategoriaAdmin>(url);

        if (!cancelado) {
          setNome(data.nome);
        }
      } catch (e) {
        if (!cancelado) {
          setAviso(tratar(e).mensagem);
        }
      }
    }

    carregar(urlCategoria);

    return () => {
      cancelado = true;
    };
  }, [urlCategoria, tratar]);

  const nomeFinal = (nome ?? "").trim();

  const errosLocais: Record<string, string> =
    nomeFinal.length < 2 || nomeFinal.length > 100
      ? { nome: "O nome deve ter entre 2 e 100 caracteres." }
      : {};

  const erroDe = (campo: string) =>
    erros[campo] ?? (tentou ? errosLocais[campo] ?? "" : "");

  function mudar(valor: string) {
    setNome(valor);
    setErros({});
  }

  async function salvar(event: SubmitEvent) {
    event.preventDefault();

    if (nome === null) return;

    setTentou(true);
    setAviso(null);

    if (Object.keys(errosLocais).length > 0) return;

    setEnviando(true);

    try {
      if (urlCategoria === null) {
        const { data } = await api.post<CategoriaAdmin>(
          "/admin/categorias",
          { nome: nomeFinal },
        );

        navigate("/admin", {
          state: {
            aba: "categorias",
            aviso: { tipo: "ok", texto: `Categoria "${data.nome}" criada.` },
          },
        });
      } else {
        const { data } = await api.put<CategoriaAdmin>(urlCategoria, {
          nome: nomeFinal,
        });

        navigate("/admin", {
          state: {
            aba: "categorias",
            aviso: {
              tipo: "ok",
              texto: `Categoria "${data.nome}" atualizada.`,
            },
          },
        });
      }
    } catch (e) {
      const err = tratar(e);
      setErros(err.campos);
      setAviso(err.mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <h1 className="titulo-pagina">
        {id === undefined ? "Nova categoria" : `Editar categoria #${id}`}
      </h1>

      <p className="centro texto-suave">
        <Link to="/admin" state={{ aba: "categorias" }}>
          ← Voltar para categorias
        </Link>
      </p>

      <div className="bloco">
        {aviso && (
          <div className="alerta alerta-erro" role="alert">
            {aviso}
          </div>
        )}

        {nome === null ? (
          aviso === null && <p className="vazio">Carregando...</p>
        ) : (
          <form
            onSubmit={salvar}
            noValidate
            className="formulario admin-form"
            aria-label={
              id === undefined ? "Nova categoria" : "Editar categoria"
            }
          >
            <Campo
              id="c-nome"
              rotulo="Nome da categoria"
              placeholder="Ex.: Camisas"
              maxLength={100}
              value={nome}
              onChange={(e) => mudar(e.target.value)}
              erro={erroDe("nome")}
              required
            />

            <div className="admin-acoes">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={enviando}
              >
                {enviando ? "Salvando..." : "Salvar"}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() =>
                  navigate("/admin", { state: { aba: "categorias" } })
                }
                disabled={enviando}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}