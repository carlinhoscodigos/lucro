import type { ApiError } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error('VITE_API_URL não definido');

  const headers = new Headers(init.headers);
  // Evita preflight desnecessário em GET/requests sem body.
  // Só define Content-Type quando realmente vamos enviar JSON.
  if (init.body !== undefined && init.body !== null && !(init.body instanceof FormData)) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = (data ?? { error: 'unknown', message: 'Erro desconhecido' }) as ApiError;
    const message = err.message || err.error || 'Erro';
    const e = new Error(message);
    // @ts-expect-error attach
    e.status = res.status;
    // @ts-expect-error attach
    e.data = err;
    throw e;
  }

  return data as T;
}

export function buildQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

