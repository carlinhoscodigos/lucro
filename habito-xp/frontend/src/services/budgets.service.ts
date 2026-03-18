import { request } from './http';

export type BudgetRow = {
  id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  month: number;
  year: number;
  limit_amount: string | number;
  used_amount: string | number;
  created_at: string;
};

export function listBudgets(params: { month?: number; year?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.month) qs.set('month', String(params.month));
  if (params.year) qs.set('year', String(params.year));
  const q = qs.toString();
  return request<{ budgets: BudgetRow[] }>(`/budgets${q ? `?${q}` : ''}`);
}

export function createBudget(input: { category_id: string; month: number; year: number; limit_amount: number }) {
  return request<{ budget: any }>('/budgets', { method: 'POST', body: JSON.stringify(input) });
}

export function updateBudget(id: string, input: Partial<{ category_id: string; month: number; year: number; limit_amount: number }>) {
  return request<{ budget: any }>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteBudget(id: string) {
  return request<void>(`/budgets/${id}`, { method: 'DELETE' });
}

