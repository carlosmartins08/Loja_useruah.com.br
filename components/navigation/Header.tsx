'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, User, Menu, X, Bell, ChevronDown, ArrowRight, Sparkles, Globe, MessageSquare, Package, Camera, Plus } from 'lucide-react';
import Link from 'next/link';
import { AppImage } from '@/components/shared/AppImage';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { SearchOverlay } from './SearchOverlay';
import { VirtualAssistant } from '@/components/ai/VirtualAssistant';
import { ProfilePhotoModal } from './ProfilePhotoModal';
import { resolveHomeByRole } from '@/lib/access-routing';
import { ROLE_LABEL, sortRolesForUi } from '@/lib/role-scope';

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = React.useState(false);
  const [isProfilePhotoModalOpen, setIsProfilePhotoModalOpen] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<'category' | 'corporate'>('category');
  const { setIsCartOpen, cart, location } = useCart();
  const { profilePhoto, setProfilePhoto, userRole, userRoles, switchActiveRole, isAuthenticated } = useUser();
  const accountHref = resolveHomeByRole(userRole);
  const sortedRoles = React.useMemo(() => sortRolesForUi(userRoles), [userRoles]);
  
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      id="main-header"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
    >
      <div className={`hidden md:block bg-ruah-950 text-white py-2 transition-all duration-500 overflow-hidden ${isScrolled ? 'h-0 py-0 opacity-0' : 'h-9 opacity-100'}`}>
         <div className="section-container flex justify-between items-center h-full">
            <div className="flex items-center gap-6">
               <span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-60">UseRuah / Brasil</span>
               <span className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-gold">Frete Grátis acima de R$ 200</span>
            </div>
            <div className="flex items-center gap-6">
               <Link href="/journal" className="text-xs font-semibold uppercase tracking-[0.08em] opacity-70 hover:opacity-100 transition-opacity">Journal</Link>
               <Link href="/help-center" className="text-xs font-semibold uppercase tracking-[0.08em] opacity-70 hover:opacity-100 transition-opacity">Ajuda</Link>
               <Link href="/policies" className="text-xs font-semibold uppercase tracking-[0.08em] opacity-70 hover:opacity-100 transition-opacity">Logística</Link>
               <div className="h-3 w-px bg-white/10" />
               <div className="flex items-center gap-2 opacity-60">
                  <Globe size={10} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">{location.region}</span>
               </div>
            </div>
         </div>
      </div>

      <div className={`transition-all duration-700 ${
        isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-ruah-100 py-2 md:py-3 shadow-glass' : 'bg-white/85 backdrop-blur-lg py-4 md:py-8'
      }`}>
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <VirtualAssistant isOpen={isAiAssistantOpen} onClose={() => setIsAiAssistantOpen(false)} />
        <ProfilePhotoModal 
          isOpen={isProfilePhotoModalOpen} 
          onClose={() => setIsProfilePhotoModalOpen(false)} 
          onSave={(url) => setProfilePhoto(url)}
        />
        <div className="section-container">
          <div className="flex items-center justify-between gap-8 relative">
            {/* Mobile Menu Icon */}
            <button 
              className="p-2 hover:bg-ruah-950 hover:text-white rounded-full transition-all md:hidden" 
              onClick={() => setIsMobileMenuOpen(true)}
              id="btn-mobile-menu"
            >
              <Menu size={20} />
            </button>

            {/* Left Nav (Desktop) */}
            <nav className="hidden md:flex items-center gap-10 flex-1">
                <div className="relative group">
                   <motion.div 
                     whileHover={{ y: -2 }}
                     className="flex items-center gap-2 cursor-pointer py-2 px-4 rounded-full hover:bg-ruah-50 group-hover:text-accent-gold transition-all duration-300"
                   >
                      <span className="text-xs font-semibold uppercase tracking-[0.1em]">Sopro Ruah</span>
                      <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-500" />
                   </motion.div>
                  
                  {/* Mega Menu */}
                  <div className="absolute top-full left-0 pt-6 opacity-0 translate-y-8 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-700 z-50">
                     <div className="bg-white border border-ruah-100 shadow-fancy rounded-[3rem] p-12 w-[800px] grid grid-cols-12 gap-12">
                        <div className="col-span-4 pr-8 border-r border-ruah-50">
                           <h4 className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.2em] mb-8 bg-accent-gold/5 py-1 px-4 rounded-full inline-block">Conectar</h4>
                           <ul className="space-y-5">
                              {[
                                { label: 'Comunidade Ruah', href: '/shop' },
                                { label: 'Artistas do Reino', href: '/shop' },
                                { label: 'Grupos & Pastorais', href: '/shop' },
                                { label: 'Coleções Autorais', href: '/shop' }
                              ].map(item => (
                                <li key={item.label} className="group/item">
                                   <Link href={item.href} className="flex items-center justify-between group-hover/item:text-accent-gold transition-colors">
                                      <span className="text-sm font-serif italic text-ruah-950">{item.label}</span>
                                      <ArrowRight size={14} className="opacity-0 -translate-x-4 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all text-accent-gold" />
                                   </Link>
                                </li>
                              ))}
                           </ul>
                        </div>
                        <div className="col-span-4 pr-8 border-r border-ruah-50">
                           <h4 className="text-[10px] font-bold text-ruah-300 uppercase tracking-[0.2em] mb-8">Vestir</h4>
                           <ul className="space-y-4">
                              {['Camisetas', 'Moletons', 'Acessórios', 'Gift Cards'].map(cat => (
                                <li key={cat}>
                                   <Link href="/shop" className="text-sm font-serif italic text-ruah-950 hover:text-accent-gold transition-colors">{cat}</Link>
                                </li>
                              ))}
                           </ul>
                        </div>
                        <div className="col-span-4">
                           <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden group/img">
                              <AppImage context="content-banner" src="https://picsum.photos/seed/ruah-menu-1/400/500" alt="Respiro" fill className="object-cover group-hover/img:scale-110 transition-all duration-1000" />
                              <div className="absolute inset-0 bg-gradient-to-t from-ruah-950/80 to-transparent flex flex-col justify-end p-6">
                                 <span className="text-white text-[11px] font-serif italic font-black uppercase mb-1">Inspirar.</span>
                                 <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest leading-relaxed">Conheça nosso Manifesto e as histórias por trás das peças.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <motion.div whileHover={{ y: -2 }}>
                  <Link href="/shop" className="group flex items-center gap-2 py-2 px-4 rounded-full hover:bg-ruah-50 transition-all duration-300">
                     <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-950 group-hover:text-accent-gold transition-colors">Artistas</span>
                     <div className="w-1 h-1 rounded-full bg-accent-gold animate-pulse" />
                  </Link>
               </motion.div>
               <motion.div whileHover={{ y: -2 }}>
                  <Link href="/journal" className="py-2 px-4 rounded-full hover:bg-ruah-50 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-950 hover:text-accent-gold transition-all duration-300">Journal</Link>
               </motion.div>
            </nav>

            {/* Logo (Centered on Desktop) */}
            <Link href="/" className="md:absolute md:left-1/2 md:-translate-x-1/2 group" id="logo-link">
               <AppImage context="content-banner"
                 src="/brand/SVG/logo-wordmark-dark.svg"
                 alt="UseRuah"
                 width={220}
                 height={58}
                 priority
                 className="h-7 md:h-9 w-auto"
               />
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-4 flex-1 justify-end" id="header-actions">
               {isAuthenticated && (
                 <div className="hidden md:flex items-center gap-2 mr-2">
                   <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ruah-400">Papel</span>
                   {sortedRoles.length > 1 ? (
                     <select
                       value={userRole}
                       onChange={(event) => {
                         void switchActiveRole(event.target.value as typeof userRole);
                       }}
                       className="h-8 rounded-full border border-ruah-100 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-950"
                     >
                       {sortedRoles.map((role) => (
                         <option key={role} value={role}>
                           {ROLE_LABEL[role] ?? role}
                         </option>
                       ))}
                     </select>
                   ) : (
                     <span className="rounded-full border border-ruah-100 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-950">
                       {ROLE_LABEL[userRole] ?? userRole}
                     </span>
                   )}
                 </div>
               )}
               <button 
                 onClick={() => setIsAiAssistantOpen(true)}
                 data-ai-trigger="true"
                 className="hidden lg:flex items-center gap-2 px-4 py-2 border border-ruah-100 rounded-full group hover:bg-ruah-950 hover:text-white transition-all mr-2"
               >
                  <Sparkles size={10} className="text-accent-gold" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-950 group-hover:text-white">Estilo AI</span>
               </button>
               <button 
                 onClick={() => setIsSearchOpen(true)}
                 className="p-2 hover:bg-ruah-50 rounded-full transition-colors" 
                 id="btn-search"
               >
                 <Search size={18} className="text-ruah-800" />
               </button>
               <Link href={accountHref} className="p-1 hover:bg-ruah-50 rounded-full transition-colors relative group/user" id="btn-account">
                 <div className="w-8 h-8 rounded-full overflow-hidden relative border border-ruah-100 group-hover/user:border-accent-gold transition-colors">
                    {profilePhoto ? (
                      <AppImage context="content-banner" src={profilePhoto} alt="User Profile" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-ruah-50 flex items-center justify-center">
                        <User size={16} className="text-ruah-800" />
                      </div>
                    )}
                 </div>
                 <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white" />
               </Link>
               <Link href="/register" className="hidden lg:flex items-center gap-2 px-6 py-2.5 bg-ruah-950 text-white rounded-full group hover:bg-accent-gold transition-all ml-2 shadow-fancy border border-transparent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse group-hover:bg-white" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">MANIFESTO RUAH</span>
               </Link>

               <button 
                 onClick={() => setIsCartOpen(true)}
                 className="p-2 hover:bg-ruah-50 rounded-full transition-colors relative" 
                 id="btn-cart"
               >
                 <ShoppingBag size={18} className="text-ruah-800" />
                 {cartItemCount > 0 && (
                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-gold text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                     {cartItemCount}
                   </span>
                 )}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ruah-950/80 backdrop-blur-sm z-[60] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-[85%] max-w-md h-full bg-white flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-10 flex justify-between items-center border-b border-ruah-50">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <AppImage context="content-banner"
                    src="/brand/SVG/logo-wordmark-dark.svg"
                    alt="UseRuah"
                    width={180}
                    height={48}
                    className="h-8 w-auto"
                  />
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-ruah-50 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex p-2 bg-ruah-50 mx-8 mt-8 rounded-2xl">
                 <button 
                  onClick={() => setMobileTab('category')}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mobileTab === 'category' ? 'bg-white shadow-sm text-ruah-950' : 'text-ruah-400'}`}
                 >
                    Shop
                 </button>
                 <button 
                  onClick={() => setMobileTab('corporate')}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mobileTab === 'corporate' ? 'bg-white shadow-sm text-ruah-950' : 'text-ruah-400'}`}
                 >
                    Sobre Nós
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-10 py-12">
                <AnimatePresence mode="wait">
                  {mobileTab === 'category' ? (
                    <motion.nav 
                      key="cats"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.08,
                            delayChildren: 0.1
                          }
                        }
                      }}
                      className="flex flex-col gap-10"
                    >
                      {[
                        { label: 'Novidades', href: '/shop' },
                        { label: 'Autoral', href: '/category/autoral' },
                        { label: 'Grupos', href: '/category/grupos' },
                        { label: 'Artistas', href: '/category/artistas' },
                        { label: 'Acessórios', href: '/category/acessorios' }
                      ].map((item) => (
                        <motion.div
                          key={item.label}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          <Link 
                            href={item.href} 
                            className="flex items-center justify-between group"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="text-2xl font-serif italic text-ruah-950">{item.label}</span>
                            <ArrowRight size={20} className="text-accent-gold" />
                          </Link>
                        </motion.div>
                      ))}
                    </motion.nav>
                  ) : (
                    <motion.nav 
                      key="corp"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.08,
                            delayChildren: 0.1
                          }
                        }
                      }}
                      className="flex flex-col gap-8"
                    >
                      {[
                        { label: 'Nosso Journal', href: '/journal' },
                        { label: 'Ajuda e Suporte', href: '/help-center' },
                        { label: 'Rastrear Pedido', href: '/account/orders' },
                        { label: 'Políticas de Amor', href: '/policies' }
                      ].map((item) => (
                        <motion.div
                          key={item.label}
                          variants={{
                            hidden: { opacity: 0, y: 15 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          <Link 
                            href={item.href} 
                            className="text-xs font-bold uppercase tracking-[0.2em] text-ruah-400"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.nav>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-10 border-t border-ruah-50 mt-auto bg-ruah-50/50">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isMobileMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-6"
                >
                   <Link 
                     href="/help-center" 
                     className="flex items-center gap-4 group"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                      <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center text-white">
                         <MessageSquare size={18} />
                      </div>
                      <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest block text-ruah-950">Concierge</span>
                         <span className="text-[9px] font-medium uppercase tracking-widest text-ruah-400">WhatsApp Oficial</span>
                      </div>
                   </Link>
                   <Link 
                     href="/account/orders" 
                     className="flex items-center gap-4 group"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                      <div className="w-10 h-10 bg-ruah-950 rounded-xl flex items-center justify-center text-white">
                         <Package size={18} />
                      </div>
                      <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest block text-ruah-950">Logística</span>
                         <span className="text-[9px] font-medium uppercase tracking-widest text-ruah-400">Rastrear Pedido</span>
                      </div>
                   </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}




