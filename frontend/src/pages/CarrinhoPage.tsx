import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { lerErroApi } from "../api/erros";
import { useCarrinho } from "../contexto/carrinho";
import { CupomDesconto } from "../dominio/CupomDesconto";
import { formatarMoeda } from "../util/formato";

export function CarrinhoPage() {
  const { carrinho, atualizar } = useCarrinho();
  const [codigo, setCodigo] = useState("");
  const [msgCupom, setMsgCupom] = useState("");
  const [erroCupom, setErroCupom] = useState(false);

  async function aplicarCupom(event: SubmitEvent) {
    event.preventDefault();
    if (!codigo.trim()) return;
    setMsgCupom("");
    try {
      const { data } = await api.get<{ codigo: string; percentual: number }>(
        `/cupons/${encodeURIComponent(codigo.trim())}`,
      );
      atualizar((c) => c.comCupom(new CupomDesconto(data.codigo, data.percentual)));
      setErroCupom(false);
      setMsgCupom(`Cupom ${data.codigo} aplicado: ${data.percentual}% OFF`);
      setCodigo("");
    } catch (e) {
      const erro = lerErroApi(e);
      setErroCupom(true);
      setMsgCupom(erro.status === 404 ? "Cupom inválido ou expirado." : erro.mensagem);
    }
  }

  return (
    <section>
      <h1 className="titulo-pagina">Seu Carrinho</h1>

      {carrinho.vazio ? (
        <div className="centro">
          <p>Seu carrinho está vazio.</p>
          <Link to="/produtos" className="btn btn-primary">Ver produtos</Link>
        </div>
      ) : (
        <>
          <ul className="carrinho-lista">
            {carrinho.itens.map((item) => (
              <li key={item.id} className="carrinho-item">
                <img src={`/images/${item.imagem}`} alt="" />
                <div className="carrinho-info">
                  <strong>{item.nome}</strong>
                  <span className="texto-suave">{formatarMoeda(item.preco)} cada</span>
                </div>
                <div className="carrinho-qtd">
                  <button type="button" className="btn btn-outline" aria-label={`Diminuir ${item.nome}`}
                    onClick={() => atualizar((c) => c.alterarQuantidade(item.id, item.quantidade - 1))}>−</button>
                  <span aria-live="polite">{item.quantidade}</span>
                  <button type="button" className="btn btn-outline" aria-label={`Aumentar ${item.nome}`}
                    onClick={() => atualizar((c) => c.alterarQuantidade(item.id, item.quantidade + 1))}>+</button>
                </div>
                <span className="carrinho-subtotal">{formatarMoeda(item.preco * item.quantidade)}</span>
                <button type="button" className="btn btn-outline" onClick={() => atualizar((c) => c.remover(item.id))}>
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <form className="cupom-form" onSubmit={aplicarCupom}>
            <input
              type="text" placeholder="Cupom (ex: DARK10)" aria-label="Código do cupom"
              value={codigo} onChange={(e) => setCodigo(e.target.value)}
            />
            <button type="submit" className="btn btn-outline">Aplicar cupom</button>
          </form>
          {msgCupom && (
            <p className={erroCupom ? "texto-erro" : "texto-sucesso"} role="status">{msgCupom}</p>
          )}

          <div className="totais">
            <p>Subtotal: {formatarMoeda(carrinho.subtotal)}</p>
            {carrinho.cupom && (
              <p className="texto-sucesso">
                Desconto ({carrinho.cupom.codigo} · {carrinho.cupom.percentual}%): − {formatarMoeda(carrinho.desconto)}{" "}
                <button type="button" className="link-botao" onClick={() => atualizar((c) => c.comCupom(null))}>remover</button>
              </p>
            )}
            <h2 className="preco">Total: {formatarMoeda(carrinho.total)}</h2>
          </div>
        </>
      )}
    </section>
  );
}
