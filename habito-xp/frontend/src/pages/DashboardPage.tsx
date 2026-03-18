import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { Card, CardBody, CardHeader, CardTitle, CardValue } from '../components/ui/Card';
import { ErrorState, LoadingState, EmptyState } from '../components/ui/State';
import { formatMoney, formatDateISO } from '../utils/format';
import type { DashboardResponse } from '../types/api';
import { request } from '../services/http';
import { listAccounts } from '../services/accounts.service';

function typeLabel(key: string) {
  if (key === 'income') return 'Receitas';
  if (key === 'expense') return 'Despesas';
  return key;
}

function yTickFormatter(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(n);
}

export function DashboardPage() {
  // null = total (todas as contas)
  const [accountId, setAccountId] = useState<string | null>(null);

  const qAccounts = useQuery({ queryKey: ['accounts'], queryFn: listAccounts, staleTime: 10 * 60_000 });

  const dashboardKey = accountId ? ['dashboard', accountId] : ['dashboard'];

  const q = useQuery({
    queryKey: dashboardKey,
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    queryFn: () => {
      const qs = accountId ? `?account_id=${encodeURIComponent(accountId)}` : '';
      return request<DashboardResponse>(`/dashboard${qs}`);
    },
  });

  if (q.isError) return <ErrorState message={(q.error as Error)?.message} />;
  const data = q.data;
  if (!data) return <LoadingState title="Carregando seu dashboard…" />;

  const monthly = useMemo(
    () =>
      data.charts.monthly.map((m) => ({
        ...m,
        income: Number(m.income),
        expense: Number(m.expense),
      })),
    [data]
  );

  const expensesByCat = useMemo(
    () =>
      data.charts.expenses_by_category.map((e) => ({
        ...e,
        total: Number(e.total),
      })),
    [data]
  );

  const cards = [
    { title: 'Seu saldo atual', value: formatMoney(data.summary.balance) },
    { title: 'Receitas do mês', value: formatMoney(data.summary.income_month) },
    { title: 'Despesas do mês', value: formatMoney(data.summary.expense_month) },
    { title: 'Saldo previsto', value: formatMoney(data.summary.projected_balance) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex-1">
          <div className="text-2xl font-black text-white">Visão geral</div>
          <div className="text-sm text-slate-300 font-medium mt-1">
            {accountId ? 'Visão por conta selecionada' : 'Visão total de todas as contas'}
          </div>
        </div>

        <div className="w-full md:w-[320px]">
          <div className="text-xs font-bold text-slate-400 ml-1">Conta</div>
          <select
            value={accountId ?? 'all'}
            onChange={(e) => setAccountId(e.target.value === 'all' ? null : e.target.value)}
            className="w-full h-11 rounded-2xl border border-slate-100 bg-white/90 px-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
          >
            <option value="all">Total</option>
            {(qAccounts.data?.accounts || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader>
              <CardTitle>{c.title}</CardTitle>
              <CardValue>{c.value}</CardValue>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Entradas vs saídas (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardBody>
            {monthly.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#eef2ff" strokeDasharray="6 6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={yTickFormatter}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [formatMoney(value), typeLabel(String(name))]}
                      labelFormatter={(label: any) => `Mês ${String(label)}`}
                      contentStyle={{
                        background: 'white',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 20px 40px rgba(2,6,23,0.08)',
                      }}
                    />
                    <Legend
                      formatter={(value: any) => typeLabel(String(value))}
                      iconType="circle"
                      wrapperStyle={{ paddingTop: 6, fontWeight: 600, color: '#64748b' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="income"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="#10b981"
                      fillOpacity={0.12}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#10b981' }}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="expense"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fill="#ef4444"
                      fillOpacity={0.10}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#ef4444' }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="Sem dados ainda" description="Quando você registrar lançamentos, os gráficos aparecem aqui." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria (mês)</CardTitle>
          </CardHeader>
          <CardBody>
            {expensesByCat.length ? (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 items-center">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCat}
                        dataKey="total"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={110}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {expensesByCat.map((e, idx) => (
                          <Cell key={idx} fill={e.color || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [formatMoney(value), '']}
                        contentStyle={{
                          background: 'white',
                          borderRadius: 14,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 20px 40px rgba(2,6,23,0.08)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {expensesByCat.map((e, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ background: e.color || '#94a3b8' }}
                        />
                        <span className="text-sm font-semibold text-slate-700 truncate">{e.name}</span>
                      </div>
                      <div className="text-sm font-black text-slate-900">{formatMoney(e.total)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Sem despesas no mês" description="Registre uma saída para ver a distribuição por categoria." />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Últimos lançamentos</CardTitle>
          </CardHeader>
          <CardBody>
            {data.last_transactions.length ? (
              <div className="divide-y divide-slate-100">
                {data.last_transactions.map((t) => (
                  <div key={t.id} className="py-3 flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-2xl grid place-items-center font-black ${
                        t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '–'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{t.description || 'Sem descrição'}</div>
                      <div className="text-sm text-slate-500 font-medium">{formatDateISO(t.transaction_date)}</div>
                    </div>
                    <div className={`font-black ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{formatMoney(t.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhum lançamento ainda" description="Adicione seu primeiro lançamento para começar." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardBody>
            {data.alerts.length ? (
              <div className="space-y-2">
                {data.alerts.map((a, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-100 p-3">
                    <div className="font-bold text-slate-900">{a.title}</div>
                    <div className="text-sm text-slate-500 font-medium mt-1">{a.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Tudo sob controle" description="Quando houver alertas inteligentes, eles vão aparecer aqui." />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

