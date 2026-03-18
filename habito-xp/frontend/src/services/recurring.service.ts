import { request } from './http';

export type RecurringTransaction = {
  id: string;
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: string | number;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month: number | null;
  next_run_date: string;
  is_active: boolean;
  created_at: string;
};

export function listRecurring() {
  return request<{ recurring_transactions: RecurringTransaction[] }>('/recurring-transactions');
}

export function createRecurring(input: {
  account_id: string;
  category_id?: string | null;
  type: 'income' | 'expense';
  amount: number;
  description?: string | null;
  frequency: RecurringTransaction['frequency'];
  day_of_month?: number | null;
  next_run_date: string;
  is_active?: boolean;
}) {
  return request<{ recurring_transaction: RecurringTransaction }>('/recurring-transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateRecurring(id: string, input: Partial<Omit<RecurringTransaction, 'id' | 'created_at'>>) {
  return request<{ recurring_transaction: RecurringTransaction }>(`/recurring-transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteRecurring(id: string) {
  return request<void>(`/recurring-transactions/${id}`, { method: 'DELETE' });
}

