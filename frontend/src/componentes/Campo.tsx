import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  rotulo: string;
  erro?: string;
  ajuda?: ReactNode;
};

/** Campo de formulário acessível: rótulo ligado ao input e erro anunciado por leitores de tela. */
export function Campo({ id, rotulo, erro, ajuda, ...input }: Props) {
  const idErro = `${id}-erro`;
  const idAjuda = `${id}-ajuda`;
  return (
    <div className={`campo ${erro ? "campo-invalido" : ""}`}>
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[erro ? idErro : "", ajuda ? idAjuda : ""].filter(Boolean).join(" ") || undefined}
        {...input}
      />
      {ajuda && <div id={idAjuda} className="campo-ajuda">{ajuda}</div>}
      {erro && <p id={idErro} className="campo-erro" role="alert">{erro}</p>}
    </div>
  );
}
