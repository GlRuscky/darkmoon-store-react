import { histograma, binsSturges, mediana, media } from "../../estatistica/estatistica";
import { ALTURA, dominioBonito, LARGURA, linear, MARGEM } from "./escala";
import { Moldura } from "./Moldura";

type Props = {
  valores: number[];
  titulo: string;
  tituloX: string;
  tituloY?: string;
  formatarX: (v: number) => string;
  nBins?: number;
};

/**
 * Histograma: mostra COMO os valores se distribuem (onde se concentram, se há cauda).
 * Barras coladas, porque o eixo X é contínuo. Linhas: média e mediana.
 */
export function Histograma({ valores, titulo, tituloX, tituloY = "Nº de produtos", formatarX, nBins }: Props) {
  const bins = histograma(valores, nBins ?? binsSturges(valores.length));
  if (bins.length === 0) return <p className="vazio">Sem dados para exibir.</p>;

  const esq = MARGEM.l;
  const dir = LARGURA - MARGEM.r;
  const base = ALTURA - MARGEM.b;
  const xMin = bins[0]!.de;
  const xMax = bins[bins.length - 1]!.ate;
  const sx = linear(xMin, xMax === xMin ? xMin + 1 : xMax, esq, dir);
  const maxQtd = Math.max(...bins.map((b) => b.quantidade));
  const dy = dominioBonito(0, maxQtd, 4);
  const sy = linear(dy.min, dy.max, base, MARGEM.t);

  const m = media(valores);
  const md = mediana(valores);

  return (
    <Moldura
      titulo={titulo}
      descricao={`Histograma com ${bins.length} faixas; média ${formatarX(m)} e mediana ${formatarX(md)}.`}
      yMarcas={dy.marcas}
      sy={sy}
      formatarY={(v) => String(v)}
      tituloX={tituloX}
      tituloY={tituloY}
    >
      {bins.map((b, i) => {
        const x = sx(b.de);
        const w = Math.max(sx(b.ate) - x - 1.5, 1);
        const y = sy(b.quantidade);
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={base - y} className="g-barra">
              <title>{`${formatarX(b.de)} a ${formatarX(b.ate)}: ${b.quantidade} produto(s)`}</title>
            </rect>
            {b.quantidade > 0 && (
              <text x={x + w / 2} y={y - 5} textAnchor="middle" className="g-valor">{b.quantidade}</text>
            )}
          </g>
        );
      })}
      {bins.map((b, i) => (
        <text key={`x${i}`} x={sx(b.de)} y={base + 18} textAnchor="middle" className="g-rotulo">
          {formatarX(b.de)}
        </text>
      ))}
      <text x={dir} y={base + 18} textAnchor="middle" className="g-rotulo">{formatarX(xMax)}</text>

      <line x1={sx(m)} x2={sx(m)} y1={MARGEM.t} y2={base} className="g-ref g-ref-media" />
      <line x1={sx(md)} x2={sx(md)} y1={MARGEM.t} y2={base} className="g-ref g-ref-mediana" />
      <g transform={`translate(${dir - 150} ${MARGEM.t + 4})`}>
        <line x1="0" x2="18" y1="6" y2="6" className="g-ref g-ref-media" />
        <text x="24" y="10" className="g-rotulo">média {formatarX(m)}</text>
        <line x1="0" x2="18" y1="24" y2="24" className="g-ref g-ref-mediana" />
        <text x="24" y="28" className="g-rotulo">mediana {formatarX(md)}</text>
      </g>
    </Moldura>
  );
}
