import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

type Aviso = {
  tipo: "erro" | "ok";
  texto: string;
};

/** Listagem de categorias: paginação e exclusão. Cadastro e edição ficam em CategoriaFormPage. */
export function AdminCategorias() {
  const tratar = useErroAdmin();
  const navigate = useNavigate();
  const local = useLocation();

  // Mensagem de sucesso enviada pela tela de cadastro/edição ao voltar para cá.
  const avisoRecebido =
    (local.state as { aviso?: Aviso } | null)?.aviso ?? null;

  const [lista, setLista] = useState<CategoriaAdmin[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [aviso, setAviso] = useState<Aviso | null>(avisoRecebido);

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

  // Limpa o state do histórico para a mensagem não reaparecer ao recarregar a página.
  useEffect(() => {
    if (avisoRecebido) {
      navigate(local.pathname, { replace: true, state: null });
    }
  }, [avisoRecebido, local.pathname, navigate]);

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

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/admin/categorias/novo")}
        >
          + Nova categoria
        </button>
      </div>

      {aviso && (
        <div
          className={`alerta ${aviso.tipo === "ok" ? "alerta-sucesso" : "alerta-erro"}`}
          role={aviso.tipo === "ok" ? "status" : "alert"}
        >
          {aviso.texto}
        </div>
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
                          onClick={() =>
                            navigate(`/admin/categorias/${categoria.id}/editar`)
                          }
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