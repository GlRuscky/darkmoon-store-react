import type { Regressao } from "../../estatistica/estatistica";
import { ALTURA, dominioBonito, LARGURA, linear, MARGEM } from "./escala";
import { Moldura } from "./Moldura";

export type Ponto = { x: number; y: number; rotulo: string };

type Props = {
  pontos: Ponto[];
  regressao: Regressao | null;
  titulo: string;
  tituloX: string;
  tituloY: string;
  formatarX: (v: number) => string;
  formatarY: (v: number) => string;
};

/**
 * Gráfico de dispersão: cada ponto é um produto. Serve para ver se DUAS variáveis
 * andam juntas (preço × unidades vendidas). A reta é a regressão linear.
 */
export function Dispersao({ pontos, regressao, titulo, tituloX, tituloY, formatarX, formatarY }: Props) {
  if (pontos.length === 0) return <p className="vazio">Sem dados para exibir.</p>;

  const esq = MARGEM.l;
  const dir = LARGURA - MARGEM.r;
  const base = ALTURA - MARGEM.b;
  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  const dx = dominioBonito(Math.min(...xs), Math.max(...xs), 6);
  const dy = dominioBonito(0, Math.max(...ys), 5);
  const sx = linear(dx.min, dx.max, esq, dir);
  const sy = linear(dy.min, dy.max, base, MARGEM.t);

  const xa = Math.min(...xs);
  const xb = Math.max(...xs);
  const limitarY = (v: number) => Math.min(Math.max(v, dy.min), dy.max);

  return (
    <Moldura
      titulo={titulo}
      descricao={
        regressao
          ? `Dispersão de ${pontos.length} produtos com reta de regressão; correlação r = ${regressao.r.toFixed(2)}.`
          : `Dispersão de ${pontos.length} produtos.`
      }
      yMarcas={dy.marcas}
      sy={sy}
      formatarY={formatarY}
      tituloX={tituloX}
      tituloY={tituloY}
    >
      {dx.marcas.map((m) => (
        <text key={m} x={sx(m)} y={base + 18} textAnchor="middle" className="g-rotulo">{formatarX(m)}</text>
      ))}
      {pontos.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} className="g-ponto">
          <title>{`${p.rotulo}: ${formatarX(p.x)} · ${formatarY(p.y)}`}</title>
        </circle>
      ))}
      {regressao && (
        <line
          x1={sx(xa)} y1={sy(limitarY(regressao.intercepto + regressao.inclinacao * xa))}
          x2={sx(xb)} y2={sy(limitarY(regressao.intercepto + regressao.inclinacao * xb))}
          className="g-reta"
        />
      )}
    </Moldura>
  );
}
