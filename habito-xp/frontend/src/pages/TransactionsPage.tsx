import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/State';
import { Select } from '../components/ui/Select';
import { listAccounts } from '../services/accounts.service';
import { listCategories } from '../services/categories.service';
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from '../services/transactions.service';
import { formatDateISO, formatMoney } from '../utils/format';
import type { Transaction } from '../types/api';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-bold text-slate-600 ml-1">{label}</div>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
    />
  );
}

export function TransactionsPage() {
  const [sp, setSp] = useSearchParams();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Transaction | null>(null);

  const params = useMemo(() => {
    return {
      from: sp.get('from') || undefined,
      to: sp.get('to') || undefined,
      type: (sp.get('type') as any) || undefined,
      category_id: sp.get('category_id') || undefined,
      account_id: sp.get('account_id') || undefined,
      status: (sp.get('status') as any) || undefined,
      page: Number(sp.get('page') || '1'),
      pageSize: 20,
    };
  }, [sp]);

  const txKey = useMemo(() => ['transactions', JSON.stringify(params)], [params]);

  const qTx = useQuery({
    queryKey: txKey,
    queryFn: () => listTransactions(params),
    placeholderData: keepPreviousData,
  });

  const qAccounts = useQuery({ queryKey: ['accounts'], queryFn: listAccounts, staleTime: 10 * 60_000 });
  const qCategories = useQuery({ queryKey: ['categories'], queryFn: () => listCategories(), staleTime: 10 * 60_000 });

  const save = useMutation({
    mutationFn: async (input: any) => {
      if (editing?.id) return updateTransaction(editing.id, input);
      return createTransaction(input);
    },
    onSuccess: async () => {
      setEditing(null);
      sp.delete('new');
      setSp(sp, { replace: true });
      await qc.invalidateQueries({ queryKey: ['transactions'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'], exact: false });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => deleteTransaction(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['transactions'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'], exact: false });
    },
  });

  const showForm = sp.get('new') === '1' || !!editing;

  if (qTx.isError) return <ErrorState message={(qTx.error as Error).message} />;

  const data = qTx.data;
  if (!data) return <LoadingState title="Carregando lançamentos…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-white">Lançamentos</div>
          <div className="text-sm text-slate-300 font-medium">Registre entradas e saídas rapidamente.</div>
        </div>
        <Button onClick={() => setSp({ ...Object.fromEntries(sp.entries()), new: '1' })}>Novo lançamento</Button>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Field label="Período (de)">
            <Input
              type="date"
              value={params.from || ''}
              onChange={(e) => setSp({ ...Object.fromEntries(sp.entries()), from: e.target.value })}
            />
          </Field>
          <Field label="Período (até)">
            <Input
              type="date"
              value={params.to || ''}
              onChange={(e) => setSp({ ...Object.fromEntries(sp.entries()), to: e.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <Select value={params.type || ''} onChange={(e) => setSp({ ...Object.fromEntries(sp.entries()), type: e.target.value })}>
              <option value="">Todos</option>
              <option value="income">Entrada</option>
              <option value="expense">Saída</option>
            </Select>
          </Field>
          <Field label="Conta">
            <Select value={params.account_id || ''} onChange={(e) => setSp({ ...Object.fromEntries(sp.entries()), account_id: e.target.value })}>
              <option value="">Todas</option>
              {(qAccounts.data?.accounts || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoria">
            <Select value={params.category_id || ''} onChange={(e) => setSp({ ...Object.fromEntries(sp.entries()), category_id: e.target.value })}>
              <option value="">Todas</option>
              {(qCategories.data?.categories || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {data.transactions.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold">
                <tr>
                  <th className="text-left px-5 py-3">Data</th>
                  <th className="text-left px-5 py-3">Descrição</th>
                  <th className="text-left px-5 py-3">Conta</th>
                  <th className="text-left px-5 py-3">Categoria</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Valor</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{formatDateISO(t.transaction_date)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{t.description || 'Sem descrição'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{t.account_name || t.account_id}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{t.category_name || '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{t.status}</td>
                    <td className={`px-5 py-4 text-right text-sm font-black ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatMoney(t.amount)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setEditing(t)}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => del.mutate(t.id)}
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
        ) : (
          <div className="p-6">
            <EmptyState
              title="Sem lançamentos"
              description="Crie seu primeiro lançamento para começar a ver o dashboard ganhar vida."
              action={<Button onClick={() => setSp({ ...Object.fromEntries(sp.entries()), new: '1' })}>Adicionar lançamento</Button>}
            />
          </div>
        )}
      </Card>

      {showForm ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setEditing(null); sp.delete('new'); setSp(sp, { replace: true }); }} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl">
            <div className="h-2 bg-emerald-500" />
            <div className="p-6">
              <div className="text-xl font-black text-slate-900">{editing ? 'Editar lançamento' : 'Novo lançamento'}</div>
              <div className="text-sm text-slate-500 font-medium mt-1">Poucos cliques, foco em produtividade.</div>

              {save.isError ? (
                <div className="mt-4">
                  <ErrorState message={(save.error as Error).message} />
                </div>
              ) : null}

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const input = {
                    type: String(fd.get('type')),
                    amount: Number(fd.get('amount')),
                    description: String(fd.get('description') || '') || null,
                    category_id: String(fd.get('category_id') || '') || null,
                    account_id: String(fd.get('account_id')),
                    transaction_date: String(fd.get('transaction_date')),
                    status: String(fd.get('status')),
                    is_recurring: fd.get('is_recurring') === 'on',
                  };
                  save.mutate(input);
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo">
                    <Select name="type" defaultValue={editing?.type || 'expense'} required>
                      <option value="income">Entrada</option>
                      <option value="expense">Saída</option>
                    </Select>
                  </Field>
                  <Field label="Valor">
                    <Input name="amount" type="number" step="0.01" min="0" defaultValue={editing ? Number(editing.amount) : ''} autoFocus required />
                  </Field>
                </div>

                <Field label="Descrição">
                  <Input name="description" defaultValue={editing?.description || ''} placeholder="Ex: Almoço, venda, assinatura…" />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Conta">
                    <Select name="account_id" defaultValue={editing?.account_id || ''} required>
                      <option value="" disabled>
                        Selecione…
                      </option>
                      {(qAccounts.data?.accounts || []).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Categoria">
                    <Select name="category_id" defaultValue={editing?.category_id || ''}>
                      <option value="">Sem categoria</option>
                      {(qCategories.data?.categories || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data">
                    <Input name="transaction_date" type="date" defaultValue={editing?.transaction_date || new Date().toISOString().slice(0, 10)} required />
                  </Field>
                  <Field label="Status">
                    <Select name="status" defaultValue={editing?.status || 'completed'} required>
                      <option value="completed">Concluído</option>
                      <option value="pending">Pendente</option>
                      <option value="canceled">Cancelado</option>
                    </Select>
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="is_recurring" defaultChecked={editing?.is_recurring || false} />
                  Recorrente
                </label>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditing(null);
                      sp.delete('new');
                      setSp(sp, { replace: true });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={save.isPending}>
                    {save.isPending ? 'Salvando…' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

