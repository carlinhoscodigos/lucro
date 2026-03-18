import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/State';
import { createAccount, deleteAccount, listAccounts, updateAccount } from '../services/accounts.service';
import { formatMoney } from '../utils/format';
import type { Account } from '../types/api';
import { Select } from '../components/ui/Select';

export function AccountsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['accounts'], queryFn: listAccounts, staleTime: 10 * 60_000, placeholderData: keepPreviousData });
  const [editing, setEditing] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);

  function accountTypeLabel(type: string) {
    if (type === 'checking') return 'Conta corrente';
    if (type === 'savings') return 'Poupança';
    if (type === 'wallet') return 'Carteira';
    if (type === 'credit_card') return 'Cartão de crédito';
    if (type === 'investment') return 'Investimento';
    return type;
  }

  const save = useMutation({
    mutationFn: async (input: any) => {
      if (editing) return updateAccount(editing.id, input);
      return createAccount(input);
    },
    onSuccess: async () => {
      setOpen(false);
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ['accounts'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'], exact: false });
    },
  });

  const del = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['accounts'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'], exact: false });
    },
  });

  if (q.isError) return <ErrorState message={(q.error as Error).message} />;
  const accounts = q.data?.accounts;

  if (!accounts && q.isLoading) return <LoadingState title="Carregando contas…" />;
  if (!accounts) return <EmptyState title="Nenhuma conta ainda" description="Crie uma conta para começar." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-white">Contas</div>
          <div className="text-sm text-slate-300 font-medium">Carteiras e bancos do seu dia a dia.</div>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>Nova conta</Button>
      </div>

      <Card className="overflow-hidden">
        {accounts.length ? (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 text-slate-600 text-xs font-bold">
                  <tr>
                    <th className="text-left px-5 py-3">Nome</th>
                    <th className="text-left px-5 py-3">Tipo</th>
                    <th className="text-left px-5 py-3">Saldo inicial</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 text-sm font-black text-slate-900">{a.name}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">{accountTypeLabel(a.type)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">{formatMoney(a.initial_balance)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">{a.is_active ? 'ativa' : 'inativa'}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => { setEditing(a); setOpen(true); }}>
                            Editar
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => del.mutate(a.id)} disabled={del.isPending}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile (cards centralizados) */}
            <div className="md:hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-center text-[11px] font-bold text-slate-600">
                  <div>Nome</div>
                  <div>Saldo inicial</div>
                  <div>Tipo</div>
                  <div>Status</div>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {accounts.map((a) => (
                  <div key={a.id} className="px-4 py-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-center">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-500">Nome</div>
                        <div className="text-sm font-black text-slate-900 break-words">{a.name}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-500">Saldo inicial</div>
                        <div className="text-sm font-semibold text-slate-700">{formatMoney(a.initial_balance)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-500">Tipo</div>
                        <div className="text-sm font-semibold text-slate-700">{accountTypeLabel(a.type)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-500">Status</div>
                        <div className="text-sm font-semibold text-slate-700">{a.is_active ? 'ativa' : 'inativa'}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { setEditing(a); setOpen(true); }}>
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => del.mutate(a.id)} disabled={del.isPending}>
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState title="Nenhuma conta ainda" description="Crie uma conta para começar a registrar lançamentos." action={<Button onClick={() => setOpen(true)}>Criar conta</Button>} />
          </div>
        )}
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setEditing(null); }} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl">
            <div className="h-2 bg-emerald-500" />
            <div className="p-6">
              <div className="text-xl font-black text-slate-900">{editing ? 'Editar conta' : 'Nova conta'}</div>
              {save.isError ? <div className="mt-4"><ErrorState message={(save.error as Error).message} /></div> : null}
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  save.mutate({
                    name: String(fd.get('name')),
                    type: String(fd.get('type')),
                    initial_balance: Number(fd.get('initial_balance') || 0),
                    is_active: fd.get('is_active') === 'on',
                  });
                }}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 ml-1">Nome</div>
                  <input name="name" defaultValue={editing?.name || ''} required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Tipo</div>
                    <Select name="type" defaultValue={editing?.type || 'checking'}>
                      <option value="checking">Conta corrente</option>
                      <option value="savings">Poupança</option>
                      <option value="wallet">Carteira</option>
                      <option value="credit_card">Cartão de crédito</option>
                      <option value="investment">Investimento</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Saldo inicial</div>
                    <input name="initial_balance" type="number" step="0.01" defaultValue={editing ? Number(editing.initial_balance) : 0} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : true} />
                  Conta ativa
                </label>
                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setOpen(false); setEditing(null); }}>Cancelar</Button>
                  <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

