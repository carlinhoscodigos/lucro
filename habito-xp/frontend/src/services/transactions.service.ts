import { request } from './http';
import type { Transaction } from '../types/api';

export type ListTransactionsParams = {
  from?: string;
  to?: string;
  type?: 'income' | 'expense';
  category_id?: string;
  account_id?: string;
  status?: 'pending' | 'completed' | 'canceled';
  page?: number;
  pageSize?: number;
};

export function listTransactions(params: ListTransactionsParams) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    qs.set(k, String(v));
  }
  const q = qs.toString();
  return request<{ transactions: Transaction[]; page: number; pageSize: number; total: number }>(`/transactions${q ? `?${q}` : ''}`);
}

export function createTransaction(input: {
  type: 'income' | 'expense';
  amount: number;
  description?: string | null;
  category_id?: string | null;
  account_id: string;
  transaction_date: string;
  status: 'pending' | 'completed' | 'canceled';
  is_recurring?: boolean;
  recurring_id?: string | null;
}) {
  return request<{ transaction: Transaction }>('/transactions', { method: 'POST', body: JSON.stringify(input) });
}

export function updateTransaction(id: string, input: Partial<{
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  category_id: string | null;
  account_id: string;
  transaction_date: string;
  status: 'pending' | 'completed' | 'canceled';
  is_recurring: boolean;
  recurring_id: string | null;
}>) {
  return request<{ transaction: Transaction }>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteTransaction(id: string) {
  return request<void>(`/transactions/${id}`, { method: 'DELETE' });
}

