import { useState } from "react";
import type { Produto } from "../api/tipos";
import { useCarrinho } from "../contexto/carrinho";
import { formatarMoeda } from "../util/formato";

type Props = {
  produto: Produto;
  /** quando há cupom ativo, mostra o preço riscado e o preço com desconto */
  precoComDesconto?: number;
  semBotao?: boolean;
};

export function ProdutoCard({ produto, precoComDesconto, semBotao }: Props) {
  const { atualizar } = useCarrinho();
  const [adicionado, setAdicionado] = useState(false);
  const descricao = produto.descricao.length > 70 ? `${produto.descricao.slice(0, 70)}...` : produto.descricao;

  function adicionar() {
    atualizar((c) => c.adicionar(produto));
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1200);
  }

  return (
    <article className="card">
      <img
        src={`/images/${produto.imagem}`}
        alt={produto.nome}
        className="card-foto"
        loading="lazy"
        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
      />
      <div className="card-corpo">
        <h3 className="card-titulo">{produto.nome}</h3>
        <p className="card-texto">{descricao}</p>
        <div className="card-rodape">
          {precoComDesconto !== undefined ? (
            <>
              <p className="preco-antigo">{formatarMoeda(produto.preco)}</p>
              <p className="preco">{formatarMoeda(precoComDesconto)}</p>
            </>
          ) : (
            <p className="preco">{formatarMoeda(produto.preco)}</p>
          )}
          {!semBotao && (
            <button type="button" className="btn btn-primary btn-bloco" onClick={adicionar}>
              {adicionado ? "Adicionado ✓" : "Adicionar ao carrinho"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
