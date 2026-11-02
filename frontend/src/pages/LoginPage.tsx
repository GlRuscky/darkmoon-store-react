import { useState, type SubmitEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { lerErroApi } from "../api/erros";
import { Campo } from "../componentes/Campo";
import { useAuth } from "../contexto/auth";
import { validarEmail } from "../dominio/validacao";

type EstadoRota = { cadastroOk?: boolean; email?: string; de?: string } | null;

export function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const estado = useLocation().state as EstadoRota;

  const [email, setEmail] = useState(estado?.email ?? "");
  const [senha, setSenha] = useState("");
  const [tentou, setTentou] = useState(false);
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);

  const erroEmail = validarEmail(email);
  const erroSenha = senha === "" ? "Senha é obrigatória" : "";

  async function enviar(event: SubmitEvent) {
    event.preventDefault();
    setTentou(true);
    setErroGeral("");
    if (erroEmail || erroSenha) return;

    setEnviando(true);
    try {
      const logado = await entrar(email.trim(), senha);
      // Admin cai direto no painel; os demais voltam para onde estavam (ou para a home).
      navigate(estado?.de ?? (logado.papel === "admin" ? "/admin" : "/"), { replace: true });
    } catch (e) {
      setErroGeral(lerErroApi(e).mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="formulario-pagina">
      <h1 className="titulo-pagina">Entrar</h1>

      {estado?.cadastroOk && !erroGeral && (
        <div className="alerta alerta-sucesso" role="status">
          Cadastro feito com sucesso! 🎉 Agora é só entrar com o seu e-mail e senha.
        </div>
      )}
      {erroGeral && <div className="alerta alerta-erro" role="alert">{erroGeral}</div>}

      <form onSubmit={enviar} noValidate className="formulario">
        <Campo
          id="email" rotulo="E-mail" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          erro={tentou ? erroEmail : ""} required
        />
        <Campo
          id="senha" rotulo="Senha" type="password" autoComplete="current-password"
          value={senha} onChange={(e) => setSenha(e.target.value)}
          erro={tentou ? erroSenha : ""} required
        />
        <button type="submit" className="btn btn-primary btn-bloco" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="formulario-rodape">Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link></p>
    </section>
  );
}
