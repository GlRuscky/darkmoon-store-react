
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";import type { Banco } from "../infra/banco.ts";
import { ErroNaoEncontrado, ErroValidacao } from "../domain/erros.ts";

export const STATUS_PEDIDO = [
  "Pendente",
  "Pago",
  "Enviado",
  "Entregue",
  "Cancelado",
] as const;

export type StatusPedido = (typeof STATUS_PEDIDO)[number];

const PEDIDOS_HISTORICOS = new Set([1, 2, 3, 4, 5]);

type PedidoLinha = RowDataPacket & {
  id_pedido: number;
  nome: string;
  email: string;
  data_pedido: Date | string;
  status: StatusPedido | null;
  total: number | string;
};

type ItemPedidoLinha = RowDataPacket & {
  id_produto: number;
  nome: string;
  imagem: string | null;
  quantidade: number;
  preco_unitario: number | string;
};

type ItemEstoqueLinha = RowDataPacket & {
  id_produto: number;
  quantidade: number;
};

type ProdutoPedidoLinha = RowDataPacket & {
  id_produto: number;
  preco: number | string;
  estoque: number;
};

type PedidoIdLinha = RowDataPacket & {
  id_pedido: number;
  status: StatusPedido | null;
};

type TotalLinha = RowDataPacket & {
  total: number;
};

type ItemEntrada = {
  produtoId: number;
  quantidade: number;
};

type PedidoEntrada = {
  usuarioId: number;
  itens: ItemEntrada[];
};

function lerInteiroPositivo(valor: unknown): number | null {
  if (
    typeof valor !== "number" ||
    !Number.isSafeInteger(valor) ||
    valor <= 0
  ) {
    return null;
  }

  return valor;
}

function lerEntradaPedido(entrada: unknown): PedidoEntrada {
  if (typeof entrada !== "object" || entrada === null) {
    throw new ErroValidacao({
      pedido: "Informe os dados do pedido",
    });
  }

  const dados = entrada as Record<string, unknown>;
  const usuarioId = lerInteiroPositivo(dados.usuarioId);

  if (usuarioId === null) {
    throw new ErroValidacao({
      usuarioId: "Selecione um cliente válido",
    });
  }

  if (!Array.isArray(dados.itens) || dados.itens.length === 0) {
    throw new ErroValidacao({
      itens: "Adicione pelo menos um produto ao pedido",
    });
  }

  const quantidades = new Map<number, number>();

  for (const item of dados.itens) {
    if (typeof item !== "object" || item === null) {
      throw new ErroValidacao({
        itens: "Informe produtos e quantidades válidos",
      });
    }

    const dadosItem = item as Record<string, unknown>;
    const produtoId = lerInteiroPositivo(dadosItem.produtoId);
    const quantidade = lerInteiroPositivo(dadosItem.quantidade);

    if (produtoId === null || quantidade === null) {
      throw new ErroValidacao({
        itens: "Cada produto precisa ter um ID e uma quantidade válidos",
      });
    }

    const quantidadeAcumulada =
      (quantidades.get(produtoId) ?? 0) + quantidade;

    if (!Number.isSafeInteger(quantidadeAcumulada)) {
      throw new ErroValidacao({
        itens: "Quantidade de produtos inválida",
      });
    }

    quantidades.set(produtoId, quantidadeAcumulada);
  }

  return {
    usuarioId,
    itens: [...quantidades].map(([produtoId, quantidade]) => ({
      produtoId,
      quantidade,
    })),
  };
}

function paraCentavos(valor: number | string): number {
  const centavos = Math.round(Number(valor) * 100);

  if (!Number.isSafeInteger(centavos) || centavos < 0) {
    throw new ErroValidacao({
      total: "Não foi possível calcular o valor do pedido",
    });
  }

  return centavos;
}

function paraValorDecimal(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

export class PedidosAdminService {
  readonly #db: Banco;

  constructor(db: Banco) {
    this.#db = db;
  }

  async #comTransacao<T>(
    operacao: (conexao: PoolConnection) => Promise<T>,
  ): Promise<T> {
    const conexao = await this.#db.getConnection();
    let transacaoIniciada = false;

    try {
      await conexao.beginTransaction();
      transacaoIniciada = true;

      const resultado = await operacao(conexao);

      await conexao.commit();
      return resultado;
    } catch (erro) {
      if (transacaoIniciada) {
        try {
          await conexao.rollback();
        } catch {
          // Preserva o erro original da operação.
        }
      }

      throw erro;
    } finally {
      conexao.release();
    }
  }

  async #validarCliente(
    conexao: PoolConnection,
    usuarioId: number,
  ): Promise<void> {
    const [usuarios] = await conexao.execute<RowDataPacket[]>(
      `SELECT id_usuario
       FROM usuarios
       WHERE id_usuario = ?`,
      [usuarioId],
    );

    if (!usuarios[0]) {
      throw new ErroNaoEncontrado("Cliente não encontrado");
    }
  }

  async #bloquearProdutos(
    conexao: PoolConnection,
    ids: number[],
  ): Promise<Map<number, ProdutoPedidoLinha>> {
    const produtos = new Map<number, ProdutoPedidoLinha>();

    if (ids.length === 0) {
      return produtos;
    }

    const idsOrdenados = [...new Set(ids)].sort((a, b) => a - b);
    const marcadores = idsOrdenados.map(() => "?").join(", ");

    const [linhas] = await conexao.execute<ProdutoPedidoLinha[]>(
      `SELECT id_produto, preco, estoque
       FROM produtos
       WHERE id_produto IN (${marcadores})
       ORDER BY id_produto
       FOR UPDATE`,
      idsOrdenados,
    );

    for (const produto of linhas) {
      produtos.set(produto.id_produto, produto);
    }

    if (produtos.size !== idsOrdenados.length) {
      throw new ErroNaoEncontrado(
        "Um ou mais produtos do pedido não foram encontrados",
      );
    }

    return produtos;
  }

    async #inserirItens(
        conexao: PoolConnection,
        pedidoId: number,
        itens: ItemEntrada[],
        produtos: Map<number, ProdutoPedidoLinha>,
        descontarEstoque = true,
        ): Promise<number> {
    let totalCentavos = 0;

    for (const item of itens) {
      const produto = produtos.get(item.produtoId);

      if (!produto) {
        throw new ErroNaoEncontrado("Produto não encontrado");
      }

      const precoCentavos = paraCentavos(produto.preco);
      totalCentavos += precoCentavos * item.quantidade;

      if (!Number.isSafeInteger(totalCentavos)) {
        throw new ErroValidacao({
          total: "O valor total do pedido é inválido",
        });
      }

      if (descontarEstoque) {
        const [resultado] = await conexao.execute<ResultSetHeader>(
            `UPDATE produtos
            SET estoque = estoque - ?
            WHERE id_produto = ?
            AND estoque >= ?`,
            [item.quantidade, item.produtoId, item.quantidade],
        );

        if (resultado.affectedRows !== 1) {
            throw new ErroValidacao({
            estoque: `Estoque insuficiente para o produto ${item.produtoId}`,
            });
        }
        }

      await conexao.execute<ResultSetHeader>(
        `INSERT INTO itens_pedido
          (id_pedido, id_produto, quantidade, preco_unitario)
         VALUES (?, ?, ?, ?)`,
        [
          pedidoId,
          item.produtoId,
          item.quantidade,
          paraValorDecimal(precoCentavos),
        ],
      );
    }

    return totalCentavos;
  }

  async listarPedidos(paginaSolicitada = 1, porPaginaSolicitada = 8) {
    const porPagina = Math.min(
      50,
      Math.max(
        1,
        Number.isFinite(porPaginaSolicitada)
          ? Math.floor(porPaginaSolicitada)
          : 8,
      ),
    );

    const [contagem] = await this.#db.execute<TotalLinha[]>(
      `SELECT COUNT(*) AS total
       FROM pedidos`,
    );

    const total = Number(contagem[0]?.total ?? 0);
    const totalPaginas = Math.ceil(total / porPagina);

    const paginaInformada = Number.isFinite(paginaSolicitada)
      ? Math.max(1, Math.floor(paginaSolicitada))
      : 1;

    const pagina = Math.min(
      paginaInformada,
      Math.max(1, totalPaginas),
    );

    const offset = (pagina - 1) * porPagina;

    const [linhas] = await this.#db.execute<PedidoLinha[]>(
      `SELECT
         pd.id_pedido,
         u.nome,
         u.email,
         pd.data_pedido,
         pd.status,
         pd.total
       FROM pedidos pd
       INNER JOIN usuarios u
         ON u.id_usuario = pd.id_usuario
       ORDER BY pd.data_pedido DESC, pd.id_pedido DESC
       LIMIT ? OFFSET ?`,
      [porPagina, offset],
    );

    return {
      pedidos: linhas.map((pedido) => ({
        id: pedido.id_pedido,
        cliente: pedido.nome,
        email: pedido.email,
        data: pedido.data_pedido,
        status: pedido.status ?? "Pendente",
        total: Number(pedido.total),
      })),
      total,
      pagina,
      porPagina,
      totalPaginas,
    };
  }

  async buscarPedido(id: number) {
    const [pedidos] = await this.#db.execute<PedidoLinha[]>(
      `SELECT
         pd.id_pedido,
         u.nome,
         u.email,
         pd.data_pedido,
         pd.status,
         pd.total
       FROM pedidos pd
       INNER JOIN usuarios u
         ON u.id_usuario = pd.id_usuario
       WHERE pd.id_pedido = ?`,
      [id],
    );

    const pedido = pedidos[0];

    if (!pedido) {
      throw new ErroNaoEncontrado("Pedido não encontrado");
    }

    const [itens] = await this.#db.execute<ItemPedidoLinha[]>(
      `SELECT
         p.id_produto,
         p.nome,
         p.imagem,
         ip.quantidade,
         ip.preco_unitario
       FROM itens_pedido ip
       INNER JOIN produtos p
         ON p.id_produto = ip.id_produto
       WHERE ip.id_pedido = ?
       ORDER BY p.nome`,
      [id],
    );

    return {
      id: pedido.id_pedido,
      cliente: pedido.nome,
      email: pedido.email,
      data: pedido.data_pedido,
      status: pedido.status ?? "Pendente",
      total: Number(pedido.total),
      itens: itens.map((item) => ({
        produtoId: item.id_produto,
        nome: item.nome,
        imagem: item.imagem,
        quantidade: item.quantidade,
        precoUnitario: Number(item.preco_unitario),
        subtotal: Number(item.preco_unitario) * item.quantidade,
      })),
    };
  }

  async criar(entrada: unknown) {
  const dados = lerEntradaPedido(entrada);

  const pedidoId = await this.#comTransacao(async (conexao) => {
    await this.#validarCliente(conexao, dados.usuarioId);

    const produtos = await this.#bloquearProdutos(
      conexao,
      dados.itens.map((item) => item.produtoId),
    );

    for (const item of dados.itens) {
      const produto = produtos.get(item.produtoId)!;

      if (produto.estoque < item.quantidade) {
        throw new ErroValidacao({
          estoque: `Estoque insuficiente para o produto ${item.produtoId}`,
        });
      }
    }

    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO pedidos (id_usuario, status, total)
       VALUES (?, 'Pendente', 0)`,
      [dados.usuarioId],
    );

    const totalCentavos = await this.#inserirItens(
      conexao,
      resultado.insertId,
      dados.itens,
      produtos,
    );

    await conexao.execute<ResultSetHeader>(
      `UPDATE pedidos
       SET total = ?
       WHERE id_pedido = ?`,
      [paraValorDecimal(totalCentavos), resultado.insertId],
    );

    return resultado.insertId;
  });

  return this.buscarPedido(pedidoId);
}

  async atualizar(id: number, entrada: unknown) {
    if (PEDIDOS_HISTORICOS.has(id)) {
      throw new ErroValidacao({
        pedido: "Pedidos históricos não podem ser editados",
      });
    }

    const dados = lerEntradaPedido(entrada);

    await this.#comTransacao(async (conexao) => {
      const [pedidos] = await conexao.execute<PedidoIdLinha[]>(
        `SELECT id_pedido, status
         FROM pedidos
         WHERE id_pedido = ?
         FOR UPDATE`,
        [id],
      );

      if (!pedidos[0]) {
        throw new ErroNaoEncontrado("Pedido não encontrado");
      }

      const [itensAntigos] = await conexao.execute<ItemEstoqueLinha[]>(
        `SELECT id_produto, quantidade
         FROM itens_pedido
         WHERE id_pedido = ?`,
        [id],
      );

      await this.#validarCliente(conexao, dados.usuarioId);

      const idsProdutos = [
        ...itensAntigos.map((item) => item.id_produto),
        ...dados.itens.map((item) => item.produtoId),
      ];

      const produtos = await this.#bloquearProdutos(
        conexao,
        idsProdutos,
      );

      const estoqueFinal = new Map<number, number>();

      for (const [produtoId, produto] of produtos) {
        estoqueFinal.set(produtoId, produto.estoque);
      }

      for (const item of itensAntigos) {
        const estoqueAtual = estoqueFinal.get(item.id_produto);

        if (estoqueAtual === undefined) {
          throw new ErroNaoEncontrado(
            "Um produto do pedido antigo não foi encontrado",
          );
        }

        estoqueFinal.set(
          item.id_produto,
          estoqueAtual + item.quantidade,
        );
      }

      for (const item of dados.itens) {
        const estoqueDisponivel = estoqueFinal.get(item.produtoId);

        if (
          estoqueDisponivel === undefined ||
          estoqueDisponivel < item.quantidade
        ) {
          throw new ErroValidacao({
            estoque: `Estoque insuficiente para o produto ${item.produtoId}`,
          });
        }

        estoqueFinal.set(
          item.produtoId,
          estoqueDisponivel - item.quantidade,
        );
      }

      for (const [produtoId, estoque] of estoqueFinal) {
        await conexao.execute<ResultSetHeader>(
          `UPDATE produtos
           SET estoque = ?
           WHERE id_produto = ?`,
          [estoque, produtoId],
        );
      }

      await conexao.execute<ResultSetHeader>(
        `DELETE FROM itens_pedido
         WHERE id_pedido = ?`,
        [id],
      );

      const totalCentavos = await this.#inserirItens(
        conexao,
        id,
        dados.itens,
        produtos,
      );

      await conexao.execute<ResultSetHeader>(
        `UPDATE pedidos
         SET id_usuario = ?, total = ?
         WHERE id_pedido = ?`,
        [dados.usuarioId, paraValorDecimal(totalCentavos), id],
      );
    });

    return this.buscarPedido(id);
  }

  async excluir(id: number) {
    if (PEDIDOS_HISTORICOS.has(id)) {
      throw new ErroValidacao({
        pedido: "Pedidos históricos não podem ser excluídos",
      });
    }

    await this.#comTransacao(async (conexao) => {
      const [pedidos] = await conexao.execute<PedidoIdLinha[]>(
        `SELECT id_pedido, status
         FROM pedidos
         WHERE id_pedido = ?
         FOR UPDATE`,
        [id],
      );

      const pedido = pedidos[0];

      if (!pedido) {
        throw new ErroNaoEncontrado("Pedido não encontrado");
      }

      const status = pedido.status ?? "Pendente";

      if (status !== "Pendente" && status !== "Cancelado") {
        throw new ErroValidacao({
          status: "Somente pedidos pendentes ou cancelados podem ser excluídos",
        });
      }

      const [itens] = await conexao.execute<ItemEstoqueLinha[]>(
        `SELECT id_produto, quantidade
         FROM itens_pedido
         WHERE id_pedido = ?`,
        [id],
      );

      const produtos = await this.#bloquearProdutos(
        conexao,
        itens.map((item) => item.id_produto),
      );

      for (const item of itens) {
        if (!produtos.has(item.id_produto)) {
          throw new ErroNaoEncontrado(
            "Um produto do pedido não foi encontrado",
          );
        }

        await conexao.execute<ResultSetHeader>(
          `UPDATE produtos
           SET estoque = estoque + ?
           WHERE id_produto = ?`,
          [item.quantidade, item.id_produto],
        );
      }

      await conexao.execute<ResultSetHeader>(
        `DELETE FROM pedidos
         WHERE id_pedido = ?`,
        [id],
      );
    });

    return { id, mensagem: "Pedido excluído com sucesso" };
  }

  async atualizarStatus(id: number, entrada: unknown) {
    if (
      typeof entrada !== "object" ||
      entrada === null ||
      !("status" in entrada) ||
      typeof entrada.status !== "string" ||
      !STATUS_PEDIDO.includes(entrada.status as StatusPedido)
    ) {
      throw new ErroValidacao({
        status: "Informe um status válido para o pedido",
      });
    }

    const status = entrada.status as StatusPedido;

    const [pedidos] = await this.#db.execute<PedidoIdLinha[]>(
      `SELECT id_pedido, status
       FROM pedidos
       WHERE id_pedido = ?`,
      [id],
    );

    if (!pedidos[0]) {
      throw new ErroNaoEncontrado("Pedido não encontrado");
    }

    await this.#db.execute<ResultSetHeader>(
      `UPDATE pedidos
       SET status = ?
       WHERE id_pedido = ?`,
      [status, id],
    );

    return this.buscarPedido(id);
  }
}
