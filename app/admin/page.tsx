'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Package, 
  Activity, 
  BarChart3, 
  Users, 
  Terminal,
  Settings,
  ArrowRight,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import type { UserRole } from '@/lib/auth-session';

const modules = [
  {
    id: 1,
    title: 'Captacao de Valor',
    description: 'Modulo 1: Front-end de vendas e validaÃ§Ã£o de especificacoes.',
    icon: Zap,
    href: '/shop',
    color: 'text-accent-gold',
    bg: 'bg-accent-gold/10'
  },
  {
    id: 4,
    title: 'Gestao Operacional',
    description: 'Modulo 4: Portal do Parceiro, produÃ§Ã£o e controle de custos (CVu).',
    icon: Package,
    href: '/admin/production',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    id: 5,
    title: 'Analise Preditiva',
    description: 'Modulo 5: Dashboard estratÃ©gico ELIV e KPIs de marca.',
    icon: BarChart3,
    href: '/admin/eliv',
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  {
    id: 0,
    title: 'Configuracoes ELIV',
    description: 'Pilar I: Ajustes de fundamentaÃ§Ã£o e variÃ¡veis de sistema.',
    icon: Settings,
    href: '#',
    color: 'text-ruah-400',
    bg: 'bg-ruah-100'
  },
  {
    id: 6,
    title: 'Suporte & Atendimento',
    description: 'Central de ajuda operacional e acompanhamento de pedidos para suporte.',
    icon: Users,
    href: '/admin/support',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    id: 7,
    title: 'Conectores Pagamento',
    description: 'Gestao self-service de credenciais e teste de integracao por gateway.',
    icon: ShieldCheck,
    href: '/admin/payments/connectors',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
];

function isModuleAllowed(role: UserRole, moduleId: number) {
  if (role === 'platform_admin') return true;
  if (role === 'production_operator') return moduleId === 4;
  if (role === 'support_agent') return moduleId === 6;
  return false;
}

export default function AdminHub() {
  const { userRole } = useUser();
  const allowedModules = modules.filter((module) => isModuleAllowed(userRole, module.id));

  return (
    <div className="min-h-screen bg-ruah-25 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-ruah-950 rounded-xl flex items-center justify-center">
                <Terminal className="text-accent-gold" size={20} />
             </div>
             <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">Sistema Integrado ELIV</span>
          </div>
          <h1 className="text-5xl font-serif font-black text-ruah-950 uppercase tracking-tighter leading-none mb-4">
            Painel de Controle <span className="text-accent-gold italic">Operacional</span>
          </h1>
          <p className="text-ruah-500 max-w-2xl font-medium">
            Gerenciamento centralizado da Marca Propria. 
            Sincronizacao em tempo real entre Consumidor, Parceiro e Analise Preditiva.
          </p>
        </header>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {allowedModules.map((module, idx) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={module.href}>
                <div className="bg-white p-8 rounded-[2.5rem] border border-ruah-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all h-full flex flex-col group">
                  <div className={`w-14 h-14 rounded-2xl ${module.bg} ${module.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <module.icon size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-ruah-950 uppercase tracking-tight mb-2">{module.title}</h3>
                    <p className="text-sm text-ruah-500 leading-relaxed">{module.description}</p>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ruah-400 group-hover:text-accent-gold transition-colors">
                    Acessar Modulo <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Fusion Monitor */}
        <div className="mt-16 bg-ruah-950 rounded-[3rem] p-10 text-white overflow-hidden relative">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-gold">Fusao Industrial Ativa</span>
              </div>
              <h2 className="text-4xl font-serif italic font-black mb-6 leading-tight">
                Fluxo de pedidos estabilizado com taxa de qualidade de 98.4%.
              </h2>
              <p className="text-ruah-400 text-sm font-medium leading-relaxed">
                As especificacoes operacionais do Modulo 1 estao sendo transmitidas via ELIV para o Modulo 4 sem divergencias detectadas nos ultimos 7 lotes.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                <span className="text-xs font-semibold text-ruah-400 uppercase tracking-widest block mb-2">Pedidos de Hoje</span>
                <span className="text-3xl font-black text-white">42</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                <span className="text-xs font-semibold text-ruah-400 uppercase tracking-widest block mb-2">Agrupamento Lote</span>
                <span className="text-3xl font-black text-accent-gold italic">Smart</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 flex justify-between items-center border-t border-ruah-100 pt-8">
           <span className="text-[10px] font-bold text-ruah-300 uppercase tracking-widest">Â© 2024 RUAH BRAZIL - Sistema ELIV v2.4</span>
           <div className="flex gap-6">
             <span className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck size={14} className="text-green-500" /> Protocolo Seguro
             </span>
             <span className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest flex items-center gap-2">
               <Activity size={14} className="text-accent-gold" /> M4 Sincronizado
             </span>
           </div>
        </div>
      </div>
    </div>
  );
}


