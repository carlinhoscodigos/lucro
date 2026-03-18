import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Card, CardBody, CardHeader, CardTitle, CardValue } from '../components/ui/Card';
import { ErrorState, LoadingState, EmptyState } from '../components/ui/State';
import { formatMoney, formatDateISO } from '../utils/format';
import type { DashboardResponse } from '../types/api';
import { request } from '../services/http';

async function fetchDashboard() {
  return request<DashboardResponse>('/dashboard');
}

export function DashboardPage() {
  const q = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (q.isLoading) return <LoadingState title="Carregando seu dashboard…" />;
  if (q.isError) return <ErrorState message={(q.error as Error)?.message} />;
  const data = q.data!;

  const cards = [
    { title: 'Seu saldo atual', value: formatMoney(data.summary.balance) },
    { title: 'Receitas do mês', value: formatMoney(data.summary.income_month) },
    { title: 'Despesas do mês', value: formatMoney(data.summary.expense_month) },
    { title: 'Saldo previsto', value: formatMoney(data.summary.projected_balance) },
  ];

  return (
    <div className="space-y-6">
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
            {data.charts.monthly.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.charts.monthly}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.12} />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.10} />
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
            {data.charts.expenses_by_category.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.charts.expenses_by_category} dataKey="total" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={2}>
                      {data.charts.expenses_by_category.map((e, idx) => (
                        <Cell key={idx} fill={e.color || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
                    <div className={`h-10 w-10 rounded-2xl grid place-items-center font-black ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
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

