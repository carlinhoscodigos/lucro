import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LayoutDashboard, List, Wallet, Tags, Target, Repeat, BarChart3, Settings, PieChart, Search, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/auth.service';
import { useQueryClient } from '@tanstack/react-query';
import { listAccounts } from '../services/accounts.service';
import { listCategories } from '../services/categories.service';
import { listTransactions } from '../services/transactions.service';
import { request } from '../services/http';
import type { DashboardResponse } from '../types/api';

const nav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/transactions', label: 'Lançamentos', icon: List },
  { to: '/app/accounts', label: 'Contas', icon: Wallet },
  { to: '/app/categories', label: 'Categorias', icon: Tags },
  { to: '/app/budgets', label: 'Orçamentos', icon: PieChart },
  { to: '/app/goals', label: 'Metas', icon: Target },
  { to: '/app/recurring', label: 'Recorrências', icon: Repeat },
  { to: '/app/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/app/settings', label: 'Configurações', icon: Settings },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Prefetch para navegação instantânea (evita “carregando” ao clicar no menu).
  // A ideia é: quando o user entra na área logada, já buscar as páginas mais prováveis em background.
  useEffect(() => {
    if (!token) return;

    qc.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: () => request<DashboardResponse>('/dashboard'),
      staleTime: 10 * 60_000,
    });

    qc.prefetchQuery({
      queryKey: ['accounts'],
      queryFn: listAccounts,
      staleTime: 10 * 60_000,
    });

    qc.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () => listCategories(),
      staleTime: 10 * 60_000,
    });

    const defaultTxParams = {
      from: undefined,
      to: undefined,
      type: undefined,
      category_id: undefined,
      account_id: undefined,
      status: undefined,
      page: 1,
      pageSize: 20,
    };

    qc.prefetchQuery({
      queryKey: ['transactions', JSON.stringify(defaultTxParams)],
      queryFn: () => listTransactions(defaultTxParams),
      staleTime: 10 * 60_000,
    });
  }, [qc, token]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 md:gap-6">
          {/* Sidebar desktop */}
          <aside className="hidden md:block">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-900/5 overflow-hidden">
              <div className="h-2 bg-emerald-500" />
              <div className="p-5">
                <div className="text-2xl font-black text-slate-900 flex items-center gap-1">
                  Lucrô<span className="text-emerald-500 text-3xl leading-none">.</span>
                </div>
                <div className="mt-4 space-y-1">
                  {nav.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                          isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-slate-600 hover:bg-slate-50'
                        )
                      }
                    >
                      <item.icon size={18} />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 p-4">
                <button
                  className="w-full rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  Sair
                </button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            {/* Topbar */}
            <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-900/5 overflow-hidden">
              <div className="h-2 bg-emerald-500" />
              <div className="p-4 md:p-5 flex items-center gap-3">
                <button
                  className="md:hidden rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100"
                  onClick={() => setMobileOpen(true)}
                >
                  Menu
                </button>

                <div className="min-w-0 hidden md:block">
                  <div className="text-sm font-semibold text-slate-500 truncate">
                    Olá{user?.name ? `, ${user.name}` : ''}
                  </div>
                  <div className="hidden md:block text-base md:text-xl font-black text-slate-900 leading-tight">
                    Bem-vindo de volta
                  </div>
                </div>

                <div className="flex-1" />

                <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-100 px-3 h-11 w-[360px]">
                  <Search size={18} className="text-slate-400" />
                  <input
                    placeholder="Buscar lançamentos, categorias, contas…"
                    className="w-full bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                  />
                </div>

                <Button
                  className="hidden md:inline-flex"
                  onClick={() => navigate('/app/transactions?new=1')}
                >
                  <Plus size={18} />
                  Adicionar lançamento
                </Button>

                <button className="rounded-2xl h-11 w-11 grid place-items-center bg-slate-100 text-slate-700">
                  <Bell size={18} />
                </button>

                <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white grid place-items-center font-black">
                  {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[320px] bg-white/95 backdrop-blur shadow-2xl">
            <div className="h-2 bg-emerald-500" />
            <div className="p-5 flex items-center justify-between">
              <div className="text-2xl font-black text-slate-900 flex items-center gap-1">
                Lucrô<span className="text-emerald-500 text-3xl leading-none">.</span>
              </div>
              <button className="rounded-2xl px-3 py-2 bg-slate-100 font-semibold" onClick={() => setMobileOpen(false)}>
                Fechar
              </button>
            </div>
            <div className="px-5 pb-5 space-y-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                      isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-slate-600 hover:bg-slate-50'
                    )
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
              <div className="pt-3 border-t border-slate-100">
                <button
                  className="w-full rounded-2xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

