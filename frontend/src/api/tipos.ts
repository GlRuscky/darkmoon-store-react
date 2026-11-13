export type Produto = {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  imagem: string;
  genero: "Masculino" | "Feminino" | "Unissex";
  categoria: "Camisas" | "Vestidos" | "Botas" | "Acessórios";
};

export type Papel = "usuario" | "admin";

export type UsuarioLogado = {
  id: number;
  nome: string;
  email: string;
  cpf: string | null;
  papel: Papel;
};

/** Linha da tabela de usuários do painel admin. */
export type UsuarioAdmin = UsuarioLogado & { criadoEm: string };

export type CupomAdmin = {
  codigo: string;
  percentual: number;
  ativo: boolean;
};

  export type CategoriaAdmin = {
    id: number;
    nome: string;
  };

export type ProdutoDashboard = {
  id: number;
  nome: string;
  categoria: Produto["categoria"];
  genero: Produto["genero"];
  preco: number;
  estoque: number;
  quantidadeVendida: number;
  faturamento: number;
};

export type VendaMensal = {
  mes: string; // "2026-03"
  pedidos: number;
  unidades: number;
  faturamento: number;
};

export type DashboardDados = {
  produtos: ProdutoDashboard[];
  vendasPorMes: VendaMensal[];
};


export type StatusPedido =
  | "Pendente"
  | "Pago"
  | "Enviado"
  | "Entregue"
  | "Cancelado";

export type PedidoAdmin = {
  id: number;
  cliente: string;
  email: string;
  data: string;
  status: StatusPedido;
  total: number;
};

export type ItemPedidoAdmin = {
  produtoId: number;
  nome: string;
  imagem: string | null;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
};

export type PedidoDetalheAdmin = PedidoAdmin & {
  itens: ItemPedidoAdmin[];
};

