import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function LoadingState({ title = 'Carregando…' }: { title?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-500 py-10">
      <Loader2 className="animate-spin" size={18} />
      <span className="font-medium">{title}</span>
    </div>
  );
}

export function ErrorState({ title = 'Algo deu errado', message }: { title?: string; message?: ReactNode }) {
  return (
    <div className="rounded-3xl bg-rose-50 border border-rose-100 p-5 text-rose-700">
      <div className="flex items-center gap-2 font-bold">
        <AlertTriangle size={18} />
        {title}
      </div>
      {message ? <div className="mt-2 text-sm font-medium text-rose-600">{message}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-8 text-center">
      <div className="text-slate-900 font-black text-lg">{title}</div>
      {description ? <div className="mt-2 text-slate-500 text-sm font-medium">{description}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

