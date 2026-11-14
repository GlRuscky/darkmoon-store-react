
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { Banco } from "../infra/banco.ts";
import { SenhaHasher } from "../domain/SenhaHasher.ts";
import {
  ErroConflito,
  ErroNaoAutorizado,
  ErroNaoEncontrado,
  ErroProibido,
  ErroValidacao,
} from "../domain/erros.ts";
import { TokenService } from "../infra/TokenService.ts";
import { UsuarioRepository } from "../infra/UsuarioRepository.ts";
import { CatalogoAdminService } from "../services/CatalogoAdminService.ts";
import { LojaService } from "../services/LojaService.ts";
import { UsuarioService } from "../services/UsuarioService.ts";
import { PedidosAdminService } from "../services/PedidosAdminService.ts";

const LIMITE_CORPO = 10_000;

class ErroHttp extends Error {
  readonly status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

export function criarApp(
  db: Banco,
  opts: { segredo?: string; origensPermitidas?: string[] } = {},
): Server {
  const tokens = new TokenService(opts.segredo);
  const usuarios = new UsuarioService(
    new UsuarioRepository(db),
    new SenhaHasher(),
    tokens,
  );
  const loja = new LojaService(db);
  const catalogo = new CatalogoAdminService(db);
  const pedidos = new PedidosAdminService(db);

  const origens = opts.origensPermitidas ?? [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];

  const enviar = (res: ServerResponse, status: number, corpo: unknown) => {
    const json = JSON.stringify(corpo);
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(json);
  };

  const lerJson = (req: IncomingMessage): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const tipo = req.headers["content-type"] ?? "";

      if (!tipo.includes("application/json")) {
        reject(new ErroHttp(415, "Envie o corpo como application/json"));
        return;
      }

      let tamanho = 0;
      const partes: Buffer[] = [];

      req.on("data", (c: Buffer) => {
        tamanho += c.length;

        if (tamanho > LIMITE_CORPO) {
          reject(new ErroHttp(413, "Corpo da requisição grande demais"));
          req.destroy();
          return;
        }

        partes.push(c);
      });

      req.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(partes).toString("utf8") || "{}"));
        } catch {
          reject(new ErroHttp(400, "JSON inválido"));
        }
      });

      req.on("error", reject);
    });

  const exigirLogin = (req: IncomingMessage) => {
    const h = req.headers.authorization ?? "";

    if (!h.startsWith("Bearer ")) {
      throw new ErroNaoAutorizado("Faça login para continuar");
    }

    return tokens.verificar(h.slice(7));
  };

  /** Login + papel admin (conferido no banco). */
  const exigirAdmin = async (req: IncomingMessage) =>
    await usuarios.exigirAdmin(exigirLogin(req).sub);

  const idNumerico = (texto: string | undefined): number => {
    if (!texto || !/^\d+$/.test(texto)) {
      throw new ErroHttp(404, "Rota não encontrada");
    }

    return Number(texto);
  };

  const semConteudo = (res: ServerResponse) => {
    res.writeHead(204);
    res.end();
  };

  const numeroOpcional = (v: string | null): number | undefined => {
    if (v === null || v.trim() === "") return undefined;

    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return createServer(async (req, res) => {
    // CORS: só as origens do front são aceitas.
    const origem = req.headers.origin;

    if (origem && origens.includes(origem)) {
      res.setHeader("Access-Control-Allow-Origin", origem);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
    }

    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const rota = `${req.method} ${url.pathname}`;

      if (rota === "GET /saude") {
        return enviar(res, 200, { status: "ok" });
      }

      if (rota === "POST /usuarios") {
        const usuario = await usuarios.cadastrar(await lerJson(req));
        return enviar(res, 201, usuario.paraResposta());
      }

      if (rota === "POST /login") {
        const { token, usuario } = await usuarios.autenticar(await lerJson(req));
        return enviar(res, 200, {
          token,
          usuario: usuario.paraResposta(),
        });
      }


      if (rota === "PUT /usuarios/me") {
        const sessao = exigirLogin(req);

        const usuario = await usuarios.atualizarPerfil(
          sessao.sub,
          await lerJson(req),
        );

        return enviar(res, 200, usuario.paraResposta());
      }

      
      if (rota === "GET /produtos") {
        const q = url.searchParams;

        const resultado = await loja.listarProdutos({
          busca: q.get("busca")?.trim() || undefined,
          categoria: q.get("categoria")?.trim() || undefined,
          precoMin: numeroOpcional(q.get("preco_min")),
          precoMax: numeroOpcional(q.get("preco_max")),
          pagina: numeroOpcional(q.get("pagina")),
          porPagina: numeroOpcional(q.get("por_pagina")),
        });

        return enviar(res, 200, resultado);
      }


      if (req.method === "GET" && url.pathname.startsWith("/cupons/")) {
        const codigo = decodeURIComponent(
          url.pathname.slice("/cupons/".length),
        );

        return enviar(res, 200, await loja.validarCupom(codigo));
      }

      // O dashboard mostra dados do negócio: só administrador.
      if (rota === "GET /dashboard") {
        await exigirAdmin(req);
        return enviar(res, 200, await loja.dashboard());
      }
      
      // ---------- Painel admin: tudo abaixo exige login + papel admin ----------
      if (url.pathname.startsWith("/admin/")) {
        const admin = await exigirAdmin(req);

        const m = url.pathname.match(
          /^\/admin\/(produtos|cupons|categorias|usuarios|pedidos)(?:\/([^/]+))?$/,
        );

        if (!m) {
          throw new ErroHttp(404, "Rota não encontrada");
        }

        const recurso = m[1];
        const chave =
          m[2] === undefined ? undefined : decodeURIComponent(m[2]);
        const metodo = req.method ?? "GET";

        
        if (recurso === "pedidos") {
          if (chave === undefined && metodo === "GET") {
            const consultaPedidos = new URL(
              req.url ?? "/",
              "http://localhost",
            );

            const pagina = numeroOpcional(
              consultaPedidos.searchParams.get("pagina"),
            );

            const porPagina = numeroOpcional(
              consultaPedidos.searchParams.get("por_pagina"),
            );

            return enviar(
              res,
              200,
              await pedidos.listarPedidos(pagina, porPagina),
            );
          }

          if (chave === undefined && metodo === "POST") {
            return enviar(
              res,
              201,
              await pedidos.criar(await lerJson(req)),
            );
          }

          if (chave !== undefined && metodo === "GET") {
            return enviar(
              res,
              200,
              await pedidos.buscarPedido(idNumerico(chave)),
            );
          }

          if (chave !== undefined && metodo === "PUT") {
            return enviar(
              res,
              200,
              await pedidos.atualizar(
                idNumerico(chave),
                await lerJson(req),
              ),
            );
          }

          if (chave !== undefined && metodo === "PATCH") {
            return enviar(
              res,
              200,
              await pedidos.atualizarStatus(
                idNumerico(chave),
                await lerJson(req),
              ),
            );
          }

          if (chave !== undefined && metodo === "DELETE") {
            return enviar(
              res,
              200,
              await pedidos.excluir(idNumerico(chave)),
            );
          }
        }


        if (recurso === "categorias") {
          if (chave === undefined && metodo === "GET") {
            const consulta = new URL(req.url ?? "/", "http://localhost");

            const pagina = numeroOpcional(
              consulta.searchParams.get("pagina"),
            );

            const porPagina = numeroOpcional(
              consulta.searchParams.get("por_pagina"),
            );

            return enviar(
              res,
              200,
              await catalogo.listarCategorias(pagina, porPagina),
            );
          }

          if (chave === undefined && metodo === "POST") {
            return enviar(
              res,
              201,
              await catalogo.criarCategoria(await lerJson(req)),
            );
          }

          if (chave !== undefined && metodo === "PUT") {
            return enviar(
              res,
              200,
              await catalogo.atualizarCategoria(
                idNumerico(chave),
                await lerJson(req),
              ),
            );
          }

          if (chave !== undefined && metodo === "DELETE") {
            await catalogo.removerCategoria(idNumerico(chave));
            return semConteudo(res);
          }
        }

        if (recurso === "produtos") {
          if (chave === undefined && metodo === "GET") {
            const consulta = new URL(req.url ?? "/", "http://localhost");

            const pagina = numeroOpcional(
              consulta.searchParams.get("pagina"),
            );

            const porPagina = numeroOpcional(
              consulta.searchParams.get("por_pagina"),
            );

            return enviar(
              res,
              200,
              await catalogo.listarProdutos(pagina, porPagina),
            );
          }

          if (chave === undefined && metodo === "POST") {
            return enviar(
              res,
              201,
              await catalogo.criarProduto(await lerJson(req)),
            );
          }

          if (chave !== undefined && metodo === "PUT") {
            return enviar(
              res,
              200,
              await catalogo.atualizarProduto(
                idNumerico(chave),
                await lerJson(req),
              ),
            );
          }

          if (chave !== undefined && metodo === "DELETE") {
            await catalogo.removerProduto(idNumerico(chave));
            return semConteudo(res);
          }
        }

        if (recurso === "cupons") {
          if (chave === undefined && metodo === "GET") {
            const consulta = new URL(req.url ?? "/", "http://localhost");

            const pagina = numeroOpcional(
              consulta.searchParams.get("pagina"),
            );

            const porPagina = numeroOpcional(
              consulta.searchParams.get("por_pagina"),
            );

            return enviar(
              res,
              200,
              await catalogo.listarCupons(pagina, porPagina),
            );
          }

          if (chave === undefined && metodo === "POST") {
            return enviar(
              res,
              201,
              await catalogo.criarCupom(await lerJson(req)),
            );
          }

          if (chave !== undefined && metodo === "PUT") {
            return enviar(
              res,
              200,
              await catalogo.atualizarCupom(chave, await lerJson(req)),
            );
          }

          if (chave !== undefined && metodo === "DELETE") {
            await catalogo.removerCupom(chave);
            return semConteudo(res);
          }
        }

        if (recurso === "usuarios") {
          if (chave === undefined && metodo === "GET") {
            const lista = await usuarios.listar();

            return enviar(
              res,
              200,
              lista.map((u) => u.paraResposta()),
            );
          }

          if (chave !== undefined && metodo === "PATCH") {
            const alterado = await usuarios.alterarPapel(
              admin.id ?? -1,
              idNumerico(chave),
              await lerJson(req),
            );

            return enviar(res, 200, alterado.paraResposta());
          }

          if (chave !== undefined && metodo === "DELETE") {
            await usuarios.remover(admin.id ?? -1, idNumerico(chave));
            return semConteudo(res);
          }
        }

        throw new ErroHttp(405, "Método não permitido");
      }

      throw new ErroHttp(404, "Rota não encontrada");
    } catch (e) {
      if (e instanceof ErroValidacao) {
        return enviar(res, 400, {
          erro: "Dados inválidos",
          campos: e.campos,
        });
      }

      if (e instanceof ErroConflito) {
        return enviar(res, 409, {
          erro: e.message,
          campos: e.campos,
        });
      }

      if (e instanceof ErroNaoAutorizado) {
        return enviar(res, 401, { erro: e.message });
      }

      if (e instanceof ErroProibido) {
        return enviar(res, 403, { erro: e.message });
      }

      if (e instanceof ErroNaoEncontrado) {
        return enviar(res, 404, { erro: e.message });
      }

      if (e instanceof ErroHttp) {
        return enviar(res, e.status, { erro: e.message });
      }

      console.error(e);
      return enviar(res, 500, { erro: "Erro interno do servidor" });
    }
  });
}
