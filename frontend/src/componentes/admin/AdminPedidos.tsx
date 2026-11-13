
import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import type {
  PedidoAdmin,
  PedidoDetalheAdmin,
  StatusPedido,
} from "../../api/tipos";
import { useErroAdmin } from "../../hooks/useErroAdmin";

const STATUS: StatusPedido[] = [
  "Pendente",
  "Pago",
  "Enviado",
  "Entregue",
  "Cancelado",
];

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const dataBr = (data: string) =>
  new Date(data).toLocaleString("pt-BR");

export function AdminPedidos() {
  const tratar = useErroAdmin();

  const [lista, setLista] = useState<PedidoAdmin[] | null>(null);
  const [detalhe, setDetalhe] = useState<PedidoDetalheAdmin | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [alterandoId, setAlterandoId] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{
    tipo: "erro" | "ok";
    texto: string;
  } | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const { data } = await api.get<PedidoAdmin[]>("/admin/pedidos");

        if (!cancelado) setLista(data);
      } catch (e) {
        if (!cancelado) {
          setAviso({ tipo: "erro", texto: tratar(e).mensagem });
        }
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, [tratar]);

  async function verDetalhes(id: number) {
    if (detalhe?.id === id) {
      setDetalhe(null);
      return;
    }

    setCarregandoDetalhe(true);
    setAviso(null);

    try {
      const { data } = await api.get<PedidoDetalheAdmin>(
        `/admin/pedidos/${id}`,
      );

      setDetalhe(data);
    } catch (e) {
      setAviso({ tipo: "erro", texto: tratar(e).mensagem });
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  async function atualizarStatus(
    pedido: PedidoAdmin,
    status: StatusPedido,
  ) {
    if (pedido.status === status) return;

    setAlterandoId(pedido.id);
    setAviso(null);

    try {
      const { data } = await api.patch<PedidoDetalheAdmin>(
        `/admin/pedidos/${pedido.id}`,
        { status },
      );

      setLista((atual) =>
        (atual ?? []).map((item) =>
          item.id === pedido.id ? { ...item, status: data.status } : item,
        ),
      );

      if (detalhe?.id === pedido.id) {
        setDetalhe(data);
      }

      setAviso({
        tipo: "ok",
        texto: `Status do pedido #${pedido.id} atualizado para ${data.status}.`,
      });
    } catch (e) {
      setAviso({ tipo: "erro", texto: tratar(e).mensagem });
    } finally {
      setAlterandoId(null);
    }
  }

  return (
    <div>
      <div className="admin-topo">
        <h2>
          Pedidos{" "}
          {lista && (
            <span className="texto-suave">({lista.length})</span>
          )}
        </h2>
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
        <p className="vazio">Carregando pedidos...</p>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {(lista ?? []).map((pedido) => (
                <tr key={pedido.id}>
                  <td>#{pedido.id}</td>
                  <td>
                    <strong>{pedido.cliente}</strong>
                    <br />
                    <span className="texto-suave">{pedido.email}</span>
                  </td>
                  <td>{dataBr(pedido.data)}</td>
                  <td>{moeda(pedido.total)}</td>
                  <td>
                    <select
                      value={pedido.status}
                      disabled={alterandoId === pedido.id}
                      onChange={(e) =>
                        atualizarStatus(
                          pedido,
                          e.target.value as StatusPedido,
                        )
                      }
                      aria-label={`Status do pedido ${pedido.id}`}
                    >
                      {STATUS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="admin-acoes-tabela">
                    <button
                      type="button"
                      className="btn btn-outline btn-pequeno"
                      onClick={() => verDetalhes(pedido.id)}
                    >
                      {detalhe?.id === pedido.id
                        ? "Fechar"
                        : "Ver itens"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {lista?.length === 0 && (
            <p className="vazio">Nenhum pedido encontrado.</p>
          )}
        </div>
      )}

      {carregandoDetalhe && (
        <p className="vazio">Carregando detalhes do pedido...</p>
      )}

      {detalhe && (
        <section className="admin-detalhe">
          <h3>Detalhes do pedido #{detalhe.id}</h3>

          <p>
            <strong>Cliente:</strong> {detalhe.cliente}
          </p>
          <p>
            <strong>E-mail:</strong> {detalhe.email}
          </p>
          <p>
            <strong>Data:</strong> {dataBr(detalhe.data)}
          </p>
          <p>
            <strong>Status:</strong> {detalhe.status}
          </p>

          <h4>Produtos do pedido</h4>

          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Preço unitário</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {detalhe.itens.map((item) => (
                  <tr key={item.produtoId}>
                    <td>{item.nome}</td>
                    <td>{item.quantidade}</td>
                    <td>{moeda(item.precoUnitario)}</td>
                    <td>{moeda(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            <strong>Total do pedido: {moeda(detalhe.total)}</strong>
          </p>
        </section>
      )}
    </div>
  );
}
