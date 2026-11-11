import { avaliarSenha } from "../dominio/validacao";

const ROTULO = { fraca: "Fraca", media: "Média", forte: "Forte" } as const;

export function MedidorSenha({ senha }: { senha: string }) {
  if (senha === "") return null;
  const { nivel, pontos, sugestoes } = avaliarSenha(senha);
  return (
    <div className="medidor" aria-live="polite">
      <div className="medidor-barra" aria-hidden="true">
        <span className={`medidor-preenchido nivel-${nivel}`} style={{ width: `${(pontos / 6) * 100}%` }} />
      </div>
      <p>
        Força da senha: <strong className={`texto-${nivel}`}>{ROTULO[nivel]}</strong>
        {nivel !== "forte" && sugestoes.length > 0 && <> — dica: {sugestoes[0]}</>}
      </p>
    </div>
  );
}
