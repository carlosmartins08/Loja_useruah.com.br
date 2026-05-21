'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  Activity, 
  DollarSign, 
  ShieldCheck, 
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

// Dados simulados baseados na lógica ELIV
const dataVendasProducao = [
  { name: 'Seg', vendas: 400, producao: 380, qualidade: 375 },
  { name: 'Ter', vendas: 300, producao: 310, qualidade: 300 },
  { name: 'Qua', vendas: 600, producao: 580, qualidade: 560 },
  { name: 'Qui', vendas: 800, producao: 750, qualidade: 740 },
  { name: 'Sex', vendas: 500, producao: 520, qualidade: 510 },
  { name: 'Sab', vendas: 900, producao: 850, qualidade: 830 },
  { name: 'Dom', vendas: 1100, producao: 1000, qualidade: 980 },
];

const dataDistribuicaoCustos = [
  { name: 'CVu (Matéria Prima)', value: 45, color: '#D4AF37' },
  { name: 'Logística', value: 20, color: '#1A1A1A' },
  { name: 'Marketing/CAC', value: 25, color: '#666666' },
  { name: 'Margem Líquida', value: 10, color: '#22C55E' },
];

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
      <span className="text-[10px] font-bold uppercase tracking-widest text-ruah-400">KPI Ativo</span>
    </div>
    <h3 className="text-sm font-medium text-ruah-500 mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-ruah-950">{value}</span>
      <span className="text-xs font-bold text-green-500">{subValue}</span>
    </div>
  </motion.div>
);

export default function ElivDashboard() {
  return (
    <div className="min-h-screen bg-ruah-25 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 border-b border-ruah-100 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-accent-gold text-white px-2 py-1 rounded">Módulo 5</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ruah-400">Análise Preditiva</span>
          </div>
          <h1 className="text-4xl font-serif font-black text-ruah-950 uppercase tracking-tighter">
            Dashboard Estratégico <span className="text-accent-gold italic">ELIV</span>
          </h1>
          <p className="text-ruah-500 mt-2 max-w-xl">
            Monitoramento em tempo real do ecossistema Dropshipping Marca Própria. 
            Equilíbrio entre Marketing (Consumidor) e Fulfillment (Parceiro).
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border border-ruah-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:border-accent-gold transition-all">
            Exportar Relatório
          </button>
          <button className="px-6 py-3 bg-ruah-950 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-accent-gold transition-all shadow-lg shadow-ruah-950/20">
            Ajustar CVu
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Stats - Os 3 Pilares Fundamentais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Receita Líquida (Vendas)" 
            value="R$ 124.500" 
            subValue="+12%" 
            icon={DollarSign} 
            color="bg-accent-gold" 
            delay={0.1}
          />
          <StatCard 
            title="Eficiência de Produção" 
            value="94.2%" 
            subValue="+2.4%" 
            icon={Activity} 
            color="bg-green-500" 
            delay={0.2}
          />
          <StatCard 
            title="CVu Médio Estabilizado" 
            value="R$ 42,90" 
            subValue="-4.1%" 
            icon={TrendingUp} 
            color="bg-blue-500" 
            delay={0.3}
          />
          <StatCard 
            title="Pedidos em Fulfillment" 
            value="182" 
            subValue="+8" 
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
                <h2 className="text-xl font-black text-ruah-950 uppercase tracking-tight">Ponto de Fusão Crítico</h2>
                <p className="text-xs text-ruah-400 font-medium tracking-widest uppercase mt-1">Correlação: Vendas vs Produção vs Qualidade</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-gold"></div>
                  <span className="text-[10px] font-bold text-ruah-500 uppercase">Vendas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-ruah-950"></div>
                  <span className="text-[10px] font-bold text-ruah-500 uppercase">Produção</span>
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
            <h2 className="text-xl font-black text-ruah-950 uppercase tracking-tight mb-2">Composição de Custo</h2>
            <p className="text-xs text-ruah-400 font-medium tracking-widest uppercase mb-8">Pilar II: Sustentabilidade Financeira</p>
            
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
                <span className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest">Lucro</span>
                <span className="text-xl font-black text-green-500">10%</span>
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
            <h2 className="text-xl font-black text-ruah-950 uppercase tracking-tight mb-6">Módulo 4: Monitor de Produção</h2>
            <div className="space-y-6">
              {[
                { status: 'Processando', label: 'Validação de Especificações', icon: ShieldCheck, color: 'text-blue-500' },
                { status: 'Em Produção', label: 'Fulfillment Ativo (Parceiro)', icon: Activity, color: 'text-accent-gold' },
                { status: 'Controle de Qualidade', label: 'Inspeção Final do Lote', icon: TrendingUp, color: 'text-purple-500' },
                { status: 'Aguardando Despacho', label: 'Pronto para Logística', icon: Truck, color: 'text-green-500' }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-6 p-4 hover:bg-ruah-25 rounded-2xl transition-colors group">
                  <div className={`w-12 h-12 rounded-xl bg-opacity-10 flex items-center justify-center ${step.color.replace('text-', 'bg-')} ${step.color}`}>
                    <step.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ruah-400 mb-1">{step.status}</p>
                    <p className="text-sm font-bold text-ruah-950">{step.label}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-ruah-950">{Math.floor(dataVendasProducao.length * 5)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-ruah-950 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="text-accent-gold" size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">Insights Preditivos</span>
              </div>
              <h2 className="text-3xl font-serif italic font-black mb-6">
                Redução de 15% no lead time detectada.
              </h2>
              <p className="text-ruah-400 text-sm leading-relaxed mb-8">
                A integração entre o Módulo 1 e o Módulo 4 permitiu antecipar a demanda em 24h. O parceiro já iniciou o pré-aquecimento da produção.
              </p>
            </div>

            <button className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
              <span className="text-xs font-black uppercase tracking-widest">Otimizar Escala</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
