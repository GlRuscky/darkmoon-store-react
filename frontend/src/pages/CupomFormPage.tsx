import { useState, type SubmitEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";
import type { CupomAdmin } from "../api/tipos";
import { Campo } from "../componentes/Campo";
import {
  CUPOM_VAZIO,
  lerNumero,
  semCampo,
  validarCupom,
  type CupomForm,
} from "../dominio/validacaoAdmin";
import { useErroAdmin } from "../hooks/useErroAdmin";

/**
 * Cadastro (/admin/cupons/novo) e edição (/admin/cupons/:codigo/editar) de cupom.
 * Não existe GET de cupom por código no painel admin: na edição, os dados chegam
 * pelo state da navegação, enviado pela listagem ao clicar em "Editar".
 * O código identifica o cupom e não muda depois de criado.
 */
export function CupomFormPage() {
  const tratar = useErroAdmin();
  const navigate = useNavigate();
  const local = useLocation();
  const { codigo } = useParams();

  const cupomRecebido =
    (local.state as { cupom?: CupomAdmin } | null)?.cupom ?? null;

  // Cadastro: formulário vazio. Edição: só existe se a listagem enviou este mesmo cupom.
  const formInicial: CupomForm | null =
    codigo === undefined
      ? { ...CUPOM_VAZIO }
      : cupomRecebido !== null && cupomRecebido.codigo === codigo
        ? {
            codigo: cupomRecebido.codigo,
            percentual: String(cupomRecebido.percentual),
            ativo: cupomRecebido.ativo,
          }
        : null;

  const [form, setForm] = useState<CupomForm | null>(formInicial);
  const [aviso, setAviso] = useState<string | null>(
    formInicial === null
      ? "Não foi possível carregar o cupom. Volte à listagem e clique em Editar."
      : null,
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const editando = codigo !== undefined;

  const errosLocais = form ? validarCupom(form, editando) : {};

  const erroDe = (campo: string) =>
    erros[campo] ?? (tentou ? errosLocais[campo] ?? "" : "");

  async function salvar(event: SubmitEvent) {
    event.preventDefault();

    if (!form) return;

    setTentou(true);
    setAviso(null);

    if (Object.keys(errosLocais).length > 0) return;

    const corpo = {
      codigo: form.codigo.trim().toUpperCase(),
      percentual: lerNumero(form.percentual),
      ativo: form.ativo,
    };

    setEnviando(true);

    try {
      if (codigo === undefined) {
        const { data } = await api.post<CupomAdmin>("/admin/cupons", corpo);

        navigate("/admin", {
          state: {
            aba: "cupons",
            aviso: { tipo: "ok", texto: `Cupom ${data.codigo} criado.` },
          },
        });
      } else {
        const { data } = await api.put<CupomAdmin>(
          `/admin/cupons/${encodeURIComponent(codigo)}`,
          corpo,
        );

        navigate("/admin", {
          state: {
            aba: "cupons",
            aviso: { tipo: "ok", texto: `Cupom ${data.codigo} atualizado.` },
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
        {codigo === undefined ? "Novo cupom" : `Editar cupom ${codigo}`}
      </h1>

      <p className="centro texto-suave">
        <Link to="/admin" state={{ aba: "cupons" }}>
          ← Voltar para cupons
        </Link>
      </p>

      <div className="bloco">
        {aviso && (
          <div className="alerta alerta-erro" role="alert">
            {aviso}
          </div>
        )}

        {form !== null && (
          <form
            onSubmit={salvar}
            noValidate
            className="formulario admin-form"
            aria-label={codigo === undefined ? "Novo cupom" : "Editar cupom"}
          >
            <div className="admin-form-grade">
              <Campo
                id="c-codigo"
                rotulo="Código"
                value={form.codigo}
                disabled={editando}
                placeholder="DARK10"
                onChange={(e) => {
                  setForm({ ...form, codigo: e.target.value });
                  setErros((atual) => semCampo(atual, "codigo"));
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
                  setErros((atual) => semCampo(atual, "percentual"));
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
                onClick={() =>
                  navigate("/admin", { state: { aba: "cupons" } })
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