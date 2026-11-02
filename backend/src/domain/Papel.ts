import { ErroValidacao } from "./erros.ts";

/** Papéis possíveis de um usuário. Quem se cadastra pelo site é sempre "usuario". */
export const PAPEIS = ["usuario", "admin"] as const;
export type Papel = (typeof PAPEIS)[number];

/** Converte uma entrada qualquer em Papel ou lança ErroValidacao. */
export function lerPapel(entrada: unknown): Papel {
  if (typeof entrada === "string" && (PAPEIS as readonly string[]).includes(entrada)) {
    return entrada as Papel;
  }
  throw new ErroValidacao({ papel: "Papel inválido. Use 'usuario' ou 'admin'" });
}
