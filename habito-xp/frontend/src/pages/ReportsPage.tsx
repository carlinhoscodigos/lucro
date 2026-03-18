import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/State';
import { exportCsv, getReportSummary } from '../services/reports.service';
import { formatMoney } from '../utils/format';
import { Select } from '../components/ui/Select';

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

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState<string>(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState<string>(today);
  const [rankType, setRankType] = useState<'expense' | 'income'>('expense');

  const q = useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => getReportSummary(from, to),
  });

  const totals = q.data?.totals;
  const balance = totals ? Number(totals.income) - Number(totals.expense) : 0;

  const byCatExpense = useMemo(
    () => (q.data?.by_category_expense || []).map((c) => ({ ...c, total: Number(c.total) })),
    [q.data]
  );
  const byCatIncome = useMemo(
    () => (q.data?.by_category_income || []).map((c) => ({ ...c, total: Number(c.total) })),
    [q.data]
  );
  const byCat = rankType === 'expense' ? byCatExpense : byCatIncome;

  const series = useMemo(() => (q.data?.series || []).map((s) => ({ ...s, income: Number(s.income), expense: Number(s.expense) })), [q.data]);

  useEffect(() => {
    if (!q.data) return;
    if (rankType === 'expense' && byCatExpense.length === 0 && byCatIncome.length > 0) setRankType('income');
    if (rankType === 'income' && byCatIncome.length === 0 && byCatExpense.length > 0) setRankType('expense');
  }, [q.data, rankType, byCatExpense.length, byCatIncome.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-white">Relatórios</div>
          <div className="text-sm text-slate-300 font-medium">Insights reais, sem enrolação.</div>
        </div>
        <Button onClick={() => exportCsv(from, to)} disabled={q.isLoading || q.isError}>
          Exportar CSV
        </Button>
      </div>

      <Card className="p-5 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end min-w-0">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-600 ml-1">De</div>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-600 ml-1">Até</div>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 h-11 px-4 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Saldo do período</span>
            <span className={balance >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>{formatMoney(balance)}</span>
          </div>
        </div>
      </Card>

      {q.isLoading ? <LoadingState title="Gerando relatório…" /> : null}
      {q.isError ? <ErrorState message={(q.error as Error).message} /> : null}

      {q.data ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução mensal</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
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
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="income"
                      stroke="#10b981"
                      strokeWidth={4}
                      fill="#10b981"
                      fillOpacity={0.16}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#10b981', stroke: '#10b981' }}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="expense"
                      stroke="#ef4444"
                      strokeWidth={4}
                      fill="#ef4444"
                      fillOpacity={0.14}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#ef4444', stroke: '#ef4444' }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Ranking de categorias ({rankType === 'expense' ? 'despesas' : 'receitas'})</CardTitle>
                <div className="w-[180px]">
                  <Select
                    value={rankType}
                    onChange={(e) => setRankType(e.target.value as any)}
                    wrapperClassName="bg-slate-50 rounded-2xl"
                  >
                    <option value="expense">Despesas</option>
                    <option value="income">Receitas</option>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCat}>
                    <CartesianGrid stroke="#eef2ff" strokeDasharray="6 6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={yTickFormatter} />
                    <Tooltip
                      formatter={(value: any) => formatMoney(value)}
                      contentStyle={{
                        background: 'white',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 20px 40px rgba(2,6,23,0.08)',
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill={rankType === 'expense' ? '#ef4444' : '#10b981'}
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

