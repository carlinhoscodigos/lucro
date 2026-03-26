import { Link } from 'react-router-dom';

const features = [
  'Dashboard',
  'Lançamentos',
  'Contas',
  'Categorias',
  'Orçamentos',
  'Metas',
  'Recorrências',
  'Relatórios',
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-6 md:py-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur px-4 md:px-6 h-16 flex items-center justify-between">
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
            <Link to="/login" className="h-10 px-4 rounded-2xl bg-emerald-500 text-white text-sm font-semibold inline-flex items-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition">
              Entrar
            </Link>
          </div>
        </header>

        <section className="mt-6 md:mt-8 rounded-3xl bg-white text-slate-900 border border-slate-100 shadow-xl shadow-slate-900/10 p-6 md:p-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black leading-tight">
              Controle sua grana sem planilhas complicadas
            </h1>
            <p className="mt-4 text-slate-600 text-base md:text-lg font-medium">
              Organize entradas, saídas, contas, metas e orçamentos em um só lugar, com uma interface simples e direta.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/login" className="h-11 px-5 rounded-2xl bg-emerald-500 text-white font-semibold inline-flex items-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition">
                Começar agora
              </Link>
              <Link to="/login" className="h-11 px-5 rounded-2xl bg-slate-100 text-slate-900 font-semibold inline-flex items-center hover:bg-slate-200 transition">
                Fazer login
              </Link>
            </div>
          </div>
        </section>

        <section id="beneficios" className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ['Controle simples', 'Registre receitas e despesas sem complicação.'],
            ['Visão clara', 'Acompanhe saldo, categorias e movimentações em tempo real.'],
            ['Mais organização', 'Use metas, orçamentos e recorrências para manter tudo sob controle.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-white border border-slate-100 p-6 text-slate-900">
              <div className="font-black text-lg">{title}</div>
              <div className="mt-2 text-sm font-medium text-slate-600">{text}</div>
            </div>
          ))}
        </section>

        <section id="recursos" className="mt-6 rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
          <h2 className="text-2xl font-black text-slate-900">Recursos do Lucrô</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((f) => (
              <div key={f} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm font-bold text-slate-700">
                {f}
              </div>
            ))}
          </div>
        </section>

        <section id="cta" className="mt-6 rounded-3xl bg-emerald-500 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl md:text-3xl font-black">Comece a organizar sua vida financeira hoje</div>
            <div className="text-emerald-50 font-medium mt-1">Sem complicação, sem planilhas confusas.</div>
          </div>
          <Link to="/login" className="h-11 px-5 rounded-2xl bg-white text-emerald-700 font-black inline-flex items-center justify-center">
            Fazer login
          </Link>
        </section>
      </div>
    </div>
  );
}

