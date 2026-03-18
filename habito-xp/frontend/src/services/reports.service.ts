import { request, getToken } from './http';

export type ReportSummary = {
  from: string;
  to: string;
  totals: { income: string | number; expense: string | number };
  by_category: Array<{ name: string; color: string; total: string | number }>;
  series: Array<{ month: string; income: string | number; expense: string | number }>;
};

export function getReportSummary(from: string, to: string) {
  return request<ReportSummary>(`/reports/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export async function exportCsv(from: string, to: string) {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!apiUrl) throw new Error('VITE_API_URL não definido');
  const token = getToken();
  if (!token) throw new Error('Token ausente');

  const res = await fetch(`${apiUrl}/reports/export/csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Não foi possível exportar');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_${from}_a_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

