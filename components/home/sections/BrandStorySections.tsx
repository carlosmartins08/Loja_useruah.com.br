
import { Plus } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';

const PERSONAS = [
  { name: 'Alma', desc: 'Compro para manifestar minha identidade cristã com estilo.', icon: '01', cta: 'Sou Consumidor' },
  { name: 'Farol', desc: 'Lidero um grupo e quero produtos que conectem nossa missão.', icon: '02', cta: 'Sou Líder' },
  { name: 'Sopro', desc: 'Crio artes e quero comercializar minha fé em nossa rede.', icon: '03', cta: 'Sou Artista' },
];

export function BrandStorySections() {
  return (
    <>
      <section className="bg-ruah-950 section-space relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(196,164,132,0.08),transparent_50%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_45%)]" />
        <div className="section-container relative z-10">
          <div className="layout-grid-media gap-12 lg:gap-16 items-end mb-20">
            <div className="lg:col-span-6 flex flex-col gap-6">
              <span className="tech-label text-accent-gold">Manifesto de Escolha</span>
              <h2 className="ur-type-display-lg text-white font-serif italic font-semibold uppercase tracking-tighter">Onde você <br /> respira?</h2>
              <p className="max-w-xl text-sm font-medium leading-relaxed text-white/65">
                A marca precisa acolher diferentes intenções sem perder forma. Estes três caminhos dão leitura imediata de quem entra e do que pode fazer aqui.
              </p>
            </div>
            <div className="lg:col-span-6 rounded-[2.75rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm shadow-fancy">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-3xl font-serif italic font-black text-white">3</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Portas de entrada</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-3xl font-serif italic font-black text-white">1</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">DNA de marca</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-3xl font-serif italic font-black text-white">Ruah</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Mesmo idioma visual</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {PERSONAS.map((persona) => (
              <div key={persona.name} className="flex flex-col bg-white/5 border border-white/10 p-10 rounded-[3rem] hover:border-accent-gold/40 transition-all group shadow-fancy backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(197,160,89,0.16),transparent_28%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 text-5xl font-serif text-accent-gold italic font-black mb-6 opacity-30 group-hover:opacity-100 transition-opacity">{persona.icon}</span>
                <h3 className="text-white text-3xl font-serif uppercase italic font-black mb-4">{persona.name}</h3>
                <p className="text-white/70 text-sm font-medium leading-relaxed mb-10 flex-1">{persona.desc}</p>
                <Link href="/register" className="relative z-10 w-full py-4 text-center border border-white/20 rounded-2xl text-xs font-bold text-white uppercase tracking-[0.1em] group-hover:bg-accent-gold group-hover:border-accent-gold transition-all">
                  {persona.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space-lg">
        <div className="section-container">
          <div className="bg-ruah-50 rounded-[4rem] p-10 lg:p-20 border border-ruah-100 shadow-fancy relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_90%_10%,rgba(196,164,132,0.1),transparent_50%)] pointer-events-none" />
            <div className="layout-grid-media gap-14 lg:gap-16 items-center">
              <div className="lg:col-span-5 flex flex-col gap-10 relative z-10">
                <span className="tech-label text-accent-gold">Impacto Ruah</span>
                <h2 className="text-5xl lg:text-7xl font-serif font-black italic uppercase leading-[0.85] tracking-tighter">O Sopro da <br /> Criação.</h2>
                <div className="flex flex-col gap-6">
                  <p className="text-base font-medium text-ruah-500 leading-relaxed">
                    O Projeto Ruah é uma iniciativa que transforma orações em arte. Cada produto carrega a essência de uma conexão profunda com o Criador, apoiando comunidades e evangelização em todo o Brasil.
                  </p>
                  <div className="grid grid-cols-2 gap-8 mt-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-3xl font-serif italic font-black text-ruah-950">100%</span>
                      <span className="text-xs font-semibold text-ruah-400 uppercase tracking-[0.1em]">Genuinamente Brasileiro</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-3xl font-serif italic font-black text-ruah-950">Curadoria</span>
                      <span className="text-xs font-semibold text-ruah-400 uppercase tracking-[0.1em]">Arte & Espiritualidade</span>
                    </div>
                  </div>
                </div>
                <Link href="/quem-somos" className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.1em] text-accent-gold border-b border-accent-gold/20 pb-1 self-start">
                  Saiba Como Ajudamos Missões <Plus size={14} />
                </Link>
              </div>

              <div className="lg:col-span-7 relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                <AppImage context="content-banner" src="/assets/editorial/impact-studio.svg" alt="Qualidade Ruah" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ruah-950/35 via-transparent to-transparent" />
                <div className="absolute left-8 right-8 bottom-8 flex items-end justify-between gap-6">
                  <div className="rounded-full bg-white/90 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ruah-950">
                    Missão em movimento
                  </div>
                  <div className="rounded-[2rem] border border-white/20 bg-ruah-950/70 px-5 py-4 backdrop-blur-sm">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">Impacto</span>
                    <span className="block mt-1 text-2xl font-serif italic text-white">Arte com direção</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pb-32">
        <div className="bg-[#FAFAFA] rounded-[3rem] overflow-hidden p-8 lg:p-16 border border-ruah-100 shadow-subtle relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_16%,rgba(197,160,89,0.1),transparent_28%)] pointer-events-none" />
          <div className="layout-grid-media gap-14 lg:gap-16 items-center relative z-10">
            <div className="lg:col-span-7 relative aspect-[4/3] rounded-[2.5rem] overflow-hidden" style={{ position: 'relative' }}>
              <AppImage context="content-banner" src="/assets/editorial/editorial-atelier.svg" alt="Ruah Editorial" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ruah-950/35 via-transparent to-transparent" />
              <div className="absolute left-8 bottom-8 rounded-full bg-white/90 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ruah-950">
                Editorial Ruah
              </div>
            </div>
            <div className="lg:col-span-5">
              <span className="font-serif text-3xl mb-6 block uppercase tracking-tighter italic font-black text-ruah-950">UseRuah.</span>
              <h2 className="text-4xl lg:text-6xl font-serif tracking-tight leading-none mb-10 uppercase font-black">
                Vista o <br /> Seu Sopro.
              </h2>
              <p className="text-lg text-ruah-500 mb-12 max-w-md leading-relaxed">
                Moda cristã que vai além do vestuário. Conectamos sua fé com o design, criando peças que comunicam os valores do Reino.
              </p>
              <div className="mb-10 grid grid-cols-2 gap-4">
                <div className="rounded-[1.75rem] border border-ruah-100 bg-white p-5 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Moda</span>
                  <span className="mt-2 block text-xl font-serif italic text-ruah-950">Com intenção</span>
                </div>
                <div className="rounded-[1.75rem] border border-ruah-100 bg-white p-5 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Mensagem</span>
                  <span className="mt-2 block text-xl font-serif italic text-ruah-950">Com forma</span>
                </div>
              </div>
              <Link href="/shop" className="bg-ruah-950 text-white rounded-full px-12 py-5 font-bold uppercase text-xs tracking-[0.2em] hover:bg-accent-gold transition-all active:scale-95 shadow-xl shadow-ruah-950/10">
                Começar Jornada
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pb-32">
        <div className="layout-grid-media gap-14 lg:gap-20 items-center">
          <div className="lg:col-span-5 flex flex-col gap-8">
            <span className="tech-label text-accent-gold">Nossa Identidade</span>
            <h2 className="text-5xl font-serif tracking-tight leading-tight uppercase font-black">CADA ORAÇÃO <br /> É ÚNICA, ASSIM <br /> COMO VOCÊ.</h2>
            <div className="flex flex-col gap-6 text-ruah-500 font-medium text-sm leading-relaxed">
              <p>O Ruah nasceu para manifestar a beleza de Deus através do design. Acreditamos que a vestimenta pode ser um canal de evangelização silenciosa e poderosa.</p>
              <p>Unimos artistas e designers que respiram a Palavra para criar estampas que contam histórias de fé, esperança e caridade, conectando pessoas ao sagrado no dia a dia.</p>
              <Link href="/quem-somos" className="text-accent-gold font-bold border-b border-accent-gold/30 inline-block pb-1 mt-4 self-start">
                Descubra Nossa Origem
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7 relative aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl">
            <AppImage context="content-banner" src="/assets/editorial/community-manifesto.svg" alt="Comunidade Ruah" fill className="object-cover" />
            <div className="absolute inset-0 bg-ruah-950/20" />
            <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between gap-6">
              <span className="text-white text-3xl font-serif italic font-semibold uppercase tracking-tighter">Arte & Missão.</span>
              <div className="rounded-[2rem] border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Essência</span>
                <span className="mt-1 block text-xl font-serif italic text-white">Fé com linguagem visual</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}





