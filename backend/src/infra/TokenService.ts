import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ErroNaoAutorizado } from "../domain/erros.ts";

type Payload = { sub: number; email: string; exp: number };

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** Token assinado com HMAC-SHA256 (mesmo princípio do JWT HS256, sem dependências). */
export class TokenService {
  readonly #segredo: Buffer;
  readonly #duracaoSegundos: number;

  constructor(segredo?: string, duracaoSegundos = 60 * 60 * 2) {
    // Sem JWT_SECRET definido, gera um segredo aleatório (tokens deixam de valer ao reiniciar).
    this.#segredo = segredo ? Buffer.from(segredo) : randomBytes(32);
    this.#duracaoSegundos = duracaoSegundos;
  }

  #assinar(corpo: string): string {
    return createHmac("sha256", this.#segredo).update(corpo).digest("base64url");
  }

  emitir(usuarioId: number, email: string): string {
    const payload: Payload = {
      sub: usuarioId,
      email,
      exp: Math.floor(Date.now() / 1000) + this.#duracaoSegundos,
    };
    const corpo = b64(JSON.stringify(payload));
    return `${corpo}.${this.#assinar(corpo)}`;
  }

  verificar(token: string): Payload {
    const [corpo, assinatura] = token.split(".");
    if (!corpo || !assinatura) throw new ErroNaoAutorizado("Token inválido");

    const esperada = Buffer.from(this.#assinar(corpo));
    const recebida = Buffer.from(assinatura);
    if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) {
      throw new ErroNaoAutorizado("Token inválido");
    }
    let payload: Payload;
    try {
      payload = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as Payload;
    } catch {
      throw new ErroNaoAutorizado("Token inválido");
    }
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      throw new ErroNaoAutorizado("Sessão expirada. Faça login novamente");
    }
    return payload;
  }
}
