import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import type { CupomAdmin } from "../../api/tipos";
import { useErroAdmin } from "../../hooks/useErroAdmin";

const POR_PAGINA = 8;

type CuponsPaginados = {
  dados: CupomAdmin[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

type Aviso = {
  tipo: "erro" | "ok";
  texto: string;
};

/** Listagem de cupons: paginação e exclusão. Cadastro e edição ficam em CupomFormPage. */
export function AdminCupons() {
  const tratar = useErroAdmin();
  const navigate = useNavigate();
  const local = useLocation();

  // Mensagem de sucesso enviada pela tela de cadastro/edição ao voltar para cá.
  const avisoRecebido =
    (local.state as { aviso?: Aviso } | null)?.aviso ?? null;

  const [lista, setLista] = useState<CupomAdmin[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [aviso, setAviso] = useState<Aviso | null>(avisoRecebido);

  async function carregar(paginaSolicitada = pagina): Promise<boolean> {
    try {
      const { data } = await api.get<CuponsPaginados>(
        `/admin/cupons?pagina=${paginaSolicitada}&por_pagina=${POR_PAGINA}`,
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
        const { data } = await api.get<CuponsPaginados>(
          `/admin/cupons?pagina=1&por_pagina=${POR_PAGINA}`,
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

  async function excluir(c: CupomAdmin) {
    if (!window.confirm(`Excluir o cupom ${c.codigo}?`)) return;

    setAviso(null);

    try {
      await api.delete(
        `/admin/cupons/${encodeURIComponent(c.codigo)}`,
      );

      setAviso({
        tipo: "ok",
        texto: `Cupom ${c.codigo} excluído.`,
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
          Cupons{" "}
          {lista !== null && (
            <span className="texto-suave">({total})</span>
          )}
        </h2>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/admin/cupons/novo")}
        >
          + Novo cupom
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
                  <th>Código</th>
                  <th>Desconto</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {(lista ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4}>Nenhum cupom encontrado.</td>
                  </tr>
                ) : (
                  (lista ?? []).map((c) => (
                    <tr key={c.codigo}>
                      <td>
                        <strong>{c.codigo}</strong>
                      </td>

                      <td>{c.percentual}%</td>

                      <td>
                        <span
                          className={`selo ${c.ativo ? "selo-ok" : "selo-off"}`}
                        >
                          {c.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="admin-acoes-tabela">
                        <button
                          type="button"
                          className="btn btn-outline btn-pequeno"
                          onClick={() =>
                            navigate(
                              `/admin/cupons/${encodeURIComponent(c.codigo)}/editar`,
                              { state: { cupom: c } },
                            )
                          }
                          aria-label={`Editar cupom ${c.codigo}`}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline btn-pequeno btn-perigo"
                          onClick={() => excluir(c)}
                          aria-label={`Excluir cupom ${c.codigo}`}
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