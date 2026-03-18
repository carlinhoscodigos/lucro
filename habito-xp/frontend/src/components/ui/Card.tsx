import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx('rounded-3xl bg-white shadow-xl shadow-slate-900/5 border border-slate-100', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('px-6 pt-6 pb-3', className)}>{children}</div>;
}

export function CardTitle({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('text-sm font-semibold text-slate-600', className)}>{children}</div>;
}

export function CardValue({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('text-2xl font-black text-slate-900 mt-2', className)}>{children}</div>;
}

export function CardBody({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('px-6 pb-6', className)}>{children}</div>;
}

