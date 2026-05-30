
import { ArrowRight } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';

export function AiCreatorSection() {
  return (
    <section className="section-space bg-white">
      <div className="section-container">
        <div className="layout-grid-feature">
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="decor-gold-line" />
              <span className="tech-label text-accent-gold">Ruah Lab AI</span>
            </div>
            <h2 className="ur-type-display-md italic uppercase">
              Sua Fé <br /> em Código <br /> Criativo.
            </h2>
            <p className="text-[12px] font-bold text-ruah-400 leading-relaxed max-w-xs tracking-[0.1em] uppercase mb-4">
              Nossa IA entende sua missão. Selecione seu grupo ou pastoral e deixe a tecnologia desenhar o sopro que falta.
            </p>
            <Link href="/shop" className="flex items-center gap-4 group">
              <div className="w-14 h-14 bg-ruah-950 text-white rounded-full flex items-center justify-center group-hover:bg-accent-gold transition-colors">
                <ArrowRight size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.1em] group-hover:text-accent-gold transition-colors">Abrir Estúdio AI</span>
            </Link>
          </div>
          <div className="lg:col-span-6 relative aspect-square lg:aspect-video rounded-[3rem] overflow-hidden bg-ruah-50 border border-ruah-100 flex items-center justify-center group">
            <AppImage
              context="hero"
              src="https://picsum.photos/seed/ruah-ai-lab/1200/800"
              alt="AI Laboratory"
              fill
              className="object-cover opacity-80 group-hover:scale-[1.05] transition-transform motion-slow grayscale hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-ruah-950/20 to-transparent" />
            <div className="relative z-10 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 max-w-sm">
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-accent-gold pulse-soft" style={{ animationDelay: `${i * 300}ms` }} />
                ))}
              </div>
              <p className="text-white text-[11px] font-bold leading-relaxed tracking-[0.1em] uppercase">
                &quot;Gerando estampa para: <span className="text-accent-gold italic">Coroinhas São José</span>. Aplicando técnica de gravura em tecido algodão 30.1...&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



