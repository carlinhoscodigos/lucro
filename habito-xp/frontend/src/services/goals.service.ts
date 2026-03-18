import { request } from './http';

export type Goal = {
  id: string;
  name: string;
  target_amount: string | number;
  current_amount: string | number;
  target_date: string | null;
  status: 'active' | 'completed' | 'canceled';
  created_at: string;
};

export function listGoals() {
  return request<{ goals: Goal[] }>('/goals');
}

export function createGoal(input: { name: string; target_amount: number; current_amount?: number; target_date?: string | null; status?: Goal['status'] }) {
  return request<{ goal: Goal }>('/goals', { method: 'POST', body: JSON.stringify(input) });
}

export function updateGoal(id: string, input: Partial<{ name: string; target_amount: number; current_amount: number; target_date: string | null; status: Goal['status'] }>) {
  return request<{ goal: Goal }>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteGoal(id: string) {
  return request<void>(`/goals/${id}`, { method: 'DELETE' });
}

