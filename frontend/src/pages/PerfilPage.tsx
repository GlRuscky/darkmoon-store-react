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
  validarEmail,
  validarCpf,
} from "../dominio/validacao";

export function PerfilPage() {
  const { usuario, atualizarUsuario } = useAuth();

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [cpf, setCpf] = useState("");

  const [tocados, setTocados] = useState({
    nome: false,
    email: false,
    cpf: false,
  });

  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  const erros = {
    nome: validarNome(nome),
    email: validarEmail(email),
    cpf: cpf.trim() ? validarCpf(cpf) : "",
  };

  function tocar(campo: keyof typeof tocados) {
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  async function salvar(event: SubmitEvent) {
    event.preventDefault();

    setErroGeral("");
    setSucesso("");

    setTocados({ nome: true, email: true, cpf: true });

    const primeiroErro = Object.entries(erros).find(
      ([, mensagem]) => mensagem,
    );

    if (primeiroErro) {
      document.getElementById(primeiroErro[0])?.focus();
      return;
    }

    setEnviando(true);

    try {
      const dados: {
        nome: string;
        email: string;
        cpf?: string;
      } = {
        nome: nome.trim(),
        email: email.trim(),
      };

      const cpfNovo = apenasDigitos(cpf);

      if (cpfNovo) {
        dados.cpf = cpfNovo;
      }

      const { data } = await api.put<UsuarioLogado>(
        "/usuarios/me",
        dados,
      );

      atualizarUsuario(data);
      setNome(data.nome);
      setEmail(data.email);
      setCpf("");
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => tocar("email")}
          erro={tocados.email ? erros.email : undefined}
          required
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
              ? `CPF cadastrado atualmente: ${usuario.cpf}. Deixe o campo vazio para manter esse CPF.`
              : "Nenhum CPF cadastrado. Informe um CPF se desejar adicioná-lo."
          }
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