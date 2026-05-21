import { HOME_TESTIMONIALS } from '@/components/home/home-data';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';

interface TestimonialsSectionProps {
  activeTestimonial: number;
  onNext: () => void;
  onPrev: () => void;
}

export function TestimonialsSection({ activeTestimonial, onNext, onPrev }: TestimonialsSectionProps) {
  return (
    <section className="section-space bg-white">
      <div className="section-container">
        <div className="flex flex-col items-center text-center mb-20">
          <span className="tech-label text-accent-gold mb-6">Sopro da Comunidade</span>
          <h2 className="text-5xl lg:text-7xl font-serif italic font-black uppercase tracking-tighter text-ruah-950">
            Vozes que <br /> Respiram F?.
          </h2>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-1/2 relative">
              <div className="absolute -top-10 -left-10 text-ruah-50 hidden lg:block">
                <Quote size={200} strokeWidth={1} />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: 'circOut' }}
                  className="relative z-10"
                >
                  <p className="text-2xl lg:text-4xl font-serif italic font-black text-ruah-950 leading-tight mb-12">
                    &quot;{HOME_TESTIMONIALS[activeTestimonial].quote}&quot;
                  </p>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold uppercase tracking-[0.3em] text-ruah-950">{HOME_TESTIMONIALS[activeTestimonial].name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent-gold">{HOME_TESTIMONIALS[activeTestimonial].city}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-64 lg:w-80 aspect-square">
                <div className="absolute inset-0 bg-accent-gold/10 rounded-full blur-3xl" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-full rounded-full overflow-hidden border-8 border-white shadow-2xl"
                  >
                    <Image src={HOME_TESTIMONIALS[activeTestimonial].image} alt={HOME_TESTIMONIALS[activeTestimonial].name} fill className="object-cover" />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-ruah-950 p-2 rounded-full shadow-xl">
                  <button onClick={onPrev} className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-accent-gold transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex gap-2">
                    {HOME_TESTIMONIALS.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${activeTestimonial === i ? 'bg-accent-gold w-4' : 'bg-white/30'}`} />
                    ))}
                  </div>
                  <button onClick={onNext} className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-accent-gold transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
