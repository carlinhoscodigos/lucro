import { prisma } from "../src/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server"; // Importação correta para Next.js 15
import { SignOutButton } from "@clerk/nextjs"; 
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, ReceiptText, Calendar, LogOut } from 'lucide-react';

export default async function Home() {
  // =========================================================
  // BLOQUEIO DE SEGURANÇA (CLERK)
  // =========================================================
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  // 1. BUSCA (Lê apenas os dados do usuário atual)
  const transacoes = await prisma.transaction.findMany({
    where: { userId: userId },
    orderBy: { createdAt: 'desc' }
  });

  // 2. A MATEMÁTICA DO PAINEL
  const totalEntradas = transacoes
    .filter(t => t.type === "INCOME")
    .reduce((soma, t) => soma + t.amount, 0);

  const totalSaidas = transacoes
    .filter(t => t.type === "EXPENSE")
    .reduce((soma, t) => soma + t.amount, 0);

  const saldo = totalEntradas - totalSaidas;

  // 3. AÇÕES DO SERVIDOR
  async function adicionarTransacao(formData: FormData) {
    "use server"
    const { userId } = await auth();
    if (!userId) return;

    const description = formData.get("titulo") as string;
    const amount = parseFloat(formData.get("valor") as string);
    const type = formData.get("tipo") as string;

    // Garante que o usuário existe no Prisma (Sincroniza com o ID do Clerk)
    // Nota: O email aqui é temporário, o ideal é pegar do Clerk via Webhook futuramente
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { 
        id: userId, 
        email: `user_${userId}@lucro.com`, 
        role: "USER" 
      }
    });

    // Busca ou cria conta e categoria padrão para ESTE usuário
    let account = await prisma.account.findFirst({ where: { userId } });
    if (!account) {
      account = await prisma.account.create({ 
        data: { userId, name: "Conta Principal", type: "CHECKING" } 
      });
    }

    let category = await prisma.category.findFirst({ where: { userId } });
    if (!category) {
      category = await prisma.category.create({ 
        data: { userId, name: "Geral", type: "INCOME" } 
      });
    }

    await prisma.transaction.create({
      data: {
        description,
        amount,
        type,
        userId,
        accountId: account.id,
        categoryId: category.id
      }
    });
    
    revalidatePath("/");
  }

  async function excluirTransacao(formData: FormData) {
    "use server"
    const { userId } = await auth();
    const id = formData.get("id") as string;
    
    // Garante que o usuário só possa excluir a própria transação
    await prisma.transaction.delete({
      where: { id: id, userId: userId as string }
    });
    revalidatePath("/");
  }

  // Formatadores utilitários
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short'
    }).format(new Date(data));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <header className="bg-white border-b border-gray-200/60 pt-10 pb-6 px-6 mb-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              Lucrô<span className="text-emerald-500 text-4xl leading-none">.</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Gestão financeira inteligente</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Wallet className="text-emerald-600" size={24} />
            </div>
            
            <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
            
            {/* Logout simplificado com Clerk */}
            <SignOutButton>
              <button
                className="flex items-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all font-medium text-sm group"
                title="Sair da conta"
              >
                <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Entradas</h3>
              <div className="bg-emerald-100 p-2 rounded-lg">
                <TrendingUp className="text-emerald-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{formatarMoeda(totalEntradas)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Saídas</h3>
              <div className="bg-rose-100 p-2 rounded-lg">
                <TrendingDown className="text-rose-600" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{formatarMoeda(totalSaidas)}</p>
          </div>

          <div className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden transition-colors ${saldo >= 0 ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white'}`}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Saldo Atual</h3>
              <Wallet className="text-slate-300" size={20} />
            </div>
            <p className="text-4xl font-extrabold relative z-10">{formatarMoeda(saldo)}</p>
          </div>
        </div>

        {/* FORMULÁRIO DE ADIÇÃO */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-10">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Plus className="text-emerald-500" size={20} />
            Nova Transação
          </h2>
          
          <form action={adicionarTransacao} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5 flex flex-col gap-2">
              <label htmlFor="titulo" className="text-sm font-semibold text-slate-600">Descrição</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                placeholder="Ex: Conta de Luz, Salário..."
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="md:col-span-3 flex flex-col gap-2">
              <label htmlFor="valor" className="text-sm font-semibold text-slate-600">Valor (R$)</label>
              <input
                type="number"
                id="valor"
                name="valor"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label htmlFor="tipo" className="text-sm font-semibold text-slate-600">Tipo</label>
              <select
                id="tipo"
                name="tipo"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none"
              >
                <option value="INCOME">Entrada</option>
                <option value="EXPENSE">Saída</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-emerald-500 text-white p-3.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm active:scale-[0.98] flex justify-center items-center gap-2"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>

        {/* LISTA DE TRANSAÇÕES */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ReceiptText className="text-slate-400" size={20} />
            Histórico Recente
          </h2>
          
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {transacoes.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <ReceiptText className="text-slate-300" size={40} />
                </div>
                <p className="text-slate-500 font-medium">Nenhuma movimentação ainda.</p>
                <p className="text-slate-400 text-sm mt-1">Cadastre sua primeira entrada ou saída acima.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {transacoes.map(t => (
                  <li key={t.id} className="group flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors">
                    
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${t.type === 'INCOME' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'}`}>
                        {t.type === 'INCOME' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold">{t.description}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} />
                          {t.createdAt ? formatarData(t.createdAt) : 'Sem data'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className={`font-bold tracking-tight ${t.type === "INCOME" ? "text-emerald-600" : "text-slate-800"}`}>
                        {t.type === "INCOME" ? "+" : "-"} {formatarMoeda(t.amount)}
                      </span>
                      
                      <form action={excluirTransacao}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Excluir transação"
                        >
                          <Trash2 size={18} />
                        </button>
                      </form>
                    </div>

                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}