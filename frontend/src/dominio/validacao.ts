/**
 * Validações do formulário de cadastro.
 * Espelham as regras do back-end (a API continua sendo a palavra final,
 * mas validar aqui dá resposta imediata ao usuário sem ida ao servidor).
 */

export type NivelSenha = "fraca" | "media" | "forte";

export type AvaliacaoSenha = {
  nivel: NivelSenha;
  pontos: number; // 0 a 6
  sugestoes: string[];
};

const SENHAS_COMUNS = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "senha123",
  "qwerty123", "qwertyui", "abc12345", "11111111", "iloveyou", "admin123",
  "senha1234", "mudar123", "brasil123", "12341234", "00000000", "abcd1234",
]);

/** Retorna a mensagem de erro, ou "" se o campo está válido. */
export type Resultado = string;

export function validarNome(valor: string): Resultado {
  const nome = valor.trim().replace(/\s+/g, " ");
  if (nome === "") return "Nome é obrigatório";
  if (nome.length < 3) return "Nome deve ter pelo menos 3 caracteres";
  if (nome.length > 150) return "Nome deve ter no máximo 150 caracteres";
  if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(nome)) return "Nome deve conter apenas letras";
  return "";
}

export function validarEmail(valor: string): Resultado {
  const email = valor.trim().toLowerCase();
  if (email === "") return "E-mail é obrigatório";
  if (email.length > 254) return "E-mail muito longo";
  const partes = email.split("@");
  if (partes.length !== 2) return "E-mail inválido";
  const [local, dominio] = partes as [string, string];
  const localOk =
    local.length >= 1 && local.length <= 64 &&
    /^[a-z0-9._%+-]+$/.test(local) &&
    !local.startsWith(".") && !local.endsWith(".") && !local.includes("..");
  const dominioOk = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(dominio);
  return localOk && dominioOk ? "" : "E-mail inválido";
}

/** Só os dígitos de um texto. */
export const apenasDigitos = (v: string): string => v.replace(/\D/g, "");

/** Máscara progressiva enquanto o usuário digita: 123.456.789-09 */
export function formatarCpf(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function validarCpf(valor: string): Resultado {
  if (valor.trim() === "") return "CPF é obrigatório";
  const d = apenasDigitos(valor);
  if (d.length !== 11) return "CPF deve ter 11 dígitos";
  if (/^(\d)\1{10}$/.test(d)) return "CPF inválido";

  const dv = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const ok = dv(d.slice(0, 9), 10) === Number(d[9]) && dv(d.slice(0, 10), 11) === Number(d[10]);
  return ok ? "" : "CPF inválido";
}

function ehSequencia(texto: string): boolean {
  if (texto.length < 4) return false;
  const t = texto.toLowerCase();
  let cresc = true;
  let decresc = true;
  for (let i = 1; i < t.length; i++) {
    const diff = t.charCodeAt(i) - t.charCodeAt(i - 1);
    if (diff !== 1) cresc = false;
    if (diff !== -1) decresc = false;
  }
  return cresc || decresc;
}

/** Mesma pontuação do back-end: usada pelo medidor de força da senha. */
export function avaliarSenha(texto: string): AvaliacaoSenha {
  const sugestoes: string[] = [];
  let pontos = 0;

  if (texto.length >= 8) pontos++; else sugestoes.push("usar pelo menos 8 caracteres");
  if (texto.length >= 12) pontos++; else sugestoes.push("usar 12 ou mais caracteres");
  if (/[a-z]/.test(texto)) pontos++; else sugestoes.push("incluir letra minúscula");
  if (/[A-Z]/.test(texto)) pontos++; else sugestoes.push("incluir letra maiúscula");
  if (/\d/.test(texto)) pontos++; else sugestoes.push("incluir número");
  if (/[^A-Za-z0-9]/.test(texto)) pontos++; else sugestoes.push("incluir símbolo (ex.: !@#$)");

  const previsivel =
    SENHAS_COMUNS.has(texto.toLowerCase()) || /^(.)\1+$/.test(texto) || ehSequencia(texto);

  let nivel: NivelSenha = pontos >= 5 ? "forte" : pontos === 4 ? "media" : "fraca";
  if (previsivel && texto.length > 0) {
    nivel = "fraca";
    sugestoes.unshift("evitar senhas comuns ou sequências (123456, abcdef, aaaa)");
  }
  return { nivel, pontos, sugestoes };
}

export function validarSenha(texto: string): Resultado {
  if (texto === "") return "Senha é obrigatória";
  if (texto.length < 8) return "Senha deve ter pelo menos 8 caracteres";
  if (texto.length > 128) return "Senha deve ter no máximo 128 caracteres";
  if (!/[A-Za-z]/.test(texto) || !/\d/.test(texto)) return "Senha deve conter letras e números";
  const { nivel, sugestoes } = avaliarSenha(texto);
  if (nivel === "fraca") return `Senha fraca. Tente ${sugestoes.slice(0, 2).join(" e ")}`;
  return "";
}

/** Verificação dupla: a confirmação precisa ser idêntica à senha. */
export function validarConfirmacao(senha: string, confirmacao: string): Resultado {
  if (confirmacao === "") return "Confirme a senha";
  return senha === confirmacao ? "" : "As senhas não coincidem";
}

export type CamposCadastro = {
  nome: string; email: string; cpf: string; senha: string; confirmarSenha: string;
};
export type ErrosCadastro = Partial<Record<keyof CamposCadastro, string>>;

/** Valida o formulário inteiro e devolve só os campos com erro. */
export function validarCadastro(c: CamposCadastro): ErrosCadastro {
  const erros: ErrosCadastro = {};
  const nome = validarNome(c.nome); if (nome) erros.nome = nome;
  const email = validarEmail(c.email); if (email) erros.email = email;
  const cpf = validarCpf(c.cpf); if (cpf) erros.cpf = cpf;
  const senha = validarSenha(c.senha); if (senha) erros.senha = senha;
  const conf = validarConfirmacao(c.senha, c.confirmarSenha); if (conf) erros.confirmarSenha = conf;
  return erros;
}
