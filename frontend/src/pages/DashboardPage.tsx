import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { lerErroApi } from "../api/erros";
import type { DashboardDados } from "../api/tipos";
import { Barras } from "../componentes/graficos/Barras";
import { Dispersao } from "../componentes/graficos/Dispersao";
import { Histograma } from "../componentes/graficos/Histograma";
import { SerieTemporal } from "../componentes/graficos/SerieTemporal";
import { useAuth } from "../contexto/auth";
import {
  estoqueCritico, faturamentoPorCategoria, indicadores, produtoMaisVendido,
  regressaoPrecoDemanda, resumir, topProdutos,
} from "../estatistica/analiseVendas";
import { descreverCorrelacao, mediaMovel } from "../estatistica/estatistica";
import { formatarMes, formatarMoeda, formatarNumero } from "../util/formato";

const moedaCurta = (v: number) => `R$ ${formatarNumero(v, 0)}`;

export function DashboardPage() {
  const { sair } = useAuth();
  const [dados, setDados] = useState<DashboardDados | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      try {
        const { data } = await api.get<DashboardDados>("/dashboard");
        if (!cancelado) setDados(data);
      } catch (e) {
        const err = lerErroApi(e);
        if (cancelado) return;
        if (err.status === 401) sair(); // sessão expirada: a rota protegida leva ao login
        else if (err.status === 403) setErro("Esta área é só para administradores.");
        else setErro(err.mensagem);
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, [sair]);

  if (erro) return <div className="alerta alerta-erro" role="alert">{erro}</div>;
  if (!dados) return <span className="loader" role="status" aria-label="Carregando" />;

  const { produtos, vendasPorMes } = dados;
  if (produtos.length === 0 || vendasPorMes.length === 0) {
    return <p className="vazio centro">Nenhum dado registrado.</p>;
  }

  const ind = indicadores(vendasPorMes);
  const campeao = produtoMaisVendido(produtos);
  const criticos = estoqueCritico(produtos);
  const reg = regressaoPrecoDemanda(produtos);

  const fatMensal = vendasPorMes.map((m) => m.faturamento);
  const mesesRot = vendasPorMes.map((m) => formatarMes(m.mes));
  const iPico = fatMensal.indexOf(Math.max(...fatMensal));
  const porCategoria = faturamentoPorCategoria(produtos);
  const totalCat = porCategoria.reduce((s, c) => s + c.valor, 0);

  const resumos = [
    resumir("Preço (R$)", produtos.map((p) => p.preco)),
    resumir("Unidades vendidas / produto", produtos.map((p) => p.quantidadeVendida)),
    resumir("Faturamento / produto (R$)", produtos.map((p) => p.faturamento)),
    resumir("Faturamento / mês (R$)", fatMensal),
  ];

  return (
    <section>
      <h1 className="titulo-pagina">Dashboard — DarkMoon Store</h1>
      <p className="centro texto-suave">
        Últimos 12 meses · dados de vendas simulados para fins acadêmicos
      </p>

      <div className="cards-resumo">
        <div className="card-resumo"><span>Faturamento total</span><strong>{formatarMoeda(ind.faturamentoTotal)}</strong></div>
        <div className="card-resumo"><span>Pedidos</span><strong>{ind.pedidos}</strong></div>
        <div className="card-resumo"><span>Ticket médio</span><strong>{formatarMoeda(ind.ticketMedio)}</strong></div>
        <div className="card-resumo">
          <span>Produto mais vendido</span>
          <strong>{campeao ? `${campeao.nome} (${campeao.quantidadeVendida} un.)` : "Nenhuma venda"}</strong>
        </div>
        <div className="card-resumo"><span>Estoque crítico (&lt; 5 un.)</span><strong>{criticos.length}</strong></div>
      </div>

      {criticos.length > 0 && (
        <div className="bloco">
          <h2>Produtos com estoque crítico</h2>
          <ul>{criticos.map((p) => <li key={p.id}>{p.nome} — {p.estoque} un. ({p.categoria})</li>)}</ul>
        </div>
      )}

      <article className="bloco">
        <h2>1. Faturamento mensal</h2>
        <p className="objetivo"><strong>Objetivo:</strong> acompanhar a evolução das vendas para planejar estoque e campanhas.</p>
        <p className="tipo-grafico">Gráfico de linha (série temporal) com média móvel de 3 meses.</p>
        <SerieTemporal
          rotulos={mesesRot} valores={fatMensal} tendencia={mediaMovel(fatMensal, 3)}
          titulo="Faturamento mensal" tituloY="Faturamento (R$)" tituloX="Mês"
          formatarY={moedaCurta} nomeSerie="Faturamento"
        />
        <p className="leitura">
          <strong>Leitura:</strong> o pico foi em {mesesRot[iPico]} ({formatarMoeda(fatMensal[iPico]!)}). A média móvel suaviza o
          ruído e mostra a tendência; picos em outubro, novembro e dezembro indicam sazonalidade (Halloween, Black Friday e Natal).
        </p>
      </article>

      <article className="bloco">
        <h2>2. Faturamento por categoria</h2>
        <p className="objetivo"><strong>Objetivo:</strong> descobrir em qual linha de produto investir mais.</p>
        <p className="tipo-grafico">Gráfico de colunas (comparação entre categorias).</p>
        <Barras dados={porCategoria} titulo="Faturamento por categoria" tituloY="Faturamento (R$)" formatarValor={moedaCurta} />
        <p className="leitura">
          <strong>Leitura:</strong> {porCategoria[0]!.rotulo} lidera com {formatarNumero((porCategoria[0]!.valor / totalCat) * 100, 1)}% do
          faturamento total.
        </p>
      </article>

      <article className="bloco">
        <h2>3. Ranking de produtos mais vendidos</h2>
        <p className="objetivo"><strong>Objetivo:</strong> priorizar a reposição de estoque dos itens de maior giro.</p>
        <p className="tipo-grafico">Gráfico de barras horizontais (ranking).</p>
        <Barras horizontal dados={topProdutos(produtos, 8)} titulo="Top 8 produtos por unidades vendidas"
          tituloX="Unidades vendidas" formatarValor={(v) => formatarNumero(v, 0)} />
      </article>

      <article className="bloco">
        <h2>4. Distribuição de preços do catálogo</h2>
        <p className="objetivo"><strong>Objetivo:</strong> entender em quais faixas de preço o catálogo se concentra e se há lacunas.</p>
        <p className="tipo-grafico">Histograma (distribuição de uma variável contínua).</p>
        <Histograma valores={produtos.map((p) => p.preco)} titulo="Distribuição de preços" tituloX="Preço (R$)" formatarX={moedaCurta} />
        <p className="leitura">
          <strong>Leitura:</strong> média de {formatarMoeda(resumos[0]!.media)} e mediana de {formatarMoeda(resumos[0]!.mediana)}.
          {resumos[0]!.media > resumos[0]!.mediana
            ? " A média acima da mediana indica assimetria à direita: os itens de preço mais alto elevam a média."
            : " Média e mediana próximas indicam distribuição relativamente simétrica."}
        </p>
      </article>

      <article className="bloco">
        <h2>5. Preço × unidades vendidas</h2>
        <p className="objetivo"><strong>Objetivo:</strong> verificar se o preço influencia a demanda (apoia decisões de precificação e promoção).</p>
        <p className="tipo-grafico">Gráfico de dispersão com reta de regressão linear.</p>
        <Dispersao
          pontos={produtos.map((p) => ({ x: p.preco, y: p.quantidadeVendida, rotulo: p.nome }))}
          regressao={reg} titulo="Preço × unidades vendidas"
          tituloX="Preço (R$)" tituloY="Unidades vendidas"
          formatarX={moedaCurta} formatarY={(v) => formatarNumero(v, 0)}
        />
        {reg ? (
          <p className="leitura">
            <strong>Leitura:</strong> correlação {descreverCorrelacao(reg.r)} (r = {formatarNumero(reg.r, 2)}; R² = {formatarNumero(reg.r2, 2)}).
            Equação: unidades ≈ {formatarNumero(reg.intercepto, 1)} {reg.inclinacao < 0 ? "−" : "+"} {formatarNumero(Math.abs(reg.inclinacao), 3)} × preço.
            {" "}Cada R$ 10 a mais no preço está associado a {reg.inclinacao < 0 ? "cerca de " + formatarNumero(Math.abs(reg.inclinacao) * 10, 1) + " unidades a menos" : "cerca de " + formatarNumero(reg.inclinacao * 10, 1) + " unidades a mais"} vendidas.
            {" "}Correlação não prova causa: outros fatores (categoria, divulgação) também influenciam.
          </p>
        ) : (
          <p className="leitura">Dados insuficientes para calcular a regressão.</p>
        )}
      </article>

      <article className="bloco">
        <h2>Estatísticas descritivas</h2>
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr><th>Variável</th><th>n</th><th>Média</th><th>Mediana</th><th>Desvio padrão</th><th>Mín.</th><th>Máx.</th></tr>
            </thead>
            <tbody>
              {resumos.map((r) => (
                <tr key={r.variavel}>
                  <td>{r.variavel}</td><td>{r.n}</td>
                  <td>{formatarNumero(r.media)}</td><td>{formatarNumero(r.mediana)}</td><td>{formatarNumero(r.desvio)}</td>
                  <td>{formatarNumero(r.minimo)}</td><td>{formatarNumero(r.maximo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="bloco">
        <h2>Lista de produtos</h2>
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Vendidos</th></tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td><td><strong>{p.nome}</strong></td><td>{p.categoria}</td>
                  <td>{formatarMoeda(p.preco)}</td><td>{p.estoque} un.</td><td>{p.quantidadeVendida} un.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
