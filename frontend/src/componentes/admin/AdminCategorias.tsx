
import { useEffect, useState, type SubmitEvent } from "react";
import { api } from "../../api/axios";
import type { CategoriaAdmin } from "../../api/tipos";
import { useErroAdmin } from "../../hooks/useErroAdmin";

const POR_PAGINA = 8;

type CategoriasPaginadas = {
  dados: CategoriaAdmin[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

export function AdminCategorias() {
  const tratar = useErroAdmin();

  const [lista, setLista] = useState<CategoriaAdmin[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [nome, setNome] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{
    tipo: "erro" | "ok";
    texto: string;
  } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function carregar(paginaSolicitada = pagina): Promise<boolean> {
    try {
      const { data } = await api.get<CategoriasPaginadas>(
        `/admin/categorias?pagina=${paginaSolicitada}&por_pagina=${POR_PAGINA}`,
      );

      setLista(data.dados);
      setTotal(data.total);
      setPagina(data.pagina);
      setTotalPaginas(data.totalPaginas);

      return true;
    } catch (e) {
      setAviso({
        tipo: "erro",
        texto: tratar(e).mensagem,
      });

      return false;
    }
  }

  useEffect(() => {
    let cancelado = false;

    async function carregarInicial() {
      try {
        const { data } = await api.get<CategoriasPaginadas>(
          `/admin/categorias?pagina=1&por_pagina=${POR_PAGINA}`,
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

  function abrirNova() {
    setNome("");
    setEditando(null);
    setAviso(null);
  }

  function abrirEdicao(categoria: CategoriaAdmin) {
    setNome(categoria.nome);
    setEditando(categoria.id);
    setAviso(null);
  }

  function fechar() {
    setNome("");
    setEditando(null);
  }

  async function salvar(event: SubmitEvent) {
    event.preventDefault();
    setAviso(null);

    const nomeFinal = nome.trim();

    if (nomeFinal.length < 2 || nomeFinal.length > 100) {
      setAviso({
        tipo: "erro",
        texto: "O nome deve ter entre 2 e 100 caracteres.",
      });
      return;
    }

    setEnviando(true);

    try {
      let mensagem: string;

      if (editando === null) {
        const { data } = await api.post<CategoriaAdmin>(
          "/admin/categorias",
          { nome: nomeFinal },
        );

        mensagem = `Categoria ${data.nome} criada.`;
      } else {
        const { data } = await api.put<CategoriaAdmin>(
          `/admin/categorias/${editando}`,
          { nome: nomeFinal },
        );

        mensagem = `Categoria ${data.nome} atualizada.`;
      }

      fechar();

      setAviso({
        tipo: "ok",
        texto: mensagem,
      });

      await carregar(pagina);
    } catch (e) {
      setAviso({
        tipo: "erro",
        texto: tratar(e).mensagem,
      });
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(categoria: CategoriaAdmin) {
    if (!window.confirm(`Excluir a categoria ${categoria.nome}?`)) return;

    setAviso(null);

    try {
      await api.delete(`/admin/categorias/${categoria.id}`);

      setAviso({
        tipo: "ok",
        texto: `Categoria ${categoria.nome} excluída.`,
      });

      await carregar(pagina);
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
          Categorias{" "}
          {lista !== null && (
            <span className="texto-suave">({total})</span>
          )}
        </h2>

        {editando === null && !nome && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={abrirNova}
          >
            + Nova categoria
          </button>
        )}
      </div>

      {aviso && (
        <div
          className={`alerta ${aviso.tipo === "ok" ? "alerta-sucesso" : "alerta-erro"}`}
          role={aviso.tipo === "ok" ? "status" : "alert"}
        >
          {aviso.texto}
        </div>
      )}

      {(editando !== null || nome !== "") && (
        <form
          onSubmit={salvar}
          noValidate
          className="formulario admin-form"
          aria-label={editando === null ? "Nova categoria" : "Editar categoria"}
        >
          <h3>
            {editando === null ? "Nova categoria" : "Editar categoria"}
          </h3>

          <label htmlFor="categoria-nome">Nome da categoria</label>

          <input
            id="categoria-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Camisas"
            minLength={2}
            maxLength={100}
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
                  <th>Nome</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {(lista ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={2}>Nenhuma categoria encontrada.</td>
                  </tr>
                ) : (
                  (lista ?? []).map((categoria) => (
                    <tr key={categoria.id}>
                      <td>
                        <strong>{categoria.nome}</strong>
                      </td>

                      <td className="admin-acoes-tabela">
                        <button
                          type="button"
                          className="btn btn-outline btn-pequeno"
                          onClick={() => abrirEdicao(categoria)}
                          aria-label={`Editar categoria ${categoria.nome}`}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-pequeno btn-perigo"
                          onClick={() => excluir(categoria)}
                          aria-label={`Excluir categoria ${categoria.nome}`}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
        </>
      )}
    </div>
  );
}
