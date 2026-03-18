import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/State';
import { listCategories } from '../services/categories.service';
import { createBudget, deleteBudget, listBudgets, updateBudget } from '../services/budgets.service';
import { formatMoney } from '../utils/format';

function pct(used: number, limit: number) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function BudgetsPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const q = useQuery({ queryKey: ['budgets', month, year], queryFn: () => listBudgets({ month, year }) });
  const qCats = useQuery({ queryKey: ['categories'], queryFn: () => listCategories('expense') });

  const save = useMutation({
    mutationFn: async (input: any) => {
      if (editingId) return updateBudget(editingId, input);
      return createBudget(input);
    },
    onSuccess: async () => {
      setOpen(false);
      setEditingId(null);
      await qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const del = useMutation({
    mutationFn: deleteBudget,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const budgets = q.data?.budgets ?? [];

  const totals = useMemo(() => {
    const used = budgets.reduce((s, b) => s + Number(b.used_amount), 0);
    const limit = budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
    return { used, limit };
  }, [budgets]);

  if (q.isLoading) return <LoadingState title="Carregando orçamentos…" />;
  if (q.isError) return <ErrorState message={(q.error as Error).message} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-white">Orçamentos</div>
          <div className="text-sm text-slate-300 font-medium">Limites mensais por categoria para você manter o controle.</div>
        </div>
        <Button onClick={() => { setEditingId(null); setOpen(true); }}>Novo orçamento</Button>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <div className="text-xs font-bold text-slate-600 ml-1">Mês</div>
            <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-600 ml-1">Ano</div>
            <input type="number" min={2020} value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-bold text-slate-600 ml-1">Visão geral</div>
            <div className="h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Usado: {formatMoney(totals.used)}</span>
              <span>Limite: {formatMoney(totals.limit)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {budgets.length ? (
          <div className="divide-y divide-slate-100">
            {budgets.map((b) => {
              const used = Number(b.used_amount);
              const limit = Number(b.limit_amount);
              const p = pct(used, limit);
              const warn = p >= 85;
              const over = used > limit;
              return (
                <div key={b.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-2xl" style={{ background: b.category_color || '#e2e8f0' }} />
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 truncate">{b.category_name}</div>
                        <div className="text-sm text-slate-500 font-semibold">
                          {formatMoney(used)} de {formatMoney(limit)} ({p}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { setEditingId(b.id); setOpen(true); }}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => del.mutate(b.id)} disabled={del.isPending}>Excluir</Button>
                    </div>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${over ? 'bg-rose-500' : warn ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${p}%` }} />
                  </div>
                  {over ? (
                    <div className="mt-2 text-sm font-semibold text-rose-600">Você passou do limite desta categoria.</div>
                  ) : warn ? (
                    <div className="mt-2 text-sm font-semibold text-amber-600">Seu orçamento está quase no limite.</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="Sem orçamentos" description="Defina limites por categoria para receber alertas inteligentes." action={<Button onClick={() => setOpen(true)}>Criar orçamento</Button>} />
          </div>
        )}
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setEditingId(null); }} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl">
            <div className="h-2 bg-emerald-500" />
            <div className="p-6">
              <div className="text-xl font-black text-slate-900">{editingId ? 'Editar orçamento' : 'Novo orçamento'}</div>
              {save.isError ? <div className="mt-4"><ErrorState message={(save.error as Error).message} /></div> : null}
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  save.mutate({
                    category_id: String(fd.get('category_id')),
                    month: Number(fd.get('month')),
                    year: Number(fd.get('year')),
                    limit_amount: Number(fd.get('limit_amount')),
                  });
                }}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 ml-1">Categoria (despesa)</div>
                  <select name="category_id" className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" required>
                    <option value="" disabled selected>
                      Selecione…
                    </option>
                    {(qCats.data?.categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Mês</div>
                    <input name="month" type="number" min={1} max={12} defaultValue={month} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" required />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Ano</div>
                    <input name="year" type="number" min={2020} defaultValue={year} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 ml-1">Limite</div>
                  <input name="limit_amount" type="number" step="0.01" min={0} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" required />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setOpen(false); setEditingId(null); }}>Cancelar</Button>
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

