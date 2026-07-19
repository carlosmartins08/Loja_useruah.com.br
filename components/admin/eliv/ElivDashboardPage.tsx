'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Package, 
  Activity, 
  DollarSign, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

const dataVendasProducao: Array<{ name: string; vendas: number; producao: number; qualidade: number }> = [];
const dataDistribuicaoCustos: Array<{ name: string; value: number; color: string }> = [];

const StatCard = ({ title, value, subValue, icon: Icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-3xl border border-ruah-50 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
        <Icon size={24} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-ruah-400">Sem fonte conectada</span>
    </div>
    <h3 className="text-sm font-medium text-ruah-500 mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-ruah-950">{value}</span>
      <span className="text-xs font-bold text-green-500">{subValue}</span>
    </div>
  </motion.div>
);

export default function ElivDashboardPage() {
  return (
    <div className="min-h-screen bg-ruah-25 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 border-b border-ruah-100 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-amber-100 text-amber-800 px-2 py-1 rounded">Legado</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ruah-400">Experimental</span>
          </div>
          <h1 className="text-4xl font-serif font-black text-ruah-950 uppercase tracking-tighter">
            ELIV <span className="text-accent-gold italic">(laboratório)</span>
          </h1>
          <p className="text-ruah-500 mt-2 max-w-xl">
            Esta área não é uma fonte operacional. Os indicadores, previsões e integrações ELIV aguardam dados persistidos e validação de produto.
          </p>
        </div>
        <div className="flex gap-3">
          <button disabled className="px-6 py-3 bg-white border border-ruah-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest cursor-not-allowed opacity-60">
            Relatório indisponível
          </button>
          <button disabled className="px-6 py-3 bg-ruah-300 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest cursor-not-allowed">
            Ajuste indisponível
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Stats - Os 3 Pilares Fundamentais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Receita líquida"
            value="—"
            subValue="fonte indisponível"
            icon={DollarSign} 
            color="bg-accent-gold" 
            delay={0.1}
          />
          <StatCard 
            title="Eficiência de produção"
            value="—"
            subValue="fonte indisponível"
            icon={Activity} 
            color="bg-green-500" 
            delay={0.2}
          />
          <StatCard 
            title="Custo variável unitário"
            value="—"
            subValue="não calculado"
            icon={TrendingUp} 
            color="bg-blue-500" 
            delay={0.3}
          />
          <StatCard 
            title="Pedidos em fulfillment"
            value="—"
            subValue="fonte indisponível"
            icon={Package} 
            color="bg-ruah-950" 
            delay={0.4}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Fusion Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-ruah-50 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-xl font-black text-ruah-950 uppercase tracking-tight">Série operacional</h2>
                <p className="text-xs text-ruah-400 font-medium tracking-widest uppercase mt-1">Dados de vendas, produção e qualidade não conectados</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-gold"></div>
                  <span className="text-[10px] font-bold text-ruah-500 uppercase">Sem dados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ruah-950"></div>
                  <span className="text-[10px] font-bold text-ruah-500 uppercase">Sem dados</span>
                </div>
              </div>
            </div>
            
            <div className="h-[350px] w-full overflow-x-auto">
              <BarChart width={760} height={350} data={dataVendasProducao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1A1' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1A1' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#F9F9F9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="vendas" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="producao" fill="#1A1A1A" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </div>
          </div>

          {/* Cost Distribution Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-ruah-50 shadow-sm">
            <h2 className="text-xl font-black text-ruah-950 uppercase tracking-tight mb-2">Composição de custo</h2>
            <p className="text-xs text-ruah-400 font-medium tracking-widest uppercase mb-8">Não calculada nesta área experimental</p>
            
            <div className="h-[250px] w-full relative overflow-x-auto">
              <PieChart width={320} height={250}>
                <Pie
                  data={dataDistribuicaoCustos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {dataDistribuicaoCustos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest">Margem</span>
                <span className="text-xl font-black text-ruah-400">—</span>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              {dataDistribuicaoCustos.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs font-bold text-ruah-600 uppercase">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-ruah-950">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Timeline & Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-ruah-50 shadow-sm">
            <h2 className="text-xl font-black text-ruah-950 uppercase tracking-tight mb-6">Monitor de produção</h2>
            <div className="rounded-2xl border border-dashed border-ruah-200 bg-ruah-25 p-6">
              <p className="text-sm font-bold text-ruah-950">Fonte operacional não conectada</p>
              <p className="mt-2 text-xs leading-relaxed text-ruah-500">
                Esta área não exibe lotes, qualidade, produção ou expedição como fatos operacionais.
              </p>
            </div>
          </div>

          <div className="bg-ruah-950 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="text-accent-gold" size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">Escopo experimental</span>
              </div>
              <h2 className="text-3xl font-serif italic font-black mb-6">
                Nenhum insight operacional disponível.
              </h2>
              <p className="text-ruah-400 text-sm leading-relaxed mb-8">
                O ELIV permanece isolado como conceito de laboratório até existir integração validada com pedidos, produção, custos e qualidade.
              </p>
            </div>

            <button disabled className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl cursor-not-allowed opacity-60">
              <span className="text-xs font-black uppercase tracking-widest">Ação indisponível</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
