import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import type { Produto } from "../../api/tipos";
import { useErroAdmin } from "../../hooks/useErroAdmin";
import { formatarMoeda } from "../../util/formato";

const POR_PAGINA = 8;

type ProdutosPaginados = {
  dados: Produto[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

type Aviso = {
  tipo: "erro" | "ok";
  texto: string;
};

/** Listagem de produtos: paginação e exclusão. Cadastro e edição ficam em ProdutoFormPage. */
export function AdminProdutos() {
  const tratar = useErroAdmin();
  const navigate = useNavigate();
  const local = useLocation();

  // Mensagem de sucesso enviada pela tela de cadastro/edição ao voltar para cá.
  const avisoRecebido =
    (local.state as { aviso?: Aviso } | null)?.aviso ?? null;

  const [lista, setLista] = useState<Produto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [aviso, setAviso] = useState<Aviso | null>(avisoRecebido);

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

  // Limpa o state do histórico para a mensagem não reaparecer ao recarregar a página.
  useEffect(() => {
    if (avisoRecebido) {
      navigate(local.pathname, { replace: true, state: null });
    }
  }, [avisoRecebido, local.pathname, navigate]);

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

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/admin/produtos/novo")}
        >
          + Novo produto
        </button>
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
                        onClick={() =>
                          navigate(`/admin/produtos/${p.id}/editar`)
                        }
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