// @ts-nocheck
"use client"

import { useSignIn, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Se já estiver logado, manda pra home
  useEffect(() => {
    if (isUserLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn, isUserLoaded, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!signIn) {
      setError("O sistema de login ainda está iniciando. Tente novamente em instantes.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      // Fluxo feliz: sessão criada -> ativa e redireciona
      if (result && result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/";
        return;
      }

      // Qualquer outro status é considerado falha de login
      console.warn("Status de login inesperado:", result?.status, result);
      setError("Não foi possível entrar. Verifique e-mail e senha.");
      setLoading(false);
      return;
    } catch (err: any) {
      console.error("Erro no login:", err);

      const firstError = err?.errors?.[0];
      if (firstError) {
        const code = firstError.code;
        const msg = (firstError.longMessage || firstError.message || "").toLowerCase();

        // Senha / e‑mail realmente incorretos -> mostramos erro e NÃO redirecionamos
        if (code === "form_password_incorrect") {
          setError("Senha incorreta.");
          setLoading(false);
          return;
        }

        if (code === "form_identifier_not_found") {
          setError("E-mail não encontrado.");
          setLoading(false);
          return;
        }

        // Já logado ou sessão existente -> apenas informação, sem recarregar aqui.
        if (code === "session_exists" || msg.includes("already signed in")) {
          setError("");
          setLoading(false);
          return;
        }
      }

      // Qualquer outro erro desconhecido: mostra mensagem genérica
      // e NÃO recarrega a página.
      setError("Erro ao tentar entrar. Tente novamente.");
      setLoading(false);
    }
  }

  // Se já estiver logado, não mostra o formulário
  if (isUserLoaded && isSignedIn) return null;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="bg-white rounded-[32px] w-full max-w-[440px] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 flex items-center justify-center gap-1">
            Lucrô<span className="text-emerald-500 text-5xl leading-[0]">.</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3">Acesso restrito aos administradores.</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl mb-6 text-center font-medium border border-rose-100 animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 transition-all" 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-900 transition-all" 
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white font-bold p-5 rounded-2xl mt-4 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar no sistema <ArrowRight size={20} /></>}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
          <ShieldCheck size={16} className="text-emerald-500" />
          Acesso seguro com criptografia de ponta a ponta
        </div>
      </div>
    </div>
  );
}