import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/State';
import { listAccounts } from '../services/accounts.service';
import { listCategories } from '../services/categories.service';
import { createRecurring, deleteRecurring, listRecurring, updateRecurring, type RecurringTransaction } from '../services/recurring.service';
import { formatDateISO, formatMoney } from '../utils/format';
import { Select } from '../components/ui/Select';

export function RecurringPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['recurring'], queryFn: listRecurring });
  const qAccounts = useQuery({ queryKey: ['accounts'], queryFn: listAccounts });
  const qCats = useQuery({ queryKey: ['categories'], queryFn: () => listCategories() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);

  function frequencyLabel(freq: RecurringTransaction['frequency']) {
    if (freq === 'daily') return 'Diária';
    if (freq === 'weekly') return 'Semanal';
    if (freq === 'monthly') return 'Mensal';
    if (freq === 'yearly') return 'Anual';
    return freq;
  }

  const save = useMutation({
    mutationFn: async (input: any) => (editing ? updateRecurring(editing.id, input) : createRecurring(input)),
    onSuccess: async () => {
      setOpen(false);
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ['recurring'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'], exact: false });
      await qc.invalidateQueries({ queryKey: ['transactions'], exact: false });
    },
  });

  const del = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['recurring'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'], exact: false });
      await qc.invalidateQueries({ queryKey: ['transactions'], exact: false });
    },
  });

  if (q.isLoading) return <LoadingState title="Carregando recorrências…" />;
  if (q.isError) return <ErrorState message={(q.error as Error).message} />;
  const items = q.data!.recurring_transactions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-white">Recorrências</div>
          <div className="text-sm text-slate-300 font-medium">Assinaturas, salário, aluguel… tudo automático.</div>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>Nova recorrência</Button>
      </div>

      <Card className="overflow-hidden">
        {items.length ? (
          <div className="divide-y divide-slate-100">
            {items.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-2xl grid place-items-center font-black ${r.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {r.type === 'income' ? '+' : '–'}
                </div>
                  <div className="min-w-0 flex-1">
                  <div className="font-black text-slate-900 break-words leading-snug">{r.description || 'Recorrência'}</div>
                  <div className="text-sm text-slate-500 font-semibold">
                    {frequencyLabel(r.frequency)} • próxima: {formatDateISO(r.next_run_date)}
                  </div>
                </div>
                <div className="font-black text-slate-900">{formatMoney(r.amount)}</div>
                <Button variant="secondary" size="sm" onClick={() => { setEditing(r); setOpen(true); }}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => del.mutate(r.id)} disabled={del.isPending}>Excluir</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="Sem recorrências" description="Crie recorrências para automatizar entradas e saídas mensais." action={<Button onClick={() => setOpen(true)}>Criar recorrência</Button>} />
          </div>
        )}
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setEditing(null); }} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[95vw] bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="h-2 bg-emerald-500" />
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="text-xl font-black text-slate-900">{editing ? 'Editar recorrência' : 'Nova recorrência'}</div>
              {save.isError ? <div className="mt-4"><ErrorState message={(save.error as Error).message} /></div> : null}
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  save.mutate({
                    type: String(fd.get('type')),
                    amount: Number(fd.get('amount')),
                    description: String(fd.get('description') || '') || null,
                    account_id: String(fd.get('account_id')),
                    category_id: String(fd.get('category_id') || '') || null,
                    frequency: String(fd.get('frequency')),
                    day_of_month: String(fd.get('day_of_month') || '') ? Number(fd.get('day_of_month')) : null,
                    next_run_date: String(fd.get('next_run_date')),
                    is_active: fd.get('is_active') === 'on',
                  });
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Tipo</div>
                    <Select name="type" defaultValue={editing?.type || 'expense'}>
                      <option value="income">Entrada</option>
                      <option value="expense">Saída</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Valor</div>
                    <input name="amount" type="number" step="0.01" min={0} defaultValue={editing ? Number(editing.amount) : ''} required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 ml-1">Descrição</div>
                  <input name="description" defaultValue={editing?.description || ''} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Conta</div>
                    <Select name="account_id" defaultValue={editing?.account_id || ''} required>
                      <option value="" disabled selected>Selecione…</option>
                      {(qAccounts.data?.accounts || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Categoria</div>
                    <Select name="category_id" defaultValue={editing?.category_id || ''}>
                      <option value="">Sem categoria</option>
                      {(qCats.data?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Frequência</div>
                    <Select name="frequency" defaultValue={editing?.frequency || 'monthly'}>
                      <option value="daily">Diária</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="yearly">Anual</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Dia do mês (opcional)</div>
                    <input name="day_of_month" type="number" min={1} max={31} defaultValue={editing?.day_of_month ?? ''} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Próxima execução</div>
                    <input name="next_run_date" type="date" defaultValue={editing?.next_run_date || new Date().toISOString().slice(0, 10)} required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 pt-6">
                    <input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : true} />
                    Ativa
                  </label>
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

