import { useAuth } from '../hooks/useAuth';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { logout } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changeUserPassword, createUser, deleteUser, listUsers } from '../services/users.service';
import { ErrorState, LoadingState } from '../components/ui/State';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const qUsers = useQuery({ queryKey: ['users'], queryFn: listUsers });

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const del = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const changePass = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => changeUserPassword(id, password),
  });
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-black text-white">Configurações</div>
        <div className="text-sm text-slate-300 font-medium">Perfil, preferências e plano.</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-sm font-semibold text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nome</span>
                <span className="text-slate-900 font-black">{user?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">E-mail</span>
                <span className="text-slate-900 font-black">{user?.email || '—'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-900 font-black text-lg capitalize">{user?.plan || 'free'}</div>
                <div className="text-slate-500 text-sm font-medium mt-1">Pronto para upgrade quando quiser.</div>
              </div>
              <Button variant="secondary">Gerenciar</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
        </CardHeader>
        <CardBody>
          <Button
            variant="danger"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sair
          </Button>
        </CardBody>
      </Card>

      {user?.role === 'admin' ? (
        <Card>
          <CardHeader>
            <CardTitle>Painel de cadastro de usuário</CardTitle>
          </CardHeader>
          <CardBody>
          {create.isError ? <ErrorState message={(create.error as Error).message} /> : null}
          <form
            className="grid grid-cols-1 md:grid-cols-5 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              create.mutate({
                name: String(fd.get('name') || ''),
                email: String(fd.get('email') || ''),
                password: String(fd.get('password') || ''),
                expires_on: String(fd.get('expires_on') || todayISO),
                role: String(fd.get('role') || 'user') as 'admin' | 'user',
              });
              e.currentTarget.reset();
            }}
          >
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600 ml-1">Nome</div>
              <input name="name" required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600 ml-1">E-mail</div>
              <input name="email" type="email" required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600 ml-1">Senha</div>
              <input name="password" type="password" minLength={6} required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600 ml-1">Role</div>
              <select name="role" defaultValue="user" className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600 ml-1">Data de término</div>
              <input
                name="expires_on"
                type="date"
                min={todayISO}
                defaultValue={todayISO}
                required
                className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold"
              />
            </div>
            <div className="pt-6">
              <Button type="submit" disabled={create.isPending} className="w-full">
                {create.isPending ? 'Criando…' : 'Criar usuário'}
              </Button>
            </div>
          </form>

          <div className="mt-6 rounded-2xl border border-slate-100 overflow-hidden">
            {qUsers.isLoading ? (
              <div className="p-4"><LoadingState title="Carregando usuários…" /></div>
            ) : qUsers.isError ? (
              <div className="p-4"><ErrorState message={(qUsers.error as Error).message} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-bold">
                    <tr>
                      <th className="text-left px-4 py-3">Nome</th>
                      <th className="text-left px-4 py-3">E-mail</th>
                      <th className="text-left px-4 py-3">Plano</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Término</th>
                      <th className="text-right px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(qUsers.data?.users || []).map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{u.name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{u.email}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700 capitalize">{u.plan || 'free'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{u.role}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{u.is_active ? 'ativo' : 'inativo'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{u.expires_on || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={async () => {
                                const newPass = window.prompt(`Nova senha para ${u.email}:`);
                                if (!newPass) return;
                                if (newPass.length < 6) {
                                  window.alert('A senha deve ter pelo menos 6 caracteres.');
                                  return;
                                }
                                try {
                                  await changePass.mutateAsync({ id: u.id, password: newPass });
                                  window.alert('Senha atualizada com sucesso.');
                                } catch (err: any) {
                                  window.alert(err?.message || 'Não foi possível atualizar a senha.');
                                }
                              }}
                            >
                              Trocar senha
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={async () => {
                                const ok = window.confirm(`Excluir usuário ${u.email}? Essa ação não pode ser desfeita.`);
                                if (!ok) return;
                                try {
                                  await del.mutateAsync(u.id);
                                } catch (err: any) {
                                  window.alert(err?.message || 'Não foi possível excluir o usuário.');
                                }
                              }}
                              disabled={del.isPending}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

