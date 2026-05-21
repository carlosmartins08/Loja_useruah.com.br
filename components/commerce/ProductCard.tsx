'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Heart, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  badge?: string;
}

export function ProductCard({ id, name, category, price, image, badge }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id,
      name,
      price,
      image,
      quantity: 1,
      category,
      productionDays: 3
    });
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link href={`/product/${id}`} className="block relative aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-6 bg-ruah-50 shadow-subtle group-hover:shadow-xl transition-all duration-700" style={{ position: 'relative' }}>
        {badge && (
          <div className="absolute top-6 left-6 z-20">
            <span className="px-4 py-1.5 bg-accent-gold text-white text-[8px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg">
              {badge}
            </span>
          </div>
        )}
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:opacity-0"
          referrerPolicy="no-referrer"
        />
        <Image
          src={`https://picsum.photos/seed/alt-${id}/800/1200`}
          alt={`${name} detail`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-all duration-1000 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-100"
          referrerPolicy="no-referrer"
        />
        
        {/* Hover Actions */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 z-10">
           <motion.button 
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={handleAddToCart}
             className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 relative overflow-hidden ${
               isAdded 
               ? 'bg-green-500 text-white' 
               : 'bg-gradient-to-br from-white via-white to-ruah-50 hover:from-accent-gold hover:to-orange-400 group/btn'
             }`}
           >
              <AnimatePresence mode="wait">
                {isAdded ? (
                  <motion.div 
                    key="checked"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={20} className="relative z-10" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="plus"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 1.25 }}
                  >
                    <Plus 
                      size={20} 
                      className="relative z-10 text-ruah-950 transition-colors duration-300 group-hover/btn:text-white" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
           </motion.button>
           <button 
             onClick={toggleFavorite}
             className={`w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isFavorite ? 'text-red-500' : 'hover:text-red-500'}`}
           >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
           </button>
        </div>

        <div className="absolute bottom-6 left-6 z-10">
          <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-[8px] font-bold uppercase tracking-widest text-ruah-950 rounded-full border border-white/20">
            Ver Detalhes
          </span>
        </div>
      </Link>

      <div className="px-2">
        <div className="flex justify-between items-start mb-4 uppercase">
          <Link href={`/product/${id}`} className="block">
            <h3 className="font-bold text-base text-ruah-950 group-hover:text-accent-gold transition-colors tracking-tight">
              {name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-orange-400">
             <Star size={10} fill="currentColor" />
             <Star size={10} fill="currentColor" />
             <Star size={10} fill="currentColor" />
             <Star size={10} fill="currentColor" />
             <Star size={10} fill="currentColor" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <span className="font-mono text-sm font-bold text-accent-gold">R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             <span className="text-[10px] text-ruah-300 font-bold tracking-widest line-through">R$ {(price * 1.2).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
           </div>
           
           <motion.button 
             onClick={handleAddToCart}
             whileTap={{ scale: 0.95 }}
             className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
               isAdded 
               ? 'bg-green-500 text-white' 
               : 'bg-ruah-25 text-ruah-950 hover:bg-ruah-950 hover:text-white border border-ruah-100'
             }`}
           >
             <AnimatePresence mode="wait">
               {isAdded ? (
                 <motion.div 
                   key="added" 
                   initial={{ opacity: 0, x: 5 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, x: -5 }}
                   className="flex items-center gap-2"
                 >
                   <Check size={12} />
                   <span>Adicionado</span>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="add" 
                   initial={{ opacity: 0, x: -5 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, x: 5 }}
                   className="flex items-center gap-2"
                 >
                   <Plus size={12} />
                   <span>Adicionar à Sacola</span>
                 </motion.div>
               )}
             </AnimatePresence>
           </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
