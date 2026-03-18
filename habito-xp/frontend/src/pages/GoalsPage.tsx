import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/State';
import { createGoal, deleteGoal, listGoals, updateGoal, type Goal } from '../services/goals.service';
import { formatMoney } from '../utils/format';
import { Select } from '../components/ui/Select';
import { listAccounts } from '../services/accounts.service';

function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full bg-emerald-500" style={{ width: `${v}%` }} />
    </div>
  );
}

function accountTypeLabel(type?: string | null) {
  if (!type) return '—';
  if (type === 'checking') return 'Conta corrente';
  if (type === 'savings') return 'Poupança';
  if (type === 'wallet') return 'Carteira';
  if (type === 'credit_card') return 'Cartão de crédito';
  if (type === 'investment') return 'Investimento';
  return type;
}

export function GoalsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['goals'], queryFn: listGoals });
  const qAccounts = useQuery({ queryKey: ['accounts'], queryFn: listAccounts });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const save = useMutation({
    mutationFn: async (input: any) => {
      if (editing) return updateGoal(editing.id, input);
      return createGoal(input);
    },
    onSuccess: async () => {
      setOpen(false);
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const del = useMutation({
    mutationFn: deleteGoal,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  if (q.isLoading) return <LoadingState title="Carregando metas…" />;
  if (q.isError) return <ErrorState message={(q.error as Error).message} />;
  const goals = q.data!.goals;
  const accounts = qAccounts.data?.accounts ?? [];
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-white">Metas</div>
          <div className="text-sm text-slate-300 font-medium">Acompanhe progresso real e mantenha o foco.</div>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>Nova meta</Button>
      </div>

      <Card className="overflow-hidden">
        {goals.length ? (
          <div className="divide-y divide-slate-100">
            {goals.map((g) => {
              const current = Number(g.current_amount);
              const target = Number(g.target_amount);
              const p = target ? Math.round((current / target) * 100) : 0;
              const faltam = Math.max(0, target - current);
              return (
                <div key={g.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-900 truncate">{g.name}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">
                        Conta: {g.account_id ? accountById.get(g.account_id)?.name || '—' : accountTypeLabel(g.account_type)}
                      </div>
                      <div className="text-sm text-slate-500 font-semibold mt-1">
                        {formatMoney(current)} de {formatMoney(target)} • {p}% • faltam {formatMoney(faltam)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { setEditing(g); setOpen(true); }}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => del.mutate(g.id)} disabled={del.isPending}>Excluir</Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={p} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="Sem metas" description="Crie uma meta para ver o progresso ao longo do tempo." action={<Button onClick={() => setOpen(true)}>Criar meta</Button>} />
          </div>
        )}
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setEditing(null); }} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl">
            <div className="h-2 bg-emerald-500" />
            <div className="p-6">
              <div className="text-xl font-black text-slate-900">{editing ? 'Editar meta' : 'Nova meta'}</div>
              {save.isError ? <div className="mt-4"><ErrorState message={(save.error as Error).message} /></div> : null}
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  save.mutate({
                    name: String(fd.get('name')),
                    target_amount: Number(fd.get('target_amount')),
                    target_date: String(fd.get('target_date') || '') || null,
                    status: String(fd.get('status') || 'active'),
                    account_id: String(fd.get('account_id') || '').trim() || null,
                  });
                }}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 ml-1">Nome</div>
                  <input name="name" defaultValue={editing?.name || ''} required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Valor alvo</div>
                    <input name="target_amount" type="number" step="0.01" min={0} defaultValue={editing ? Number(editing.target_amount) : ''} required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Conta</div>
                    <Select
                      name="account_id"
                      key={`goal-account-id-${editing?.account_id || accounts[0]?.id || 'none'}`}
                      defaultValue={
                        editing?.account_id || accounts[0]?.id || ''
                      }
                    >
                      <option value="" disabled>
                        Selecione…
                      </option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 ml-1">Progresso atual</div>
                  <input
                    value={formatMoney(Number(editing?.current_amount ?? 0))}
                    readOnly
                    className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Prazo (opcional)</div>
                    <input name="target_date" type="date" defaultValue={editing?.target_date || ''} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Status</div>
                    <Select name="status" defaultValue={editing?.status || 'active'}>
                      <option value="active">Ativa</option>
                      <option value="completed">Concluída</option>
                      <option value="canceled">Cancelada</option>
                    </Select>
                  </div>
                </div>
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

