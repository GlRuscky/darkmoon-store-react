/** Validação dos formulários do painel admin (a API valida de novo: esta é só para avisar rápido). */

export type ProdutoForm = {
  nome: string;
  descricao: string;
  preco: string;
  estoque: string;
  imagem: string;
  genero: string;
  categoria: string;
};

export type CupomForm = { codigo: string; percentual: string; ativo: boolean };

export const GENEROS = ["Masculino", "Feminino", "Unissex"] as const;
export const CATEGORIAS = ["Camisas", "Vestidos", "Botas", "Acessórios"] as const;

/** Aceita "79.90" e também "79,90". Vazio ou inválido vira NaN. */
export function lerNumero(texto: string): number {
  const t = texto.trim().replace(",", ".");
  return t === "" ? NaN : Number(t);
}

export function validarProduto(f: ProdutoForm): Record<string, string> {
  const erros: Record<string, string> = {};
  const nome = f.nome.trim();
  if (nome === "") erros.nome = "Nome é obrigatório";
  else if (nome.length < 3 || nome.length > 120) erros.nome = "Nome deve ter entre 3 e 120 caracteres";

  if (f.descricao.trim().length > 500) erros.descricao = "Descrição deve ter no máximo 500 caracteres";

  const preco = lerNumero(f.preco);
  if (Number.isNaN(preco)) erros.preco = "Preço é obrigatório e deve ser um número";
  else if (preco < 0 || preco > 100_000) erros.preco = "Preço deve estar entre 0 e 100.000";

  const estoque = lerNumero(f.estoque);
  if (Number.isNaN(estoque)) erros.estoque = "Estoque é obrigatório e deve ser um número";
  else if (!Number.isInteger(estoque) || estoque < 0) erros.estoque = "Estoque deve ser um número inteiro (0 ou mais)";

  const imagem = f.imagem.trim();
  if (imagem !== "" && !/^[A-Za-z0-9_-]{1,100}\.(webp|jpe?g|png|gif|svg)$/.test(imagem)) {
    erros.imagem = "Use só o nome do arquivo, ex.: bota1.webp";
  }
  if (!(GENEROS as readonly string[]).includes(f.genero)) erros.genero = "Escolha o gênero";
  if (!(CATEGORIAS as readonly string[]).includes(f.categoria)) erros.categoria = "Escolha a categoria";
  return erros;
}

export function validarCupom(f: CupomForm, editando: boolean): Record<string, string> {
  const erros: Record<string, string> = {};
  const codigo = f.codigo.trim().toUpperCase();
  if (!editando) {
    if (codigo === "") erros.codigo = "Código é obrigatório";
    else if (!/^[A-Z0-9_-]{3,20}$/.test(codigo)) erros.codigo = "Código deve ter de 3 a 20 letras, números, - ou _";
  }
  const p = lerNumero(f.percentual);
  if (Number.isNaN(p)) erros.percentual = "Percentual é obrigatório e deve ser um número";
  else if (p <= 0 || p > 100) erros.percentual = "Percentual deve ser maior que 0 e no máximo 100";
  return erros;
}

export function produtoParaForm(p: {
  nome: string; descricao: string; preco: number; estoque: number; imagem: string; genero: string; categoria: string;
}): ProdutoForm {
  return {
    nome: p.nome, descricao: p.descricao ?? "", preco: String(p.preco), estoque: String(p.estoque),
    imagem: p.imagem ?? "", genero: p.genero, categoria: p.categoria,
  };
}

export const PRODUTO_VAZIO: ProdutoForm = {
  nome: "", descricao: "", preco: "", estoque: "", imagem: "", genero: "", categoria: "",
};
export const CUPOM_VAZIO: CupomForm = { codigo: "", percentual: "", ativo: true };

/** Cópia do objeto de erros sem o campo informado (some o erro da API quando o usuário corrige). */
export function semCampo(erros: Record<string, string>, campo: string): Record<string, string> {
  return Object.fromEntries(Object.entries(erros).filter(([k]) => k !== campo));
}
