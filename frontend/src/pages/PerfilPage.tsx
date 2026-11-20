import { useState, type SubmitEvent } from "react";
import { useAuth } from "../contexto/auth";
import { api } from "../api/axios";
import { lerErroApi } from "../api/erros";
import type { UsuarioLogado } from "../api/tipos";
import { Campo } from "../componentes/Campo";
import {
  apenasDigitos,
  formatarCpf,
  validarNome,
  validarCpf,
  validarSenha,
  validarConfirmacao,
} from "../dominio/validacao";

export function PerfilPage() {
  const { usuario, atualizarUsuario } = useAuth();

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [tocados, setTocados] = useState({
    nome: false,
    cpf: false,
    senha: false,
    confirmarSenha: false,
  });

  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  const erros = {
    nome: validarNome(nome),
    cpf: validarCpf(cpf),
    senha: validarSenha(senha),
    confirmarSenha: validarConfirmacao(senha, confirmarSenha),
  };

  function tocar(campo: keyof typeof tocados) {
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  async function salvar(event: SubmitEvent) {
    event.preventDefault();

    setErroGeral("");
    setSucesso("");

    setTocados({ nome: true, cpf: true, senha: true, confirmarSenha: true });

    const primeiroErro = Object.entries(erros).find(
      ([, mensagem]) => mensagem,
    );

    if (primeiroErro) {
      document.getElementById(primeiroErro[0])?.focus();
      return;
    }

    setEnviando(true);

    try {
      const { data } = await api.put<UsuarioLogado>("/usuarios/me", {
        nome: nome.trim(),
        cpf: apenasDigitos(cpf),
        senha,
      });

      atualizarUsuario(data);
      setNome(data.nome);
      setCpf("");
      setSenha("");
      setConfirmarSenha("");
      setTocados({
        nome: false,
        cpf: false,
        senha: false,
        confirmarSenha: false,
      });
      setSucesso("Perfil atualizado com sucesso!");
    } catch (erro) {
      setErroGeral(lerErroApi(erro).mensagem);
    } finally {
      setEnviando(false);
    }
  }

  if (!usuario) return null;

  return (
    <section className="formulario-pagina">
      <h1 className="titulo-pagina">Meu Perfil</h1>

      <p className="texto-suave">
        Atualize suas informações pessoais da DarkMoon Store.
      </p>

      {erroGeral && (
        <div className="alerta alerta-erro" role="alert">
          {erroGeral}
        </div>
      )}

      {sucesso && (
        <div className="alerta alerta-sucesso" role="status">
          {sucesso}
        </div>
      )}

      <form onSubmit={salvar} noValidate className="formulario">
        <Campo
          id="nome"
          rotulo="Nome completo"
          type="text"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => tocar("nome")}
          erro={tocados.nome ? erros.nome : undefined}
          required
        />

        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          value={usuario.email}
          readOnly
          ajuda="O e-mail não pode ser alterado."
        />

        <Campo
          id="cpf"
          rotulo="CPF"
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          maxLength={14}
          value={cpf}
          onChange={(e) => setCpf(formatarCpf(e.target.value))}
          onBlur={() => tocar("cpf")}
          erro={tocados.cpf ? erros.cpf : undefined}
          ajuda={
            usuario.cpf
              ? `CPF cadastrado atualmente: ${usuario.cpf}.`
              : undefined
          }
          required
        />

        <Campo
          id="senha"
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onBlur={() => tocar("senha")}
          erro={tocados.senha ? erros.senha : undefined}
          required
        />

        <Campo
          id="confirmarSenha"
          rotulo="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          onBlur={() => tocar("confirmarSenha")}
          erro={tocados.confirmarSenha ? erros.confirmarSenha : undefined}
          required
        />

        <button
          type="submit"
          className="btn btn-primary btn-bloco"
          disabled={enviando}
        >
          {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </section>
  );
}