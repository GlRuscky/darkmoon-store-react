import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";
import type { Produto } from "../api/tipos";
import { Campo } from "../componentes/Campo";
import { CampoSelect } from "../componentes/CampoSelect";
import {
  CATEGORIAS,
  GENEROS,
  PRODUTO_VAZIO,
  lerNumero,
  produtoParaForm,
  semCampo,
  validarProduto,
  type ProdutoForm,
} from "../dominio/validacaoAdmin";
import { useErroAdmin } from "../hooks/useErroAdmin";

/**
 * Cadastro (/admin/produtos/novo) e edição (/admin/produtos/:id/editar) de produto.
 * Sem `id` na URL é cadastro; com `id`, o produto é carregado e o formulário vem preenchido.
 */
export function ProdutoFormPage() {
  const tratar = useErroAdmin();
  const navigate = useNavigate();
  const { id } = useParams();

  const urlProduto =
    id === undefined ? null : `/admin/produtos/${encodeURIComponent(id)}`;

  // No cadastro o formulário já nasce vazio; na edição só existe depois do GET.
  const [form, setForm] = useState<ProdutoForm | null>(
    id === undefined ? { ...PRODUTO_VAZIO } : null,
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (urlProduto === null) return;

    let cancelado = false;

    async function carregar(url: string) {
      try {
        const { data } = await api.get<Produto>(url);

        if (!cancelado) {
          setForm(produtoParaForm(data));
        }
      } catch (e) {
        if (!cancelado) {
          setAviso(tratar(e).mensagem);
        }
      }
    }

    carregar(urlProduto);

    return () => {
      cancelado = true;
    };
  }, [urlProduto, tratar]);

  const errosLocais = form ? validarProduto(form) : {};

  const erroDe = (campo: string) =>
    erros[campo] ?? (tentou ? errosLocais[campo] ?? "" : "");

  function mudar(campo: keyof ProdutoForm, valor: string) {
    setForm((f) => (f ? { ...f, [campo]: valor } : f));
    setErros((e) => semCampo(e, campo));
  }

  async function salvar(event: SubmitEvent) {
    event.preventDefault();

    if (!form) return;

    setTentou(true);
    setAviso(null);

    if (Object.keys(errosLocais).length > 0) return;

    const corpo = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      preco: lerNumero(form.preco),
      estoque: lerNumero(form.estoque),
      imagem: form.imagem.trim(),
      genero: form.genero,
      categoria: form.categoria,
    };

    setEnviando(true);

    try {
      if (urlProduto === null) {
        const { data } = await api.post<Produto>(
          "/admin/produtos",
          corpo,
        );

        navigate("/admin", {
          state: {
            aviso: { tipo: "ok", texto: `Produto "${data.nome}" criado.` },
          },
        });
      } else {
        const { data } = await api.put<Produto>(urlProduto, corpo);

        navigate("/admin", {
          state: {
            aviso: { tipo: "ok", texto: `Produto "${data.nome}" atualizado.` },
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
        {id === undefined ? "Novo produto" : `Editar produto #${id}`}
      </h1>

      <p className="centro texto-suave">
        <Link to="/admin">← Voltar para produtos</Link>
      </p>

      <div className="bloco">
        {aviso && (
          <div className="alerta alerta-erro" role="alert">
            {aviso}
          </div>
        )}

        {form === null ? (
          aviso === null && <p className="vazio">Carregando...</p>
        ) : (
          <form
            onSubmit={salvar}
            noValidate
            className="formulario admin-form"
            aria-label={id === undefined ? "Novo produto" : "Editar produto"}
          >
            <div className="admin-form-grade">
              <Campo
                id="p-nome"
                rotulo="Nome"
                value={form.nome}
                onChange={(e) => mudar("nome", e.target.value)}
                erro={erroDe("nome")}
                required
              />

              <Campo
                id="p-imagem"
                rotulo="Imagem (arquivo em /images)"
                placeholder="bota1.webp"
                value={form.imagem}
                onChange={(e) => mudar("imagem", e.target.value)}
                erro={erroDe("imagem")}
              />

              <Campo
                id="p-preco"
                rotulo="Preço (R$)"
                inputMode="decimal"
                value={form.preco}
                onChange={(e) => mudar("preco", e.target.value)}
                erro={erroDe("preco")}
                required
              />

              <Campo
                id="p-estoque"
                rotulo="Estoque"
                inputMode="numeric"
                value={form.estoque}
                onChange={(e) => mudar("estoque", e.target.value)}
                erro={erroDe("estoque")}
                required
              />

              <CampoSelect
                id="p-genero"
                rotulo="Gênero"
                opcoes={GENEROS}
                value={form.genero}
                onChange={(e) => mudar("genero", e.target.value)}
                erro={erroDe("genero")}
              />

              <CampoSelect
                id="p-categoria"
                rotulo="Categoria"
                opcoes={CATEGORIAS}
                value={form.categoria}
                onChange={(e) => mudar("categoria", e.target.value)}
                erro={erroDe("categoria")}
              />
            </div>

            <Campo
              id="p-descricao"
              rotulo="Descrição"
              value={form.descricao}
              onChange={(e) => mudar("descricao", e.target.value)}
              erro={erroDe("descricao")}
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
                onClick={() => navigate("/admin")}
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
