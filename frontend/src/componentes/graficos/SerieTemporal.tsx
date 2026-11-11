import { ALTURA, dominioBonito, LARGURA, linear, MARGEM } from "./escala";
import { Moldura } from "./Moldura";

type Props = {
  rotulos: string[];
  valores: number[];
  /** média móvel (mesmo tamanho de `valores`; null onde não existe) */
  tendencia?: (number | null)[];
  titulo: string;
  tituloY?: string;
  tituloX?: string;
  formatarY: (v: number) => string;
  nomeSerie: string;
  nomeTendencia?: string;
};

/** Série temporal: evolução ao longo do tempo (tendência e sazonalidade). */
export function SerieTemporal({
  rotulos, valores, tendencia, titulo, tituloX, tituloY, formatarY, nomeSerie, nomeTendencia = "Média móvel",
}: Props) {
  if (valores.length === 0) return <p className="vazio">Sem dados para exibir.</p>;

  const esq = MARGEM.l;
  const dir = LARGURA - MARGEM.r;
  const base = ALTURA - MARGEM.b;
  const dy = dominioBonito(0, Math.max(...valores), 5);
  const sy = linear(dy.min, dy.max, base, MARGEM.t);
  const passo = valores.length > 1 ? (dir - esq - 20) / (valores.length - 1) : 0;
  const sx = (i: number) => esq + 10 + i * passo;

  const caminho = valores.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ");

  let caminhoTend = "";
  tendencia?.forEach((v, i) => {
    if (v === null) return;
    caminhoTend += `${caminhoTend === "" ? "M" : "L"}${sx(i)},${sy(v)} `;
  });

  const iMax = valores.indexOf(Math.max(...valores));

  return (
    <Moldura
      titulo={titulo}
      descricao={`Série de ${valores.length} períodos; pico em ${rotulos[iMax]}.`}
      yMarcas={dy.marcas}
      sy={sy}
      formatarY={formatarY}
      tituloX={tituloX}
      tituloY={tituloY}
    >
      <path d={caminho} className="g-linha" />
      {caminhoTend && <path d={caminhoTend} className="g-linha-tendencia" />}
      {valores.map((v, i) => (
        <g key={i}>
          <circle cx={sx(i)} cy={sy(v)} r={4.5} className="g-ponto">
            <title>{`${rotulos[i]}: ${formatarY(v)}`}</title>
          </circle>
          <text x={sx(i)} y={base + 18} textAnchor="middle" className="g-rotulo">{rotulos[i]}</text>
        </g>
      ))}
      <text x={sx(iMax)} y={sy(valores[iMax]!) - 10} textAnchor="middle" className="g-valor">
        {formatarY(valores[iMax]!)}
      </text>
      <g transform={`translate(${esq + 12} ${MARGEM.t + 2})`}>
        <line x1="0" x2="20" y1="6" y2="6" className="g-linha" />
        <text x="26" y="10" className="g-rotulo">{nomeSerie}</text>
        {caminhoTend && (
          <>
            <line x1="0" x2="20" y1="24" y2="24" className="g-linha-tendencia" />
            <text x="26" y="28" className="g-rotulo">{nomeTendencia}</text>
          </>
        )}
      </g>
    </Moldura>
  );
}
