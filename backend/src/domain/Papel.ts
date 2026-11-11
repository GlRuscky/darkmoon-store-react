import { ErroValidacao } from "./erros.ts";

export const PAPEIS = ["usuario", "admin"] as const;
export type Papel = (typeof PAPEIS)[number];

export function lerPapel(entrada: unknown): Papel {
  if (typeof entrada === "string" && (PAPEIS as readonly string[]).includes(entrada)) {
    return entrada as Papel;
  }
  throw new ErroValidacao({ papel: "Papel inválido. Use 'usuario' ou 'admin'" });
}
