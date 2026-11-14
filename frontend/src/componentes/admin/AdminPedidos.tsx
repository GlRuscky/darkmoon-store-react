
import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import type {
  PedidoAdmin,
  PedidoDetalheAdmin,
  StatusPedido,
} from "../../api/tipos";
import { useErroAdmin } from "../../hooks/useErroAdmin";

const POR_PAGINA = 8;

const STATUS: StatusPedido[] = [
  "Pendente",
  "Pago",
  "Enviado",
  "Entregue",
  "Cancelado",
];

type PedidosPaginados = {
  dados: PedidoAdmin[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

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
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [detalhe, setDetalhe] =
    useState<PedidoDetalheAdmin | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [alterandoId, setAlterandoId] = useState<number | null>(null);

  const [aviso, setAviso] = useState<{
    tipo: "erro" | "ok";
    texto: string;
  } | null>(null);

  async function carregar(paginaSolicitada = pagina): Promise<boolean> {
    try {
      const { data } = await api.get<PedidosPaginados>(
        `/admin/pedidos?pagina=${paginaSolicitada}&por_pagina=${POR_PAGINA}`,
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
        const { data } = await api.get<PedidosPaginados>(
          `/admin/pedidos?pagina=1&por_pagina=${POR_PAGINA}`,
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
      setAviso({
        tipo: "erro",
        texto: tratar(e).mensagem,
      });
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
          item.id === pedido.id
            ? { ...item, status: data.status }
            : item,
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
      setAviso({
        tipo: "erro",
        texto: tratar(e).mensagem,
      });
    } finally {
      setAlterandoId(null);
    }
  }

  return (
    <div>
      <div className="admin-topo">
        <h2>
          Pedidos{" "}
          {lista !== null && (
            <span className="texto-suave">({total})</span>
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
        <>
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
                {(lista ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6}>Nenhum pedido encontrado.</td>
                  </tr>
                ) : (
                  (lista ?? []).map((pedido) => (
                    <tr key={pedido.id}>
                      <td>#{pedido.id}</td>

                      <td>
                        <strong>{pedido.cliente}</strong>
                        <br />
                        <span className="texto-suave">
                          {pedido.email}
                        </span>
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
