import { request, setToken, clearToken } from './http';
import type { User } from '../types/api';

export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function me() {
  const data = await request<{ user: User }>('/auth/me');
  return data.user;
}

export function logout() {
  clearToken();
}

