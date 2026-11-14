
import { useEffect, useState, type SubmitEvent } from "react";
import { api } from "../../api/axios";
import type { Produto } from "../../api/tipos";
import {
  CATEGORIAS,
  GENEROS,
  PRODUTO_VAZIO,
  lerNumero,
  produtoParaForm,
  semCampo,
  validarProduto,
  type ProdutoForm,
} from "../../dominio/validacaoAdmin";
import { useErroAdmin } from "../../hooks/useErroAdmin";
import { formatarMoeda } from "../../util/formato";
import { Campo } from "../Campo";
import { CampoSelect } from "../CampoSelect";

const POR_PAGINA = 8;

type ProdutosPaginados = {
  dados: Produto[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

/** CRUD de produtos: listar, criar, editar e excluir. */
export function AdminProdutos() {
  const tratar = useErroAdmin();

  const [lista, setLista] = useState<Produto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [aviso, setAviso] = useState<{
    tipo: "erro" | "ok";
    texto: string;
  } | null>(null);

  const [form, setForm] = useState<ProdutoForm | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function carregar(paginaSolicitada = pagina) {
    try {
      const { data } = await api.get<ProdutosPaginados>(
        `/admin/produtos?pagina=${paginaSolicitada}&por_pagina=${POR_PAGINA}`,
      );

      setLista(data.dados);
      setTotal(data.total);
      setPagina(data.pagina);
      setTotalPaginas(data.totalPaginas);
    } catch (e) {
      setAviso({
        tipo: "erro",
        texto: tratar(e).mensagem,
      });
    }
  }

  useEffect(() => {
    let cancelado = false;

    async function carregarInicial() {
      try {
        const { data } = await api.get<ProdutosPaginados>(
          `/admin/produtos?pagina=1&por_pagina=${POR_PAGINA}`,
        );

        if (!cancelado) {
          setLista(data.dados);
          setTotal(data.total);
          setPagina(data.pagina);
          setTotalPaginas(data.totalPaginas);
        }
      } catch (e) {
        if (!cancelado) {
          setAviso({
            tipo: "erro",
            texto: tratar(e).mensagem,
          });
        }
      }
    }

    carregarInicial();

    return () => {
      cancelado = true;
    };
  }, [tratar]);

  const errosLocais = form ? validarProduto(form) : {};

  const erroDe = (campo: string) =>
    erros[campo] ?? (tentou ? errosLocais[campo] ?? "" : "");

  function abrirNovo() {
    setForm({ ...PRODUTO_VAZIO });
    setEditandoId(null);
    setErros({});
    setTentou(false);
    setAviso(null);
  }

  function abrirEdicao(p: Produto) {
    setForm(produtoParaForm(p));
    setEditandoId(p.id);
    setErros({});
    setTentou(false);
    setAviso(null);
  }

  function fechar() {
    setForm(null);
    setEditandoId(null);
    setErros({});
    setTentou(false);
  }

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
      if (editandoId === null) {
        const { data } = await api.post<Produto>(
          "/admin/produtos",
          corpo,
        );

        await carregar(pagina);

        setAviso({
          tipo: "ok",
          texto: `Produto "${data.nome}" criado.`,
        });
      } else {
        const { data } = await api.put<Produto>(
          `/admin/produtos/${editandoId}`,
          corpo,
        );

        await carregar(pagina);

        setAviso({
          tipo: "ok",
          texto: `Produto "${data.nome}" atualizado.`,
        });
      }

      fechar();
    } catch (e) {
      const err = tratar(e);
      setErros(err.campos);
      setAviso({
        tipo: "erro",
        texto: err.mensagem,
      });
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(p: Produto) {
    if (
      !window.confirm(
        `Excluir o produto "${p.nome}"? Isso não pode ser desfeito.`,
      )
    ) {
      return;
    }

    setAviso(null);

    try {
      await api.delete(`/admin/produtos/${p.id}`);

      await carregar(pagina);

      setAviso({
        tipo: "ok",
        texto: `Produto "${p.nome}" excluído.`,
      });
    } catch (e) {
      setAviso({
        tipo: "erro",
        texto: tratar(e).mensagem,
      });
    }
  }

  return (
    <div>
      <div className="admin-topo">
        <h2>
          Produtos{" "}
          {lista !== null && (
            <span className="texto-suave">({total})</span>
          )}
        </h2>

        {!form && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={abrirNovo}
          >
            + Novo produto
          </button>
        )}
      </div>

      {aviso && (
        <div
          className={`alerta ${
            aviso.tipo === "ok" ? "alerta-sucesso" : "alerta-erro"
          }`}
          role={aviso.tipo === "ok" ? "status" : "alert"}
        >
          {aviso.texto}
        </div>
      )}

      {form && (
        <form
          onSubmit={salvar}
          noValidate
          className="formulario admin-form"
          aria-label={
            editandoId === null ? "Novo produto" : "Editar produto"
          }
        >
          <h3>
            {editandoId === null
              ? "Novo produto"
              : `Editar produto #${editandoId}`}
          </h3>

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
              onClick={fechar}
              disabled={enviando}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {lista === null && !aviso ? (
        <p className="vazio">Carregando...</p>
      ) : (
        <>
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Gênero</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {(lista ?? []).map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>
                      <strong>{p.nome}</strong>
                    </td>
                    <td>{p.categoria}</td>
                    <td>{p.genero}</td>
                    <td>{formatarMoeda(p.preco)}</td>
                    <td
                      className={
                        p.estoque === 0
                          ? "texto-erro-inline"
                          : undefined
                      }
                    >
                      {p.estoque} un.
                    </td>
                    <td className="admin-acoes-tabela">
                      <button
                        type="button"
                        className="btn btn-outline btn-pequeno"
                        onClick={() => abrirEdicao(p)}
                        aria-label={`Editar ${p.nome}`}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-pequeno btn-perigo"
                        onClick={() => excluir(p)}
                        aria-label={`Excluir ${p.nome}`}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}

                {lista?.length === 0 && (
                  <tr>
                    <td colSpan={7}>Nenhum produto encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="admin-acoes">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => carregar(pagina - 1)}
                disabled={pagina <= 1}
              >
                Anterior
              </button>

              <span className="texto-suave">
                Página {pagina} de {totalPaginas}
              </span>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => carregar(pagina + 1)}
                disabled={pagina >= totalPaginas}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
