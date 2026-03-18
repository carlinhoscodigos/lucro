import { request } from './http';
import type { Account } from '../types/api';

export function listAccounts() {
  return request<{ accounts: Account[] }>('/accounts');
}

export function createAccount(input: { name: string; type: Account['type']; initial_balance?: number }) {
  return request<{ account: Account }>('/accounts', { method: 'POST', body: JSON.stringify(input) });
}

export function updateAccount(id: string, input: Partial<{ name: string; type: Account['type']; initial_balance: number; is_active: boolean }>) {
  return request<{ account: Account }>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteAccount(id: string) {
  return request<void>(`/accounts/${id}`, { method: 'DELETE' });
}

