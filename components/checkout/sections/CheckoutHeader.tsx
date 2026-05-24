import { ChevronLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export function CheckoutHeader() {
  return (
    <header className="bg-white border-b border-ruah-100 py-8">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link href="/shop" className="flex items-center gap-2 group">
          <ChevronLeft size={16} className="text-ruah-300 group-hover:text-ruah-950 transition-colors" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-ruah-300 group-hover:text-ruah-950 transition-colors">Voltar</span>
        </Link>
        <Link href="/" className="text-2xl font-serif font-black tracking-tighter text-ruah-950 italic">UseRuah</Link>
        <div className="flex items-center gap-2 text-green-600">
          <Lock size={14} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Ambiente Seguro</span>
        </div>
      </div>
    </header>
  );
}
