'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Github, Chrome as Google } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { HttpRequestError, postJson } from '@/lib/http-client';
import type { UserRole } from '@/lib/auth-session';

function resolvePostLoginRoute(role: UserRole) {
  if (role === 'platform_admin') return '/admin';
  if (role === 'support_agent') return '/admin/support';
  if (role === 'production_operator') return '/admin/production';
  return '/account';
}

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const { refreshSession } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const payload = await postJson<{ ok: true; session: { userRole: UserRole } }>('/api/auth/login', { email, password });
      await refreshSession();
      window.location.href = resolvePostLoginRoute(payload.session.userRole);
    } catch (error) {
      console.error(error);
      if (error instanceof HttpRequestError && error.status === 401) {
        setLoginError('E-mail ou senha invalidos. Revise os dados e tente novamente.');
      } else {
        setLoginError('Não foi possível entrar agora. Tente novamente em instantes.');
      }
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <header className="px-8 py-10 flex justify-center items-center border-b border-ruah-100 bg-white">
        <Link href="/" aria-label="UseRuah">
          <Image src="/brand/SVG/logo-wordmark-dark.svg" alt="UseRuah" width={180} height={48} className="h-auto w-[180px]" priority />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif italic text-ruah-950 mb-4">Reconectar ao Sopro.</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ruah-300 italic">Identifique sua essência para entrar.</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white p-10 rounded-[3rem] border border-ruah-100 shadow-fancy flex flex-col gap-6">
            <div className="flex flex-col gap-2">
               <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Cetro Digital (Email)</label>
               <div className="relative">
                  <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-ruah-200" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    placeholder="seu@folego.com" 
                    className="w-full bg-ruah-50 border border-ruah-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" 
                  />
               </div>
            </div>

            <div className="flex flex-col gap-2">
               <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Segredo (Senha)</label>
                  <Link href="/help-center" className="text-[8px] font-bold uppercase tracking-widest text-accent-gold">Esqueci a senha</Link>
               </div>
               <div className="relative">
                  <Lock size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-ruah-200" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    placeholder="********" 
                    className="w-full bg-ruah-50 border border-ruah-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" 
                  />
               </div>
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-accent-gold transition-all flex items-center justify-center gap-4 shadow-xl"
            >
              {isLoggingIn ? 'SOPRANDO...' : 'ENTRAR NO MOVIMENTO'} <ArrowRight size={16} />
            </button>
            {loginError && <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">{loginError}</p>}

            <div className="relative flex items-center justify-center my-4">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ruah-50"></div></div>
               <span className="relative px-4 bg-white text-[8px] font-bold text-ruah-200 uppercase tracking-widest">Ou acesse via</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button type="button" className="flex items-center justify-center gap-3 py-4 border border-ruah-100 rounded-2xl hover:bg-ruah-50 transition-all">
                  <Google size={14} className="text-ruah-950" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Google</span>
               </button>
               <button type="button" className="flex items-center justify-center gap-3 py-4 border border-ruah-100 rounded-2xl hover:bg-ruah-50 transition-all">
                  <Github size={14} className="text-ruah-950" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">GitHub</span>
               </button>
            </div>
          </form>

          <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest text-ruah-400">
            Ainda não respira nossa arte? {' '}
            <Link href="/register" className="text-accent-gold border-b border-accent-gold pb-0.5">Manifeste-se agora</Link>
          </p>
        </motion.div>
      </main>

      <footer className="p-12 text-center">
         <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">UseRuah &copy; 2026</p>
      </footer>
    </div>
  );
}


