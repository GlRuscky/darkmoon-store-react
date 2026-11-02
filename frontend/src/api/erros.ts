import { isAxiosError } from "axios";

export type ErroApi = {
  /** mensagem geral, para mostrar no topo do formulário */
  mensagem: string;
  /** mensagens por campo, vindas da API (ex.: { cpf: "CPF inválido" }) */
  campos: Record<string, string>;
  status: number | null;
};

function mensagemPorStatus(status: number): string {
  if (status === 400) return "Há dados inválidos. Confira os campos.";
  if (status === 401) return "Não autorizado. Faça login novamente.";
  if (status === 404) return "Recurso não encontrado.";
  if (status === 409) return "Esses dados já estão cadastrados.";
  if (status === 413 || status === 415) return "Requisição inválida.";
  if (status >= 500) return "Erro no servidor. Tente novamente em instantes.";
  return "Não foi possível concluir a operação.";
}

/**
 * Converte qualquer erro do axios em algo que a tela sabe mostrar.
 * Trata: API fora do ar / sem internet, timeout, 4xx com { erro, campos } e 5xx.
 */
export function lerErroApi(e: unknown): ErroApi {
  if (isAxiosError(e)) {
    if (!e.response) {
      const demorou = e.code === "ECONNABORTED";
      return {
        mensagem: demorou
          ? "O servidor demorou demais para responder. Tente novamente."
          : "Não foi possível conectar ao servidor. Verifique se a API está rodando.",
        campos: {},
        status: null,
      };
    }
    const corpo = e.response.data as { erro?: unknown; campos?: unknown } | undefined;
    const campos: Record<string, string> = {};
    if (corpo && typeof corpo.campos === "object" && corpo.campos !== null) {
      for (const [k, v] of Object.entries(corpo.campos)) {
        if (typeof v === "string") campos[k] = v;
      }
    }
    return {
      mensagem: typeof corpo?.erro === "string" ? corpo.erro : mensagemPorStatus(e.response.status),
      campos,
      status: e.response.status,
    };
  }
  return { mensagem: "Ocorreu um erro inesperado.", campos: {}, status: null };
}
