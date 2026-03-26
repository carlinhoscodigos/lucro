import { Link } from 'react-router-dom';
import { BarChart3, CalendarCheck2, Wallet } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/5551996698212?text=Ol%C3%A1%2C%20quero%20pedir%20acesso%20ao%20Lucr%C3%B4.';

const features = [
  ['Dashboard', 'Visão geral da sua vida financeira.'],
  ['Lançamentos', 'Registre entradas e saídas rapidamente.'],
  ['Contas', 'Acompanhe bancos, carteiras e saldos.'],
  ['Categorias', 'Organize receitas e despesas.'],
  ['Orçamentos', 'Defina limites por categoria.'],
  ['Metas', 'Acompanhe seus objetivos financeiros.'],
  ['Recorrências', 'Automatize gastos e ganhos frequentes.'],
  ['Relatórios', 'Veja insights e exporte dados.'],
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-6 md:py-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-2xl font-black text-white flex items-center gap-1">
              Lucrô<span className="text-emerald-500 text-3xl leading-none">.</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
              <a href="#beneficios" className="hover:text-white transition">Benefícios</a>
              <a href="#recursos" className="hover:text-white transition">Recursos</a>
              <a href="#cta" className="hover:text-white transition">Começar</a>
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/login" className="h-10 px-4 rounded-2xl bg-slate-800 text-slate-100 text-sm font-semibold inline-flex items-center">
                Login
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-4 rounded-2xl bg-emerald-500 text-white text-sm font-semibold inline-flex items-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition"
              >
                Pedir acesso
              </a>
            </div>
          </div>

          <nav className="mt-4 md:hidden flex items-center gap-2 text-xs font-semibold text-slate-200">
            <a href="#beneficios" className="px-3 py-2 rounded-xl bg-slate-800/80">Benefícios</a>
            <a href="#recursos" className="px-3 py-2 rounded-xl bg-slate-800/80">Recursos</a>
            <a href="#cta" className="px-3 py-2 rounded-xl bg-slate-800/80">Começar</a>
          </nav>
        </header>

        <section className="mt-6 md:mt-8 rounded-3xl bg-white text-slate-900 border border-slate-100 shadow-xl shadow-slate-900/10 p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                Controle sua grana sem planilhas complicadas
              </h1>
              <p className="mt-4 text-slate-600 text-base md:text-lg font-medium">
                Organize entradas, saídas, contas, metas e orçamentos em um só lugar, com uma interface simples e direta.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 px-5 rounded-2xl bg-emerald-500 text-white font-semibold inline-flex items-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition"
                >
                  Pedir acesso
                </a>
                <Link to="/login" className="h-11 px-5 rounded-2xl bg-slate-100 text-slate-900 font-semibold inline-flex items-center hover:bg-slate-200 transition">
                  Fazer login
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 md:p-5">
              <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500">Visão geral</div>
                  <div className="text-xs font-bold text-emerald-600">Atualizado agora</div>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">R$ 8.450,00</div>
                <div className="text-sm font-semibold text-slate-500">Saldo consolidado</div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <div className="text-[11px] font-bold text-emerald-700">Receitas</div>
                    <div className="text-sm font-black text-emerald-700 mt-1">R$ 6.200</div>
                  </div>
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
                    <div className="text-[11px] font-bold text-rose-700">Despesas</div>
                    <div className="text-sm font-black text-rose-700 mt-1">R$ 2.140</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="text-xs font-bold text-slate-500 mb-2">Evolução mensal</div>
                  <div className="flex items-end gap-2 h-20">
                    {[28, 46, 40, 62, 58, 74].map((h, idx) => (
                      <div key={idx} className="flex-1 rounded-lg bg-emerald-500/80" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            [Wallet, 'Controle simples', 'Registre receitas e despesas em poucos segundos.'],
            [BarChart3, 'Visão clara', 'Veja saldo, categorias e movimentações sem se perder.'],
            [CalendarCheck2, 'Mais organização', 'Use metas, orçamentos e recorrências para manter tudo no eixo.'],
          ].map(([Icon, title, text]) => (
            <div key={title as string} className="rounded-3xl bg-white border border-slate-100 p-6 text-slate-900 shadow-sm">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center">
                <Icon size={18} />
              </div>
              <div className="font-black text-lg mt-4">{title}</div>
              <div className="mt-2 text-sm font-medium text-slate-600">{text}</div>
            </div>
          ))}
        </section>

        <section id="recursos" className="mt-6 rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
          <h2 className="text-2xl font-black text-slate-900">Recursos do Lucrô</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {features.map(([name, desc]) => (
              <div key={name} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="text-sm font-black text-slate-900">{name}</div>
                <div className="text-xs font-medium text-slate-600 mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
          <h2 className="text-2xl font-black text-slate-900">Como funciona</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              [1, 'Peça seu acesso', 'Fale com a gente no WhatsApp para liberar sua conta.'],
              [2, 'Registre seus lançamentos', 'Cadastre entradas e saídas de forma simples e rápida.'],
              [3, 'Acompanhe tudo em tempo real', 'Veja saldo, metas e evolução mensal em um painel único.'],
            ].map(([step, title, desc]) => (
              <div key={title as string} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="h-8 w-8 rounded-full bg-emerald-500 text-white text-sm font-black grid place-items-center">{step}</div>
                <div className="mt-3 text-sm font-black text-slate-900">{title}</div>
                <div className="mt-1 text-xs font-medium text-slate-600">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="cta" className="mt-6 rounded-3xl bg-emerald-500 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl md:text-3xl font-black">Comece a organizar sua vida financeira hoje</div>
            <div className="text-emerald-50 font-medium mt-1">Tenha controle sobre entradas, saídas, metas e orçamentos em um só lugar.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="h-11 px-5 rounded-2xl bg-white text-emerald-700 font-black inline-flex items-center justify-center"
            >
              Pedir acesso
            </a>
            <Link to="/login" className="h-11 px-5 rounded-2xl bg-emerald-600 text-white font-black inline-flex items-center justify-center border border-emerald-400/40">
              Fazer login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

