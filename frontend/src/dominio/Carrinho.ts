import { CupomDesconto } from "./CupomDesconto";

export type ProdutoParaCarrinho = {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
};

export type ItemCarrinho = Readonly<ProdutoParaCarrinho & { quantidade: number }>;

type Armazenado = { itens: ItemCarrinho[]; cupom: { codigo: string; percentual: number } | null };

const paraCentavos = (reais: number): number => Math.round(reais * 100);

/**
 * Carrinho de compras (transcrição do $_SESSION['carrinho'] do PHP).
 *
 * É IMUTÁVEL: cada operação devolve um NOVO Carrinho. Isso protege o estado interno
 * (#itens nunca é alterado por fora) e combina com o React, que compara referências
 * para saber quando redesenhar a tela.
 *
 * Getters existem só para o que a tela precisa ler; para mudar algo há métodos com regra
 * (quantidade mínima, produto inexistente...), nunca setters soltos.
 */
export class Carrinho {
  readonly #itens: ReadonlyMap<number, ItemCarrinho>;
  readonly #cupom: CupomDesconto | null;

  constructor(itens: ReadonlyMap<number, ItemCarrinho> = new Map(), cupom: CupomDesconto | null = null) {
    this.#itens = new Map(itens);
    this.#cupom = cupom;
  }

  /** Lista para exibição: uma cópia, então quem recebe não consegue alterar o carrinho. */
  get itens(): readonly ItemCarrinho[] {
    return [...this.#itens.values()];
  }

  get cupom(): CupomDesconto | null {
    return this.#cupom;
  }

  get quantidadeTotal(): number {
    let q = 0;
    for (const i of this.#itens.values()) q += i.quantidade;
    return q;
  }

  get vazio(): boolean {
    return this.#itens.size === 0;
  }

  /** Subtotal em reais, sem desconto. */
  get subtotal(): number {
    let centavos = 0;
    for (const i of this.#itens.values()) centavos += paraCentavos(i.preco) * i.quantidade;
    return centavos / 100;
  }

  /** Total em reais, já com o cupom (se houver). */
  get total(): number {
    const centavos = Math.round(this.subtotal * 100);
    return (this.#cupom ? this.#cupom.aplicarEmCentavos(centavos) : centavos) / 100;
  }

  get desconto(): number {
    return Math.round((this.subtotal - this.total) * 100) / 100;
  }

  adicionar(produto: ProdutoParaCarrinho, quantidade = 1): Carrinho {
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      throw new Error("Quantidade deve ser um inteiro maior que zero");
    }
    const novo = new Map(this.#itens);
    const atual = novo.get(produto.id);
    novo.set(produto.id, {
      id: produto.id, nome: produto.nome, preco: produto.preco, imagem: produto.imagem,
      quantidade: (atual?.quantidade ?? 0) + quantidade,
    });
    return new Carrinho(novo, this.#cupom);
  }

  /** Muda a quantidade; 0 ou menos remove o item. */
  alterarQuantidade(produtoId: number, quantidade: number): Carrinho {
    if (quantidade < 1) return this.remover(produtoId);
    const atual = this.#itens.get(produtoId);
    if (!atual) return this;
    const novo = new Map(this.#itens);
    novo.set(produtoId, { ...atual, quantidade: Math.floor(quantidade) });
    return new Carrinho(novo, this.#cupom);
  }

  remover(produtoId: number): Carrinho {
    if (!this.#itens.has(produtoId)) return this;
    const novo = new Map(this.#itens);
    novo.delete(produtoId);
    return new Carrinho(novo, this.#cupom);
  }

  comCupom(cupom: CupomDesconto | null): Carrinho {
    return new Carrinho(this.#itens, cupom);
  }

  /** Serialização para o localStorage. */
  paraArmazenar(): string {
    const dados: Armazenado = {
      itens: this.itens as ItemCarrinho[],
      cupom: this.#cupom ? { codigo: this.#cupom.codigo, percentual: this.#cupom.percentual } : null,
    };
    return JSON.stringify(dados);
  }

  /** Lê do localStorage; qualquer dado corrompido resulta em carrinho vazio. */
  static restaurar(texto: string | null): Carrinho {
    if (!texto) return new Carrinho();
    try {
      const d = JSON.parse(texto) as Armazenado;
      const itens = new Map<number, ItemCarrinho>();
      for (const i of d.itens) {
        if (Number.isInteger(i.id) && i.quantidade >= 1 && i.preco >= 0) itens.set(i.id, i);
      }
      const cupom = d.cupom ? new CupomDesconto(d.cupom.codigo, d.cupom.percentual) : null;
      return new Carrinho(itens, cupom);
    } catch {
      return new Carrinho();
    }
  }
}
