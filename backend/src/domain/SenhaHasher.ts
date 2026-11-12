
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { compareSync } from "bcryptjs";

export class SenhaHasher {
  readonly #tamanhoChave = 64;

  /** Gera novos hashes usando scrypt. */
  hash(texto: string): string {
    const salt = randomBytes(16);
    const derivada = scryptSync(texto, salt, this.#tamanhoChave);

    return `scrypt$${salt.toString("base64")}$${derivada.toString("base64")}`;
  }

  /** Verifica hashes novos (scrypt) e antigos (bcrypt/PHP). */
  verificar(texto: string, armazenado: string): boolean {
    // Compatibilidade com senhas antigas cadastradas pelo sistema PHP.
    if (/^\$2y\$/.test(armazenado)) {
      const hashCompatível = armazenado.replace(/^\$2y\$/, "$2b$");
      return compareSync(texto, hashCompatível);
    }

    // Compatibilidade com hashes scrypt gerados pelo sistema atual.
    const partes = armazenado.split("$");

    if (partes.length !== 3 || partes[0] !== "scrypt") {
      return false;
    }

    const salt = Buffer.from(partes[1]!, "base64");
    const esperado = Buffer.from(partes[2]!, "base64");

    if (salt.length === 0 || esperado.length === 0) {
      return false;
    }

    const calculado = scryptSync(texto, salt, esperado.length);

    return timingSafeEqual(calculado, esperado);
  }
}
