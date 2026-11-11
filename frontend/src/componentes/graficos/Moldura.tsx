import type { ReactNode } from "react";
import { ALTURA, LARGURA, MARGEM } from "./escala";

type Props = {
  titulo: string;
  descricao: string;
  yMarcas: number[];
  sy: (v: number) => number;
  formatarY: (v: number) => string;
  tituloX?: string;
  tituloY?: string;
  children: ReactNode;
};

/** Moldura comum: grade horizontal, eixo Y com valores e títulos dos eixos. */
export function Moldura({ titulo, descricao, yMarcas, sy, formatarY, tituloX, tituloY, children }: Props) {
  const esq = MARGEM.l;
  const dir = LARGURA - MARGEM.r;
  const base = ALTURA - MARGEM.b;
  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={`${titulo}. ${descricao}`} className="grafico">
      <title>{titulo}</title>
      {yMarcas.map((m) => (
        <g key={m}>
          <line x1={esq} x2={dir} y1={sy(m)} y2={sy(m)} className="g-grade" />
          <text x={esq - 8} y={sy(m)} textAnchor="end" dominantBaseline="middle" className="g-rotulo">
            {formatarY(m)}
          </text>
        </g>
      ))}
      <line x1={esq} x2={dir} y1={base} y2={base} className="g-eixo" />
      <line x1={esq} x2={esq} y1={MARGEM.t} y2={base} className="g-eixo" />
      {children}
      {tituloX && (
        <text x={(esq + dir) / 2} y={ALTURA - 8} textAnchor="middle" className="g-titulo-eixo">{tituloX}</text>
      )}
      {tituloY && (
        <text
          transform={`translate(16 ${(MARGEM.t + base) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="g-titulo-eixo"
        >
          {tituloY}
        </text>
      )}
    </svg>
  );
}
