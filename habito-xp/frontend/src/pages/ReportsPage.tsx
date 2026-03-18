import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/State';
import { exportCsv, getReportSummary } from '../services/reports.service';
import { formatMoney } from '../utils/format';

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState<string>(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState<string>(today);

  const q = useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => getReportSummary(from, to),
  });

  const totals = q.data?.totals;
  const balance = totals ? Number(totals.income) - Number(totals.expense) : 0;

  const byCat = useMemo(() => (q.data?.by_category || []).map((c) => ({ ...c, total: Number(c.total) })), [q.data]);
  const series = useMemo(() => (q.data?.series || []).map((s) => ({ ...s, income: Number(s.income), expense: Number(s.expense) })), [q.data]);

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

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <div className="text-xs font-bold text-slate-600 ml-1">De</div>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
          </div>
          <div>
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
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.12} />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.10} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de categorias (despesas)</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCat}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#0ea5e9" radius={[10, 10, 0, 0]} />
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

