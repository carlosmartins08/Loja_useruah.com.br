'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Package, Hash, ArrowRight, User, QrCode, Camera } from 'lucide-react';
import Link from 'next/link';
import { ProductionTimeline, OrderStatus } from '@/components/commerce/ProductionTimeline';
import { AppImage } from '@/components/shared/AppImage';
import { useUser } from '@/context/UserContext';
import { ProfilePhotoModal } from '@/components/navigation/ProfilePhotoModal';

const MOCK_ORDERS = [
  {
    id: 'RUAH-001',
    date: '04 Mai, 2026',
    status: 'production' as OrderStatus,
    total: 'R$ 129,00',
    items: [
      { name: 'Camiseta Ruah Signature', spec: 'G | Algodao Penteado | Branco', image: 'https://picsum.photos/seed/ruah1/200/200' }
    ]
  },
  {
    id: 'RUAH-002',
    date: '20 Abr, 2026',
    status: 'shipped' as OrderStatus,
    total: 'R$ 249,00',
    items: [
      { name: 'Moletom Minimal Faith', spec: 'M | Moletom 3 cabos | Preto', image: 'https://picsum.photos/seed/ruah2/200/200' }
    ]
  }
];

export default function AccountPage() {
  const [selectedOrder, setSelectedOrder] = React.useState(MOCK_ORDERS[0]);
  const { profilePhoto, setProfilePhoto, userName, registrationStatus, userRole } = useUser();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);
  const roleLabel =
    userRole === 'customer'
      ? 'Painel do Cliente'
      : userRole === 'artist'
        ? 'Painel do Artista'
        : userRole === 'supplier'
          ? 'Painel do Fornecedor'
          : userRole === 'community_manager'
            ? 'Painel da Comunidade'
            : 'Painel da Conta';

  return (
    <main className="min-h-screen bg-ruah-50">
       <ProfilePhotoModal 
         isOpen={isPhotoModalOpen} 
         onClose={() => setIsPhotoModalOpen(false)} 
         onSave={(url) => setProfilePhoto(url)}
       />
       {/* Dashboard Header */}
       <section className="bg-ruah-950 text-white pt-12 pb-20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-gold/5 blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="section-container relative z-10">
             <div className="flex flex-col lg:flex-row justify-between items-end gap-12">
                <div className="flex items-center gap-10">
                   <div 
                     onClick={() => setIsPhotoModalOpen(true)}
                     className="w-32 h-32 rounded-[2.5rem] overflow-hidden relative group cursor-pointer border-2 border-white/10 hover:border-accent-gold transition-all"
                   >
                      {profilePhoto ? (
                        <AppImage context="content-banner" src={profilePhoto} alt={userName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                           <User size={40} className="text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                         <Camera size={24} className="text-white mb-1" />
                         <span className="text-xs font-semibold uppercase tracking-widest text-white">Alterar</span>
                      </div>
                   </div>
                   <div className="flex flex-col gap-6">
                      <span className="tech-label text-accent-gold whitespace-nowrap overflow-hidden">{roleLabel}</span>
                      <h1 className="text-6xl lg:text-8xl font-serif leading-none italic uppercase">OLA, {userName}.</h1>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-[0.4em]">Gestao de Pedidos e Conta Ruah</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <Link
                     href="/register"
                     className="flex items-center gap-2 px-6 py-4 bg-white text-ruah-950 rounded-2xl text-xs font-semibold uppercase tracking-[0.1em] hover:bg-accent-gold hover:text-white transition-all shadow-fancy"
                   >
                      Revisar Cadastro
                   </Link>
                </div>
             </div>
          </div>
       </section>

       <section className="py-24">
          <div className="section-container">
             {registrationStatus === 'incomplete' && (
               <div className="mb-10 rounded-3xl border border-amber-200 bg-amber-50 p-6 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Cadastro incompleto</span>
                  <p className="text-sm text-amber-900">
                    Finalize seus dados para liberar toda a jornada de compra e suporte sem bloqueios operacionais.
                  </p>
                  <Link href="/register" className="text-[11px] font-bold uppercase tracking-widest text-amber-800 underline">
                    Revisar cadastro agora
                  </Link>
               </div>
             )}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                
                {/* Sidebar - Orders List */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                   <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-300">Seus Pedidos Ativos</h3>
                   <div className="flex flex-col gap-4">
                      {MOCK_ORDERS.map((order) => (
                         <button 
                           key={order.id}
                           onClick={() => setSelectedOrder(order)}
                           className={`p-8 rounded-[2rem] border transition-all text-left group ${
                             selectedOrder.id === order.id 
                             ? 'bg-white border-accent-gold/30 shadow-fancy' 
                             : 'bg-white/50 border-ruah-100 hover:border-ruah-200'
                           }`}
                         >
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest leading-none mb-1">#{order.id}</span>
                                  <span className="text-xs font-serif italic text-ruah-950">{order.date}</span>
                               </div>
                               <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-md ${
                                 order.status === 'production' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                               }`}>
                                 {order.status === 'production' ? 'Em Producao' : 'Enviado'}
                               </span>
                            </div>
                            <div className="flex -space-x-4 mb-6">
                               {order.items.map((item, i) => (
                                 <div key={i} className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-ruah-50 relative shadow-sm">
                                    <AppImage context="content-banner" src={item.image} alt={item.name} fill className="object-cover" />
                                 </div>
                               ))}
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-xs font-bold text-ruah-950">{order.total}</span>
                               <ArrowRight size={16} className={`transition-transform ${selectedOrder.id === order.id ? 'translate-x-0 opacity-100 text-accent-gold' : '-translate-x-4 opacity-0'}`} />
                            </div>
                         </button>
                      ))}
                   </div>

                   <div className="mt-8 p-10 bg-ruah-950 rounded-[3rem] text-white flex flex-col gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/20 blur-3xl" />
                      <div className="flex flex-col gap-2">
                         <span className="tech-label text-accent-gold uppercase tracking-widest text-[8px] inline-block mb-1">Suporte Ruah</span>
                         <h4 className="text-2xl font-serif uppercase leading-tight italic">PRECISA DE <br /> AJUDA?</h4>
                      </div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest leading-relaxed">
                         Nossa equipe esta pronta para ajudar com sua campanha ou pedido personalizado.
                      </p>
                      <button className="bg-white text-ruah-950 w-full py-4 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-accent-gold hover:text-white transition-all">
                         Falar no WhatsApp
                      </button>
                   </div>
                </div>

                {/* Main Content - Order Details & Lifecycle */}
                <div className="lg:col-span-8 flex flex-col gap-12">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-ruah-100 pb-12">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                            <h2 className="text-4xl font-serif uppercase tracking-tighter italic">Detalhes do Pedido</h2>
                            <span className="tech-label text-accent-gold">#{selectedOrder.id}</span>
                         </div>
                         <p className="text-xs font-bold text-ruah-400 uppercase tracking-widest">
                            {selectedOrder.items.length} ITEM â€¢ TOTAL {selectedOrder.total}
                         </p>
                      </div>
                      <button className="flex items-center gap-3 px-6 py-4 bg-ruah-50 rounded-2xl text-xs font-semibold uppercase tracking-[0.1em] hover:bg-ruah-100 transition-all">
                         <QrCode size={18} className="text-accent-gold" /> Comprovante de Producao
                      </button>
                   </div>

                   {/* Production Lifecycle Timeline */}
                   <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                         <Package size={20} className="text-accent-gold" />
                         <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-950">Acompanhamento do Ciclo</h3>
                      </div>
                      <ProductionTimeline currentStatus={selectedOrder.status} />
                   </div>

                   {/* Items Drilldown */}
                   <div className="flex flex-col gap-8 mt-8">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-300">Especificacoes dos Produtos</h3>
                      <div className="flex flex-col gap-4">
                         {selectedOrder.items.map((item, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-8 p-10 bg-white border border-ruah-100 rounded-[2.5rem] group hover:border-accent-gold/30 transition-all">
                               <div className="relative w-full md:w-40 aspect-square rounded-2xl overflow-hidden bg-ruah-50 shadow-sm shrink-0">
                                  <AppImage context="content-banner" src={item.image} alt={item.name} fill className="object-cover" />
                               </div>
                               <div className="flex-1 flex flex-col justify-center gap-4">
                                  <div>
                                     <h4 className="text-2xl font-serif uppercase italic leading-tight mb-2">{item.name}</h4>
                                     <div className="flex items-center gap-2">
                                        <Hash size={12} className="text-accent-gold" />
                                        <span className="text-[10px] font-medium text-ruah-400 uppercase tracking-widest">{item.spec}</span>
                                     </div>
                                  </div>
                                  <div className="flex flex-wrap gap-4 mt-2">
                                     <div className="px-4 py-2 bg-ruah-50 rounded-lg">
                                        <span className="text-xs font-semibold text-ruah-300 uppercase block mb-1">Status Interno</span>
                                        <span className="text-[10px] font-bold uppercase text-accent-gold">Em Confeccao</span>
                                     </div>
                                     <div className="px-4 py-2 bg-ruah-50 rounded-lg">
                                        <span className="text-xs font-semibold text-ruah-300 uppercase block mb-1">Previsao Despacho</span>
                                        <span className="text-[10px] font-bold uppercase">12 Mai</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="flex flex-col justify-center">
                                  <Link 
                                    href={`/product/${i+1}`}
                                    className="w-12 h-12 rounded-full border border-ruah-100 flex items-center justify-center hover:bg-ruah-950 hover:text-white transition-all group/btn"
                                  >
                                     <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                  </Link>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                </div>
             </div>
          </div>
       </section>
    </main>
  );
}



