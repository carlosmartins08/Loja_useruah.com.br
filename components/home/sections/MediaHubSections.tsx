import { BookOpen, LayoutGrid, Music } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';

const EDITORIAL_NOTES = [
  { title: 'Silêncio', subtitle: 'Base limpa e contemplativa', index: '01' },
  { title: 'Contraste', subtitle: 'Tipografia e mensagem em tensão', index: '02' },
  { title: 'Presença', subtitle: 'Peças feitas para uso recorrente', index: '03' },
];

const VISUAL_ASSETS = [
  '/assets/editorial/ugc-01.svg',
  '/assets/editorial/ugc-02.svg',
  '/assets/editorial/ugc-03.svg',
  '/assets/editorial/ugc-02.svg',
  '/assets/editorial/ugc-01.svg',
];

export function MediaHubSections() {
  return (
    <>
      <section className="bg-ruah-50 section-space border-y border-ruah-100">
        <div className="section-container">
          <div className="layout-grid-media gap-12 lg:gap-16 items-end mb-16">
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <LayoutGrid size={20} className="text-accent-gold" />
                <span className="tech-label text-accent-gold">Painel visual</span>
              </div>
              <h2 className="text-4xl font-serif lowercase italic tracking-tighter font-semibold uppercase text-ruah-950">Ruah em recortes.</h2>
              <p className="text-xs font-bold text-ruah-400 uppercase tracking-[0.1em] leading-loose max-w-xs">
                Em vez de simular comunidade ativa ou UGC real, este bloco assume o que é: um mosaico editorial da atmosfera da marca.
              </p>
            </div>

            <div className="lg:col-span-8 rounded-[2.75rem] border border-ruah-100 bg-white/80 p-8 shadow-subtle">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">5</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Quadros editoriais</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">1</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Linguagem visual</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">Catálogo</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Leitura antes da compra</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className={`relative overflow-hidden group shadow-subtle ${index === 1 || index === 4 ? 'rounded-[2.5rem] aspect-[4/5]' : 'rounded-[2rem] aspect-square'}`}>
                <AppImage context="product-thumb" src={VISUAL_ASSETS[index - 1]} alt="Recorte editorial UseRuah" fill className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-ruah-950/55 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
                <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Editorial</span>
                    <span className="text-sm font-serif italic text-white">#UseRuah</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <LayoutGrid size={18} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container">
          <div className="layout-grid-media gap-12 lg:gap-16">
            <div className="lg:col-span-4 flex flex-col gap-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-accent-gold" size={24} />
                  <span className="tech-label text-ruah-300">Journal Ruah</span>
                </div>
                <h3 className="ur-type-display-lg italic uppercase text-ruah-950">
                  Bastidores <br /> do catálogo.
                </h3>
              </div>

              <p className="text-[12px] font-bold text-ruah-400 uppercase tracking-[0.1em] leading-loose max-w-sm">
                Em vez de apontar para um canal externo inexistente, a marca concentra aqui a leitura editorial que ajuda a entender processo, autoria e direção visual.
              </p>

              <div className="rounded-[2rem] border border-ruah-100 bg-ruah-50 p-6 shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">Leitura da semana</span>
                <p className="mt-3 text-sm font-medium leading-relaxed text-ruah-500">
                  Um conteúdo útil nesta área precisa explicar de onde vêm os recortes do catálogo e por que certas peças existem, não só posar de mídia de marca.
                </p>
              </div>

              <Link href="/journal" className="flex items-center gap-6 group self-start">
                <div className="w-14 h-14 bg-ruah-950 text-white rounded-full flex items-center justify-center group-hover:bg-accent-gold transition-colors">
                  <BookOpen size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.1em] group-hover:text-accent-gold transition-colors">Abrir Journal</span>
              </Link>
            </div>

            <div className="lg:col-span-8 relative aspect-video rounded-[3rem] overflow-hidden group shadow-2xl bg-ruah-950">
              <AppImage context="hero" src="/assets/editorial/ruah-tv.svg" alt="Journal editorial UseRuah" fill className="object-cover opacity-60 group-hover:scale-[1.05] transition-transform motion-slow" />
              <div className="absolute inset-0 bg-gradient-to-t from-ruah-950/65 via-ruah-950/20 to-transparent" />
              <div className="absolute top-10 left-10">
                <span className="bg-accent-gold text-ruah-950 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.1em]">Editorial</span>
              </div>
              <div className="absolute bottom-10 left-10 right-10">
                <h4 className="text-white text-2xl font-serif italic font-semibold uppercase tracking-tighter mb-2">Como uma coleção ganha forma antes de entrar no catálogo</h4>
                <p className="text-white/60 text-xs font-bold uppercase tracking-[0.1em]">Leitura interna • Processo • Curadoria</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-ruah-50 relative">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(196,164,132,0.05),transparent_60%)]" />
        <div className="section-container relative z-10">
          <div className="layout-grid-media gap-14 lg:gap-20 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="bg-white rounded-[3rem] border border-ruah-100 p-10 lg:p-16 shadow-fancy relative overflow-hidden group">
                <div className="flex flex-col gap-10">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-ruah-950 rounded-2xl relative overflow-hidden shadow-xl ring-4 ring-ruah-50">
                      <AppImage context="content-banner" src="/assets/editorial/spotify-track.svg" alt="Mapa sensorial da coleção" fill className="object-cover" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[14px] font-serif italic font-black text-ruah-950 uppercase tracking-tighter">Mapa sensorial Vol. 1</span>
                      <span className="text-xs font-bold text-accent-gold uppercase tracking-[0.1em]">Ritmo, forma e mensagem</span>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-accent-gold pulse-soft" />
                        <span className="text-xs font-bold text-ruah-200 uppercase tracking-[0.1em]">Leitura ativa</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    {EDITORIAL_NOTES.map((note) => (
                      <div key={note.index} className="flex items-center justify-between p-4 rounded-2xl hover:bg-ruah-50 transition-colors border border-transparent hover:border-ruah-100">
                        <div className="flex items-center gap-5">
                          <span className="text-xs font-serif italic text-ruah-200 font-black">{note.index}</span>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-ruah-950 uppercase">{note.title}</span>
                            <span className="text-xs font-bold text-ruah-200 uppercase tracking-[0.1em]">{note.subtitle}</span>
                          </div>
                        </div>
                        <Music className="text-ruah-100" size={12} />
                      </div>
                    ))}
                  </div>

                  <Link href="/shop" className="w-full bg-ruah-950 text-white p-6 rounded-2xl flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.1em] hover:bg-accent-gold transition-all shadow-2xl">
                    Ver coleção em destaque <Music size={18} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-10 order-1 lg:order-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Music className="text-accent-gold" size={24} />
                  <span className="tech-label text-ruah-300">Mapa sensorial</span>
                </div>
                <h2 className="ur-type-display-lg italic uppercase text-ruah-950">
                  O ritmo <br /> da coleção.
                </h2>
              </div>

              <p className="text-[12px] font-bold text-ruah-400 uppercase tracking-[0.1em] leading-loose max-w-sm">
                Este bloco não representa playlist pública nem integração com streaming. Ele funciona como uma camada de interpretação para o catálogo: silêncio, contraste, presença e intenção.
              </p>

              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4 border-l-2 border-accent-gold pl-6">
                  <p className="text-xs font-bold text-ruah-950 uppercase tracking-[0.2em] italic">
                    &quot;Quando a marca não inventa canal, sobra espaço para a coleção respirar.&quot;
                  </p>
                </div>

                <div className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-subtle">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">Uso correto</span>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-ruah-500">
                    A função dessa camada é preparar a leitura da pessoa antes da compra. Se um dia existir mídia ativa de verdade, ela pode nascer daqui sem vender fumaça antes da hora.
                  </p>
                </div>

                <div className="flex gap-4">
                  {['Autoral', 'Contemplativo', 'Cotidiano'].map((label) => (
                    <span key={label} className="px-6 py-3 bg-white border border-ruah-100 rounded-xl text-xs font-bold uppercase tracking-[0.1em]">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
