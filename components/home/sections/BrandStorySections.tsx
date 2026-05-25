
import { Plus } from 'lucide-react';
import Image from 'next/image';
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
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(196,164,132,0.08),transparent_50%)]" />
        <div className="section-container relative z-10">
          <div className="flex flex-col items-center text-center mb-24">
            <span className="tech-label text-accent-gold mb-6">Manifesto de Escolha</span>
            <h2 className="text-5xl lg:text-7xl text-white font-serif italic font-semibold uppercase tracking-tighter">Onde você <br /> respira?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {PERSONAS.map((persona) => (
              <div key={persona.name} className="flex flex-col bg-white/5 border border-white/10 p-10 rounded-[3rem] hover:border-accent-gold/40 transition-all group">
                <span className="text-5xl font-serif text-accent-gold italic font-black mb-6 opacity-30 group-hover:opacity-100 transition-opacity">{persona.icon}</span>
                <h3 className="text-white text-3xl font-serif uppercase italic font-black mb-4">{persona.name}</h3>
                <p className="text-white/70 text-sm font-medium leading-relaxed mb-10 flex-1">{persona.desc}</p>
                <Link href="/register" className="w-full py-4 text-center border border-white/20 rounded-2xl text-xs font-bold text-white uppercase tracking-[0.1em] group-hover:bg-accent-gold group-hover:border-accent-gold transition-all">
                  {persona.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space-lg">
        <div className="section-container">
          <div className="bg-ruah-50 rounded-[4rem] p-10 lg:p-32 flex flex-col lg:flex-row items-center gap-20 border border-ruah-100 shadow-fancy relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_90%_10%,rgba(196,164,132,0.1),transparent_50%)] pointer-events-none" />
            <div className="w-full lg:w-1/2 flex flex-col gap-10 relative z-10">
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
            <div className="w-full lg:w-1/2 relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
              <Image src="https://picsum.photos/seed/ruah-impact/1000/1000" alt="Qualidade Ruah" fill className="object-cover" />
              <div className="absolute inset-0 bg-ruah-950/10" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pb-32">
        <div className="bg-[#FAFAFA] rounded-[3rem] overflow-hidden flex flex-col lg:flex-row items-center p-8 lg:p-20 gap-16 border border-ruah-100">
          <div className="relative w-full lg:w-1/2 aspect-[4/3] rounded-[2.5rem] overflow-hidden" style={{ position: 'relative' }}>
            <Image src="https://picsum.photos/seed/ruah-editorial/1000/800" alt="Ruah Editorial" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="w-full lg:w-1/2">
            <span className="font-serif text-3xl mb-6 block uppercase tracking-tighter italic font-black text-ruah-950">UseRuah.</span>
            <h2 className="text-4xl lg:text-6xl font-serif tracking-tight leading-none mb-10 uppercase font-black">
              Vista o <br /> Seu Sopro.
            </h2>
            <p className="text-lg text-ruah-500 mb-12 max-w-md leading-relaxed">
              Moda cristã que vai além do vestuário. Conectamos sua fé com o design, criando peças que comunicam os valores do Reino.
            </p>
            <Link href="/shop" className="bg-ruah-950 text-white rounded-full px-12 py-5 font-bold uppercase text-xs tracking-[0.2em] hover:bg-accent-gold transition-all active:scale-95 shadow-xl shadow-ruah-950/10">
              Começar Jornada
            </Link>
          </div>
        </div>
      </section>

      <section className="section-container pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="flex flex-col gap-8">
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
          <div className="relative aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl">
            <Image src="https://picsum.photos/seed/ruah-manifesto/1000/600" alt="Comunidade Ruah" fill className="object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-ruah-950/20" />
            <div className="absolute bottom-10 left-10">
              <span className="text-white text-3xl font-serif italic font-semibold uppercase tracking-tighter">Arte & Missão.</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}




