import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  rotulo: string;
  opcoes: readonly string[];
  erro?: string;
};

/** Lista de escolha acessível, no mesmo padrão do <Campo>. */
export function CampoSelect({ id, rotulo, opcoes, erro, ...select }: Props) {
  const idErro = `${id}-erro`;
  return (
    <div className={`campo ${erro ? "campo-invalido" : ""}`}>
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} aria-invalid={erro ? true : undefined} aria-describedby={erro ? idErro : undefined} {...select}>
        <option value="">Selecione...</option>
        {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {erro && <p id={idErro} className="campo-erro" role="alert">{erro}</p>}
    </div>
  );
}
