import { ALTURA, dominioBonito, LARGURA, linear, MARGEM, truncar } from "./escala";
import { Moldura } from "./Moldura";

export type Barra = { rotulo: string; valor: number };

type Props = {
  dados: Barra[];
  titulo: string;
  tituloX?: string;
  tituloY?: string;
  formatarValor: (v: number) => string;
  /** false = colunas verticais (poucas categorias); true = barras horizontais (ranking) */
  horizontal?: boolean;
};

/** Colunas (comparar categorias) ou barras horizontais (ranking com rótulos longos). */
export function Barras({ dados, titulo, tituloX, tituloY, formatarValor, horizontal = false }: Props) {
  if (dados.length === 0) return <p className="vazio">Sem dados para exibir.</p>;
  const max = Math.max(...dados.map((d) => d.valor));
  const descricao = `${dados.length} categorias; maior valor: ${dados.reduce((a, b) => (b.valor > a.valor ? b : a)).rotulo}.`;

  if (horizontal) {
    const esq = 190;
    const dir = LARGURA - 70;
    const topo = MARGEM.t;
    const base = ALTURA - 40;
    const dom = dominioBonito(0, max, 4);
    const sx = linear(dom.min, dom.max, esq, dir);
    const passo = (base - topo) / dados.length;
    const altura = Math.min(passo * 0.7, 28);
    return (
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={`${titulo}. ${descricao}`} className="grafico">
        <title>{titulo}</title>
        {dom.marcas.map((m) => (
          <g key={m}>
            <line x1={sx(m)} x2={sx(m)} y1={topo} y2={base} className="g-grade" />
            <text x={sx(m)} y={base + 16} textAnchor="middle" className="g-rotulo">{formatarValor(m)}</text>
          </g>
        ))}
        {dados.map((d, i) => {
          const y = topo + i * passo + (passo - altura) / 2;
          return (
            <g key={d.rotulo}>
              <text x={esq - 8} y={y + altura / 2} textAnchor="end" dominantBaseline="middle" className="g-rotulo">
                {truncar(d.rotulo, 26)}
              </text>
              <rect x={esq} y={y} width={Math.max(sx(d.valor) - esq, 0)} height={altura} className="g-barra">
                <title>{`${d.rotulo}: ${formatarValor(d.valor)}`}</title>
              </rect>
              <text x={sx(d.valor) + 6} y={y + altura / 2} dominantBaseline="middle" className="g-valor-lado">
                {formatarValor(d.valor)}
              </text>
            </g>
          );
        })}
        {tituloX && (
          <text x={(esq + dir) / 2} y={ALTURA - 4} textAnchor="middle" className="g-titulo-eixo">{tituloX}</text>
        )}
      </svg>
    );
  }

  const esq = MARGEM.l;
  const dir = LARGURA - MARGEM.r;
  const base = ALTURA - MARGEM.b;
  const dy = dominioBonito(0, max, 5);
  const sy = linear(dy.min, dy.max, base, MARGEM.t);
  const passo = (dir - esq) / dados.length;
  const larg = Math.min(passo * 0.6, 90);

  return (
    <Moldura
      titulo={titulo}
      descricao={descricao}
      yMarcas={dy.marcas}
      sy={sy}
      formatarY={formatarValor}
      tituloX={tituloX}
      tituloY={tituloY}
    >
      {dados.map((d, i) => {
        const x = esq + i * passo + (passo - larg) / 2;
        const y = sy(d.valor);
        return (
          <g key={d.rotulo}>
            <rect x={x} y={y} width={larg} height={base - y} className="g-barra">
              <title>{`${d.rotulo}: ${formatarValor(d.valor)}`}</title>
            </rect>
            <text x={x + larg / 2} y={y - 6} textAnchor="middle" className="g-valor">{formatarValor(d.valor)}</text>
            <text x={x + larg / 2} y={base + 18} textAnchor="middle" className="g-rotulo">{d.rotulo}</text>
          </g>
        );
      })}
    </Moldura>
  );
}
