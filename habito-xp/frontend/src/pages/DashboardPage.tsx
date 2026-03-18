import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { Card, CardBody, CardHeader, CardTitle, CardValue } from '../components/ui/Card';
import { ErrorState, LoadingState, EmptyState } from '../components/ui/State';
import { Select } from '../components/ui/Select';
import { formatMoney, formatDateISO } from '../utils/format';
import type { DashboardResponse } from '../types/api';
import { request } from '../services/http';
import { listAccounts } from '../services/accounts.service';

function typeLabel(key: string) {
  if (key === 'income') return 'Entradas';
  if (key === 'expense') return 'Saídas';
  return key;
}

function yTickFormatter(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(n);
}

function formatMonthKey(monthKey: string) {
  // esperado: YYYY-MM
  const [yStr, mStr] = String(monthKey).split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return String(monthKey);

  const d = new Date(Date.UTC(y, m - 1, 1));
  const abbr = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d).replace('.', '');
  return `${abbr} ${y}`;
}

export function DashboardPage() {
  // null = total (todas as contas)
  const [accountId, setAccountId] = useState<string | null>(null);
  const qc = useQueryClient();

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

  // Prefetch de dashboard por conta para a troca no dropdown ficar instantânea.
  // Mantém apenas alguns fetches em background e evita “esperar carregando”.
  useEffect(() => {
    const accounts = qAccounts.data?.accounts || [];
    if (!accounts.length) return;
    for (const a of accounts.slice(0, 8)) {
      qc.prefetchQuery({
        queryKey: ['dashboard', a.id],
        queryFn: () => request<DashboardResponse>(`/dashboard?account_id=${encodeURIComponent(a.id)}`),
        staleTime: 10 * 60_000,
      });
    }
    // Prefetch do total (sem filtro)
    qc.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: () => request<DashboardResponse>('/dashboard'),
      staleTime: 10 * 60_000,
    });
  }, [qAccounts.data, qc]);

  if (q.isError) return <ErrorState message={(q.error as Error)?.message} />;
  const data = q.data;
  const isInitialLoad = q.isLoading && !data;

  const monthly = useMemo(
    () =>
      data
        ? data.charts.monthly.map((m) => ({
            ...m,
            income: Number(m.income),
            expense: Number(m.expense),
          }))
        : [],
    [data]
  );

  const monthlyForChart = useMemo(() => {
    const nonZero = monthly.filter((m) => Number(m.income) !== 0 || Number(m.expense) !== 0);
    if (nonZero.length <= 2 && nonZero.length > 0) {
      const idxs = monthly
        .map((m, idx) => (Number(m.income) !== 0 || Number(m.expense) !== 0 ? idx : -1))
        .filter((i) => i !== -1);
      const start = Math.max(0, Math.min(...idxs) - 1);
      const end = Math.min(monthly.length - 1, Math.max(...idxs) + 1);
      return monthly.slice(start, end + 1).map((m) => {
        const income = Number(m.income);
        const expense = Number(m.expense);
        return { ...m, income, expense };
      });
    }

    // Meses vazios ficam menos “fortes” no gráfico.
    return monthly.map((m) => {
      const income = Number(m.income);
      const expense = Number(m.expense);
      return { ...m, income, expense };
    });
  }, [monthly]);

  const expensesByCat = useMemo(
    () =>
      data
        ? data.charts.expenses_by_category.map((e) => ({
            ...e,
            total: Number(e.total),
          }))
        : [],
    [data]
  );

  const expensesSum = useMemo(() => expensesByCat.reduce((acc, e) => acc + Number(e.total), 0), [expensesByCat]);

  const expensesDonutRows = useMemo(() => {
    const sorted = [...expensesByCat].sort((a, b) => Number(b.total) - Number(a.total));
    const top = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const restSum = rest.reduce((acc, e) => acc + Number(e.total), 0);

    const merged = restSum > 0 ? [...top, { name: 'Outras', color: '#94a3b8', total: restSum }] : top;

    return merged.map((e) => ({
      ...e,
      percent: expensesSum > 0 ? Math.round((Number(e.total) / expensesSum) * 100) : 0,
    }));
  }, [expensesByCat, expensesSum]);

  const lastTransactions = data?.last_transactions ?? [];
  const alerts = data?.alerts ?? [];
  const expenseMonthNum = Number(data?.summary?.expense_month ?? 0);
  const topExpenseName = expensesByCat[0]?.name;

  const balanceNum = Number(data?.summary?.balance ?? 0);
  const projectedNum = Number(data?.summary?.projected_balance ?? 0);
  const showProjected = Number.isFinite(projectedNum) && Math.abs(projectedNum - balanceNum) > 0.01;

  const cards = [
    { title: 'Seu saldo atual', value: data ? formatMoney(data.summary.balance) : '—' },
    { title: 'Receitas do mês', value: data ? formatMoney(data.summary.income_month) : '—' },
    { title: 'Despesas do mês', value: data ? formatMoney(data.summary.expense_month) : '—' },
    ...(showProjected
      ? [
          {
            title: 'Previsão até o fim do mês',
            value: data ? formatMoney(data.summary.projected_balance) : '—',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <div className="text-2xl font-black text-white">Visão geral</div>
          <div className="text-sm text-slate-300 font-medium mt-1">
            {accountId ? 'Visão por conta selecionada' : 'Visão total de todas as contas'}
          </div>
        </div>
      </div>

      <div
        className={`
          grid grid-cols-1 gap-4 sm:grid-cols-2
          ${cards.length === 4 ? 'xl:grid-cols-4' : cards.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}
        `}
      >
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <CardTitle>Entradas vs saídas (últimos 12 meses)</CardTitle>

              <div className="w-full sm:w-[240px]">
                <div className="text-xs font-bold text-slate-400 ml-1">Conta</div>
                <div className="mt-2">
                  <Select
                    value={accountId ?? 'all'}
                    onChange={(e) => setAccountId(e.target.value === 'all' ? null : e.target.value)}
                    wrapperClassName="bg-slate-50 rounded-2xl"
                  >
                    <option value="all">Total</option>
                    {(qAccounts.data?.accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {isInitialLoad ? (
              <LoadingState title="Carregando gráficos…" />
            ) : monthly.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyForChart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#eef2ff" strokeDasharray="6 6" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatMonthKey(String(v))}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={yTickFormatter}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (value == null) return ['—', typeLabel(String(name))];
                        return [formatMoney(value), typeLabel(String(name))];
                      }}
                      labelFormatter={(label: any) => `Mês ${formatMonthKey(String(label))}`}
                      contentStyle={{
                        background: 'white',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 20px 40px rgba(2,6,23,0.08)',
                      }}
                    />
                    <Legend
                      formatter={(value: any) => typeLabel(String(value))}
                      wrapperStyle={{ paddingTop: 6, color: '#64748b', fontWeight: 600 }}
                    />
                    <Area
                      type="linear"
                      dataKey="income"
                      name="income"
                      stroke="#10b981"
                      strokeWidth={4}
                      fill="#10b981"
                      fillOpacity={0.16}
                      dot={{ r: 3, strokeWidth: 2, fill: '#10b981', stroke: '#10b981' }}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#10b981', stroke: '#10b981' }}
                      isAnimationActive={false}
                    />
                    <Area
                      type="linear"
                      dataKey="expense"
                      name="expense"
                      stroke="#ef4444"
                      strokeWidth={4}
                      fill="#ef4444"
                      fillOpacity={0.14}
                      dot={{ r: 3, strokeWidth: 2, fill: '#ef4444', stroke: '#ef4444' }}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#ef4444', stroke: '#ef4444' }}
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

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Despesas por categoria (mês)</CardTitle>
          </CardHeader>
          <CardBody>
            {isInitialLoad ? (
              <LoadingState title="Carregando categorias…" />
            ) : expensesByCat.length ? (
              <div className="flex flex-col gap-4 items-center">
                <div className="relative w-full sm:w-[240px] h-[220px] md:h-[260px] flex items-center justify-center flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesDonutRows}
                        dataKey="total"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={115}
                        paddingAngle={1}
                        stroke="white"
                        strokeWidth={1}
                        cornerRadius={8}
                      >
                        {expensesDonutRows.map((e, idx) => (
                          <Cell key={idx} fill={e.color || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => {
                          const percent = props?.payload?.percent;
                          if (value == null) return ['—', ''];
                          return [formatMoney(value), `${percent ?? 0}%`];
                        }}
                        labelFormatter={() => ''}
                        contentStyle={{
                          background: 'white',
                          borderRadius: 14,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 20px 40px rgba(2,6,23,0.08)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-xs font-semibold text-slate-500">Total</div>
                    <div className="text-lg font-black text-slate-900">{formatMoney(expensesSum)}</div>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  {expensesDonutRows.map((e, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ background: e.color || '#94a3b8' }}
                        />
                        <span className="text-sm font-semibold text-slate-700 truncate">
                          {e.name} — {e.percent}%
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900 whitespace-nowrap">{formatMoney(e.total)}</div>
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
            {isInitialLoad ? (
              <LoadingState title="Carregando lançamentos…" />
            ) : lastTransactions.length ? (
              <div className="divide-y divide-slate-100">
                {lastTransactions.map((t) => (
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
                      <div className="text-xs text-slate-500 font-medium mt-1">{formatDateISO(t.transaction_date)}</div>
                      <div className="text-xs text-slate-400 font-semibold truncate mt-1">
                        {t.category_name || 'Sem categoria'} • {t.account_name || '—'}
                      </div>
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
            {isInitialLoad ? (
              <LoadingState title="Carregando alertas…" />
            ) : alerts.length ? (
              <div className="space-y-2">
                {alerts.map((a, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-100 p-3">
                    <div className="font-bold text-slate-900">{a.title}</div>
                    <div className="text-sm text-slate-500 font-medium mt-1">{a.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Tudo sob controle"
                description={
                  expenseMonthNum <= 0
                    ? 'Nenhuma despesa registrada neste mês.'
                    : topExpenseName
                      ? `Sua maior despesa atual é ${topExpenseName}.`
                      : 'Registre uma despesa para ver insights por categoria.'
                }
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

