export type UUID = string;

export type ApiError = {
  error: string;
  message?: string;
  missing?: string[];
};

export type User = {
  id: UUID;
  email: string;
  name: string;
  plan: string;
};

export type Account = {
  id: UUID;
  name: string;
  type: 'checking' | 'savings' | 'wallet' | 'credit_card' | 'investment';
  initial_balance: string | number;
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: UUID;
  name: string;
  type: 'income' | 'expense';
  color: string | null;
  icon: string | null;
  is_default: boolean;
  created_at: string;
};

export type Transaction = {
  id: UUID;
  type: 'income' | 'expense';
  amount: string | number;
  description: string | null;
  transaction_date: string;
  status: 'pending' | 'completed' | 'canceled';
  account_id: UUID;
  account_name?: string;
  category_id: UUID | null;
  category_name?: string;
  category_color?: string;
  is_recurring: boolean;
  recurring_id: UUID | null;
  created_at: string;
  updated_at: string;
};

export type DashboardResponse = {
  summary: {
    balance: string | number;
    income_month: string | number;
    expense_month: string | number;
    projected_balance: number;
    month: { from: string; to: string };
  };
  charts: {
    monthly: Array<{ month: string; income: string | number; expense: string | number }>;
    expenses_by_category: Array<{ name: string; color: string; total: string | number }>;
  };
  last_transactions: Array<Pick<Transaction, 'id' | 'type' | 'amount' | 'description' | 'transaction_date' | 'status' | 'account_id' | 'category_id'>>;
  alerts: Array<{ title: string; message: string; level: 'info' | 'warning' | 'danger' }>;
};

