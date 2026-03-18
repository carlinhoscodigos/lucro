import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/State';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../services/categories.service';
import type { Category } from '../types/api';

export function CategoriesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['categories'], queryFn: () => listCategories() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const save = useMutation({
    mutationFn: async (input: any) => {
      if (editing) return updateCategory(editing.id, input);
      return createCategory(input);
    },
    onSuccess: async () => {
      setOpen(false);
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const del = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  if (q.isLoading) return <LoadingState title="Carregando categorias…" />;
  if (q.isError) return <ErrorState message={(q.error as Error).message} />;
  const cats = q.data!.categories;

  const incomes = cats.filter((c) => c.type === 'income');
  const expenses = cats.filter((c) => c.type === 'expense');

  function List({ title, items }: { title: string; items: Category[] }) {
    return (
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-black text-slate-900">{title}</div>
          <div className="text-sm text-slate-500 font-semibold">{items.length}</div>
        </div>
        {items.length ? (
          <div className="divide-y divide-slate-100">
            {items.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl" style={{ background: c.color || '#e2e8f0' }} />
                <div className="min-w-0 flex-1">
                  <div className="font-black text-slate-900 truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 font-semibold">{c.is_default ? 'padrão' : 'personalizada'}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>Editar</Button>
                <Button variant="danger" size="sm" onClick={() => del.mutate(c.id)} disabled={del.isPending}>Excluir</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="Nada por aqui" description="Crie uma categoria para organizar seus lançamentos." />
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-white">Categorias</div>
          <div className="text-sm text-slate-300 font-medium">Organize receitas e despesas com clareza.</div>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>Nova categoria</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <List title="Receitas" items={incomes} />
        <List title="Despesas" items={expenses} />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setEditing(null); }} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl">
            <div className="h-2 bg-emerald-500" />
            <div className="p-6">
              <div className="text-xl font-black text-slate-900">{editing ? 'Editar categoria' : 'Nova categoria'}</div>
              {save.isError ? <div className="mt-4"><ErrorState message={(save.error as Error).message} /></div> : null}
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  save.mutate({
                    name: String(fd.get('name')),
                    type: String(fd.get('type')),
                    color: String(fd.get('color') || '') || null,
                    icon: String(fd.get('icon') || '') || null,
                    is_default: fd.get('is_default') === 'on',
                  });
                }}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 ml-1">Nome</div>
                  <input name="name" defaultValue={editing?.name || ''} required className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Tipo</div>
                    <select name="type" defaultValue={editing?.type || 'expense'} className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold">
                      <option value="income">income</option>
                      <option value="expense">expense</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600 ml-1">Cor</div>
                    <input name="color" defaultValue={editing?.color || ''} placeholder="#10b981" className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600 ml-1">Ícone (opcional)</div>
                  <input name="icon" defaultValue={editing?.icon || ''} placeholder="Ex: cart, home, food" className="w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold" />
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="is_default" defaultChecked={editing?.is_default || false} />
                  Categoria padrão
                </label>
                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setOpen(false); setEditing(null); }}>Cancelar</Button>
                  <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

