import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export class SenhaHasher {
  readonly #tamanhoChave = 64;

  hash(texto: string): string {
    const salt = randomBytes(16);
    const derivada = scryptSync(texto, salt, this.#tamanhoChave);
    return `scrypt$${salt.toString("base64")}$${derivada.toString("base64")}`;
  }

  verificar(texto: string, armazenado: string): boolean {
    const partes = armazenado.split("$");
    if (partes.length !== 3 || partes[0] !== "scrypt") return false;
    const salt = Buffer.from(partes[1]!, "base64");
    const esperado = Buffer.from(partes[2]!, "base64");
    const calculado = scryptSync(texto, salt, esperado.length);
    
    return timingSafeEqual(calculado, esperado);
  }
}
