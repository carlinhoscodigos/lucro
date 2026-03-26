import { request } from './http';

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  expires_on: string | null;
};

export function listUsers() {
  return request<{ users: ManagedUser[] }>('/users');
}

export function createUser(input: {
  name: string;
  email: string;
  password: string;
  expires_on: string;
  plan?: string;
  role?: 'admin' | 'user';
  is_active?: boolean;
}) {
  return request<{ user: ManagedUser }>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string) {
  return request<void>(`/users/${id}`, { method: 'DELETE' });
}

export function changeUserPassword(id: string, password: string) {
  return request<{ ok: true }>(`/users/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

