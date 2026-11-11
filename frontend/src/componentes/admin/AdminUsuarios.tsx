import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import type { Papel, UsuarioAdmin } from "../../api/tipos";
import { useAuth } from "../../contexto/auth";
import { useErroAdmin } from "../../hooks/useErroAdmin";

const dataBr = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

/** Lista os usuários, muda o papel (usuário/admin) e exclui contas. Você não mexe na própria conta. */
export function AdminUsuarios() {
  const tratar = useErroAdmin();
  const { usuario: eu } = useAuth();
  const [lista, setLista] = useState<UsuarioAdmin[] | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      try {
        const { data } = await api.get<UsuarioAdmin[]>("/admin/usuarios");
        if (!cancelado) setLista(data);
      } catch (e) {
        if (!cancelado) setAviso({ tipo: "erro", texto: tratar(e).mensagem });
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, [tratar]);

  async function mudarPapel(u: UsuarioAdmin, papel: Papel) {
    const acao = papel === "admin" ? "dar acesso de administrador a" : "tirar o acesso de administrador de";
    if (!window.confirm(`Tem certeza que quer ${acao} ${u.nome}?`)) return;
    setAviso(null);
    try {
      const { data } = await api.patch<UsuarioAdmin>(`/admin/usuarios/${u.id}`, { papel });
      setLista((l) => (l ?? []).map((x) => (x.id === data.id ? data : x)));
      setAviso({ tipo: "ok", texto: `${data.nome} agora é ${data.papel === "admin" ? "administrador" : "usuário comum"}.` });
    } catch (e) {
      setAviso({ tipo: "erro", texto: tratar(e).mensagem });
    }
  }

  async function excluir(u: UsuarioAdmin) {
    if (!window.confirm(`Excluir a conta de ${u.nome} (${u.email})? Isso não pode ser desfeito.`)) return;
    setAviso(null);
    try {
      await api.delete(`/admin/usuarios/${u.id}`);
      setLista((l) => (l ?? []).filter((x) => x.id !== u.id));
      setAviso({ tipo: "ok", texto: `Conta de ${u.nome} excluída.` });
    } catch (e) {
      setAviso({ tipo: "erro", texto: tratar(e).mensagem });
    }
  }

  return (
    <div>
      <div className="admin-topo">
        <h2>Usuários {lista && <span className="texto-suave">({lista.length})</span>}</h2>
      </div>

      {aviso && (
        <div className={`alerta ${aviso.tipo === "ok" ? "alerta-sucesso" : "alerta-erro"}`} role={aviso.tipo === "ok" ? "status" : "alert"}>
          {aviso.texto}
        </div>
      )}

      {lista === null && !aviso ? <p className="vazio">Carregando...</p> : (
        <div className="tabela-rolagem">
          <table>
            <thead><tr><th>ID</th><th>Nome</th><th>E-mail</th><th>CPF</th><th>Papel</th><th>Desde</th><th>Ações</th></tr></thead>
            <tbody>
              {(lista ?? []).map((u) => {
                const souEu = u.id === eu?.id;
                return (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.nome}</strong>{souEu && <span className="texto-suave"> (você)</span>}</td>
                    <td>{u.email}</td>
                    <td>{u.cpf}</td>
                    <td><span className={`selo ${u.papel === "admin" ? "selo-admin" : "selo-off"}`}>{u.papel === "admin" ? "Admin" : "Usuário"}</span></td>
                    <td>{dataBr(u.criadoEm)}</td>
                    <td className="admin-acoes-tabela">
                      <button type="button" className="btn btn-outline btn-pequeno" disabled={souEu}
                        title={souEu ? "Você não pode alterar o seu próprio papel" : undefined}
                        onClick={() => mudarPapel(u, u.papel === "admin" ? "usuario" : "admin")}>
                        {u.papel === "admin" ? "Tornar usuário" : "Tornar admin"}
                      </button>
                      <button type="button" className="btn btn-outline btn-pequeno btn-perigo" disabled={souEu}
                        title={souEu ? "Você não pode excluir a sua própria conta" : undefined}
                        onClick={() => excluir(u)} aria-label={`Excluir ${u.nome}`}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
