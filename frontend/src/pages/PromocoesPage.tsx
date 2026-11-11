import { useState, type SubmitEvent } from "react";
import { api } from "../api/axios";
import { lerErroApi } from "../api/erros";
import { ProdutoCard } from "../componentes/ProdutoCard";
import { useCarrinho } from "../contexto/carrinho";
import { CupomDesconto } from "../dominio/CupomDesconto";
import { useProdutos } from "../hooks/useProdutos";

export function PromocoesPage() {
  const { atualizar } = useCarrinho();
  const [codigo, setCodigo] = useState("");
  const [cupom, setCupom] = useState<CupomDesconto | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [faixa, setFaixa] = useState({ min: "", max: "" });

  const { produtos, carregando, erro } = useProdutos({ preco_min: faixa.min, preco_max: faixa.max, embaralhar: true });

  async function aplicarCupom(event: SubmitEvent) {
    event.preventDefault();
    if (!codigo.trim()) return;
    try {
      const { data } = await api.get<{ codigo: string; percentual: number }>(`/cupons/${encodeURIComponent(codigo.trim())}`);
      setCupom(new CupomDesconto(data.codigo, data.percentual));
      setMensagem("");
    } catch (e) {
      setCupom(null);
      const err = lerErroApi(e);
      setMensagem(err.status === 404 ? "Cupom inválido ou expirado." : err.mensagem);
    }
  }

  function filtrar(event: SubmitEvent) {
    event.preventDefault();
    setFaixa({ min: precoMin, max: precoMax });
  }

  return (
    <section>
      <div className="hero">
        <h1>Promoções</h1>
        <p>Tem cupom? Aplica aqui e veja o desconto na hora.</p>
      </div>

      <form className="cupom-form centro-flex" onSubmit={aplicarCupom}>
        <input type="text" placeholder="Digite seu cupom (ex: DARK10)" aria-label="Código do cupom"
          value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        <button type="submit" className="btn btn-primary">Aplicar Cupom</button>
      </form>

      <form className="filtro-preco" onSubmit={filtrar}>
        <label htmlFor="promo_min">Preço:</label>
        <input id="promo_min" type="number" min="0" placeholder="Mín" value={precoMin} onChange={(e) => setPrecoMin(e.target.value)} />
        <span>até</span>
        <input id="promo_max" type="number" min="0" placeholder="Máx" aria-label="Preço máximo" value={precoMax} onChange={(e) => setPrecoMax(e.target.value)} />
        <button type="submit" className="btn btn-outline">Filtrar</button>
      </form>

      {cupom && (
        <p className="centro texto-sucesso" role="status">
          ✅ Cupom válido! <strong>{cupom.percentual}% OFF</strong> aplicado abaixo.{" "}
          <button type="button" className="link-botao" onClick={() => atualizar((c) => c.comCupom(cupom))}>
            usar no carrinho
          </button>
        </p>
      )}
      {mensagem && <p className="centro texto-erro" role="alert">❌ {mensagem}</p>}
      {erro && <div className="alerta alerta-erro" role="alert">{erro}</div>}
      {carregando && <span className="loader" role="status" aria-label="Carregando" />}

      {!carregando && !erro && produtos.length === 0 && (
        <p className="centro vazio">Nenhum produto encontrado nessa faixa de preço.</p>
      )}
      <div className="grade">
        {!carregando && produtos.slice(0, 8).map((p) => (
          <ProdutoCard
            key={p.id} produto={p} semBotao
            precoComDesconto={cupom ? cupom.aplicarEmCentavos(Math.round(p.preco * 100)) / 100 : undefined}
          />
        ))}
      </div>
    </section>
  );
}
