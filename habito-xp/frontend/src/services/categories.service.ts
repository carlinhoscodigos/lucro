import { request } from './http';
import type { Category } from '../types/api';

export function listCategories(type?: Category['type']) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return request<{ categories: Category[] }>(`/categories${qs}`);
}

export function createCategory(input: { name: string; type: Category['type']; color?: string | null; icon?: string | null; is_default?: boolean }) {
  return request<{ category: Category }>('/categories', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCategory(id: string, input: Partial<{ name: string; type: Category['type']; color: string | null; icon: string | null; is_default: boolean }>) {
  return request<{ category: Category }>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteCategory(id: string) {
  return request<void>(`/categories/${id}`, { method: 'DELETE' });
}

