import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

export function Select({ wrapperClassName, className, disabled, ...props }: Props) {
  return (
    <div className={clsx('relative', wrapperClassName)}>
      <select
        {...props}
        disabled={disabled}
        className={clsx(
          'w-full h-11 rounded-2xl border border-slate-100 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-900 outline-none',
          'focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500',
          disabled ? 'opacity-60 cursor-not-allowed' : '',
          className
        )}
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <ChevronDown size={16} />
      </div>
    </div>
  );
}

