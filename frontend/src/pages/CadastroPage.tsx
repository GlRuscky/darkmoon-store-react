import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { lerErroApi } from "../api/erros";
import { Campo } from "../componentes/Campo";
import { MedidorSenha } from "../componentes/MedidorSenha";
import {
  apenasDigitos, formatarCpf, validarCadastro,
  type CamposCadastro, type ErrosCadastro,
} from "../dominio/validacao";

const CAMPOS = ["nome", "email", "cpf", "senha", "confirmarSenha"] as const;
const VAZIO: CamposCadastro = { nome: "", email: "", cpf: "", senha: "", confirmarSenha: "" };

export function CadastroPage() {
  const navigate = useNavigate();
  const [campos, setCampos] = useState<CamposCadastro>(VAZIO);
  const [tocados, setTocados] = useState<Partial<Record<keyof CamposCadastro, boolean>>>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  /** erros devolvidos pela API (ex.: "E-mail já cadastrado"); somem quando o campo é editado */
  const [errosApi, setErrosApi] = useState<ErrosCadastro>({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Validação local recalculada a cada render: é barata e mantém tudo sempre coerente
  // (ex.: ao editar a senha, a confirmação passa a ficar válida/inválida na hora).
  const errosLocais = validarCadastro(campos);

  const erroDe = (c: keyof CamposCadastro): string | undefined =>
    tocados[c] || tentouEnviar ? (errosLocais[c] ?? errosApi[c]) : errosApi[c];

  function alterar(campo: keyof CamposCadastro, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: campo === "cpf" ? formatarCpf(valor) : valor }));
    setErrosApi((atual) => {
      if (!atual[campo]) return atual;
      const { [campo]: _removido, ...resto } = atual;
      void _removido;
      return resto;
    });
  }

  const tocar = (campo: keyof CamposCadastro) => setTocados((t) => ({ ...t, [campo]: true }));

  async function enviar(event: SubmitEvent) {
    event.preventDefault();
    setErroGeral("");
    setTentouEnviar(true);

    const primeiroComErro = CAMPOS.find((c) => errosLocais[c]);
    if (primeiroComErro) {
      document.getElementById(primeiroComErro)?.focus();
      return;
    }

    setEnviando(true);
    try {
      await api.post("/usuarios", {
        nome: campos.nome.trim(),
        email: campos.email.trim(),
        cpf: apenasDigitos(campos.cpf),
        senha: campos.senha,
        confirmarSenha: campos.confirmarSenha,
      });
      // Sucesso: vai para o login levando um aviso e o e-mail já preenchido.
      navigate("/login", { replace: true, state: { cadastroOk: true, email: campos.email.trim() } });
    } catch (e) {
      const erro = lerErroApi(e);
      const doServidor: ErrosCadastro = {};
      for (const c of CAMPOS) if (erro.campos[c]) doServidor[c] = erro.campos[c];
      setErrosApi(doServidor);
      setErroGeral(erro.mensagem);
      const primeiro = CAMPOS.find((c) => doServidor[c]);
      if (primeiro) document.getElementById(primeiro)?.focus();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="formulario-pagina">
      <h1 className="titulo-pagina">Criar Conta</h1>

      {erroGeral && <div className="alerta alerta-erro" role="alert">{erroGeral}</div>}

      <form onSubmit={enviar} noValidate className="formulario">
        <Campo
          id="nome" rotulo="Nome completo" type="text" autoComplete="name"
          value={campos.nome} onChange={(e) => alterar("nome", e.target.value)} onBlur={() => tocar("nome")}
          erro={erroDe("nome")} required
        />
        <Campo
          id="email" rotulo="E-mail" type="email" autoComplete="email" inputMode="email"
          value={campos.email} onChange={(e) => alterar("email", e.target.value)} onBlur={() => tocar("email")}
          erro={erroDe("email")} required
        />
        <Campo
          id="cpf" rotulo="CPF" type="text" inputMode="numeric" placeholder="000.000.000-00" maxLength={14}
          value={campos.cpf} onChange={(e) => alterar("cpf", e.target.value)} onBlur={() => tocar("cpf")}
          erro={erroDe("cpf")} required
        />
        <Campo
          id="senha" rotulo="Senha" type="password" autoComplete="new-password"
          value={campos.senha} onChange={(e) => alterar("senha", e.target.value)} onBlur={() => tocar("senha")}
          erro={erroDe("senha")} required
          ajuda={<MedidorSenha senha={campos.senha} />}
        />
        <Campo
          id="confirmarSenha" rotulo="Confirmar senha" type="password" autoComplete="new-password"
          value={campos.confirmarSenha} onChange={(e) => alterar("confirmarSenha", e.target.value)}
          onBlur={() => tocar("confirmarSenha")}
          erro={erroDe("confirmarSenha")} required
        />

        <button type="submit" className="btn btn-primary btn-bloco" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      <p className="formulario-rodape">Já tem conta? <Link to="/login">Entrar</Link></p>
    </section>
  );
}
