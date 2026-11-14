
import { useEffect, useState, type SubmitEvent } from "react";
import { api } from "../../api/axios";
import type { CupomAdmin } from "../../api/tipos";
import {
  CUPOM_VAZIO,
  lerNumero,
  semCampo,
  validarCupom,
  type CupomForm,
} from "../../dominio/validacaoAdmin";
import { useErroAdmin } from "../../hooks/useErroAdmin";
import { Campo } from "../Campo";

const POR_PAGINA = 8;

type CuponsPaginados = {
  dados: CupomAdmin[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

/** CRUD de cupons. O código identifica o cupom e não muda depois de criado. */
export function AdminCupons() {
  const tratar = useErroAdmin();

  const [lista, setLista] = useState<CupomAdmin[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [aviso, setAviso] = useState<{
    tipo: "erro" | "ok";
    texto: string;
  } | null>(null);

  const [form, setForm] = useState<CupomForm | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

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

  const errosLocais = form
    ? validarCupom(form, editando !== null)
    : {};

  const erroDe = (campo: string) =>
    erros[campo] ?? (tentou ? errosLocais[campo] ?? "" : "");

  function abrirNovo() {
    setForm({ ...CUPOM_VAZIO });
    setEditando(null);
    setErros({});
    setTentou(false);
    setAviso(null);
  }

  function abrirEdicao(c: CupomAdmin) {
    setForm({
      codigo: c.codigo,
      percentual: String(c.percentual),
      ativo: c.ativo,
    });
    setEditando(c.codigo);
    setErros({});
    setTentou(false);
    setAviso(null);
  }

  function fechar() {
    setForm(null);
    setEditando(null);
    setErros({});
    setTentou(false);
  }

  async function salvar(event: SubmitEvent) {
    event.preventDefault();

    if (!form) return;

    setTentou(true);
    setAviso(null);

    if (Object.keys(errosLocais).length > 0) return;

    setEnviando(true);

    try {
      const corpo = {
        codigo: form.codigo.trim().toUpperCase(),
        percentual: lerNumero(form.percentual),
        ativo: form.ativo,
      };

      let mensagem: string;

      if (editando === null) {
        const { data } = await api.post<CupomAdmin>(
          "/admin/cupons",
          corpo,
        );

        mensagem = `Cupom ${data.codigo} criado.`;
      } else {
        const { data } = await api.put<CupomAdmin>(
          `/admin/cupons/${encodeURIComponent(editando)}`,
          corpo,
        );

        mensagem = `Cupom ${data.codigo} atualizado.`;
      }

      fechar();

      setAviso({
        tipo: "ok",
        texto: mensagem,
      });

      await carregar(pagina);
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

        {!form && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={abrirNovo}
          >
            + Novo cupom
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

      {form && (
        <form
          onSubmit={salvar}
          noValidate
          className="formulario admin-form"
          aria-label={editando === null ? "Novo cupom" : "Editar cupom"}
        >
          <h3>
            {editando === null
              ? "Novo cupom"
              : `Editar cupom ${editando}`}
          </h3>

          <div className="admin-form-grade">
            <Campo
              id="c-codigo"
              rotulo="Código"
              value={form.codigo}
              disabled={editando !== null}
              placeholder="DARK10"
              onChange={(e) => {
                setForm({ ...form, codigo: e.target.value });
                setErros((e) => semCampo(e, "codigo"));
              }}
              erro={erroDe("codigo")}
              required
            />

            <Campo
              id="c-percentual"
              rotulo="Desconto (%)"
              inputMode="decimal"
              value={form.percentual}
              onChange={(e) => {
                setForm({ ...form, percentual: e.target.value });
                setErros((e) => semCampo(e, "percentual"));
              }}
              erro={erroDe("percentual")}
              required
            />
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) =>
                setForm({ ...form, ativo: e.target.checked })
              }
            />
            Cupom ativo (clientes podem usar)
          </label>

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
                          onClick={() => abrirEdicao(c)}
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
