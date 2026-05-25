import { HOME_FAQ } from '@/components/home/home-data';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';

interface HomeFaqSectionProps {
  openFaq: number | null;
  onToggle: (idx: number) => void;
}

export function HomeFaqSection({ openFaq, onToggle }: HomeFaqSectionProps) {
  return (
    <section className="section-space bg-ruah-50 border-t border-ruah-100">
      <div className="section-container">
        <div className="flex flex-col lg:flex-row gap-20">
          <div className="lg:w-1/3 flex flex-col gap-8">
            <span className="tech-label text-accent-gold px-4 py-2 border border-accent-gold/20 rounded-full self-start">FAQ Estratégico</span>
            <h2 className="text-5xl lg:text-7xl font-serif italic font-semibold uppercase tracking-tighter leading-none text-ruah-950">
              O Sopro <br /> das Dúvidas.
            </h2>
            <p className="text-[11px] font-bold text-ruah-300 uppercase tracking-[0.2em] leading-relaxed max-w-xs">
              Tudo o que você precisa entender sobre como transformamos sua oração em um movimento de arte.
            </p>
            <Link href="/help-center" className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.1em] text-accent-gold group">
              Ver Central Completa <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="lg:w-2/3 flex flex-col gap-4">
            {HOME_FAQ.map((item, i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-ruah-100 overflow-hidden transition-all hover:border-accent-gold/30">
                <button onClick={() => onToggle(i)} className="w-full p-8 flex items-center justify-between text-left">
                  <span className="text-xl font-serif italic font-semibold uppercase tracking-tighter text-ruah-950">{item.q}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${openFaq === i ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-200'}`}>
                    <ChevronDown size={20} className={`transition-transform duration-500 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'circOut' }}
                    >
                      <div className="px-8 pb-8">
                        <div className="h-px bg-ruah-50 mb-8" />
                        <p className="text-xs text-ruah-400 font-bold uppercase tracking-[0.1em] leading-loose">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



