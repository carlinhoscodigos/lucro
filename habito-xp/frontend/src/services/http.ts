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

function safeErrorMessageByStatus(status: number) {
  if (status === 401) return 'Sessão inválida. Faça login novamente.';
  if (status === 403) return 'Você não tem permissão para realizar esta ação.';
  if (status === 404) return 'Recurso não encontrado.';
  if (status === 429) return 'Muitas tentativas. Tente novamente mais tarde.';
  if (status >= 500) return 'Não foi possível concluir a ação.';
  return 'Não foi possível concluir a ação.';
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
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = (data ?? { error: 'unknown', message: safeErrorMessageByStatus(res.status) }) as ApiError;
    const message = safeErrorMessageByStatus(res.status);
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

