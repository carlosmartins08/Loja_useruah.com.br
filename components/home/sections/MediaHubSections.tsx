
import { Instagram, Music, Youtube } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';

const TRACKS = [
  { title: 'Oração em Linhas', artist: 'Sopro Vocal', time: '04:12' },
  { title: 'Vento Impulsionador', artist: 'Instrumental Reino', time: '03:45' },
  { title: 'Fogo Criativo', artist: 'Adoração Lab', time: '05:20' },
];

const UGC_ASSETS = [
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
                <Instagram size={20} className="text-accent-gold" />
                <span className="tech-label text-accent-gold">Comunidade Ruah</span>
              </div>
              <h2 className="text-4xl font-serif lowercase italic tracking-tighter font-semibold uppercase text-ruah-950">Ruah no cotidiano.</h2>
              <p className="text-xs font-bold text-ruah-400 uppercase tracking-[0.1em] leading-loose max-w-xs">Use #GeraçãoRuah e faça parte da nossa história.</p>
            </div>

            <div className="lg:col-span-8 rounded-[2.75rem] border border-ruah-100 bg-white/80 p-8 shadow-subtle">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">5</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Momentos vivos</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">UGC</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Leitura social</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">Feed</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Respiração visual</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`relative overflow-hidden group cursor-pointer shadow-subtle ${i === 1 || i === 4 ? 'rounded-[2.5rem] aspect-[4/5]' : 'rounded-[2rem] aspect-square'}`}>
                <AppImage context="product-thumb" src={UGC_ASSETS[i - 1]} alt="UGC Content" fill className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-ruah-950/55 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
                <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Comunidade</span>
                    <span className="text-sm font-serif italic text-white">#GeraçãoRuah</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <Instagram size={18} className="text-white" />
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
                  <Youtube className="text-red-600" size={24} />
                  <span className="tech-label text-ruah-300">Ruah TV</span>
                </div>
                <h3 className="ur-type-display-lg italic uppercase text-ruah-950">
                  Respiro <br /> Criativo.
                </h3>
              </div>

              <p className="text-[12px] font-bold text-ruah-400 uppercase tracking-[0.1em] leading-loose max-w-sm">
                Assista à jornada dos nossos artistas e mergulhe no processo criativo que transforma oração em arte contemporânea.
              </p>

              <div className="rounded-[2rem] border border-ruah-100 bg-ruah-50 p-6 shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">Destaque da semana</span>
                <p className="mt-3 text-sm font-medium leading-relaxed text-ruah-500">
                  Um conteúdo bom aqui não serve só para ocupar espaço. Ele precisa reforçar que existe processo criativo, rosto e autoria por trás da marca.
                </p>
              </div>

              <Link href="https://youtube.com" target="_blank" className="flex items-center gap-6 group self-start">
                <div className="w-14 h-14 bg-ruah-950 text-white rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <Youtube size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.1em] group-hover:text-red-600 transition-colors">Ver Canal Youtube</span>
              </Link>
            </div>

            <div className="lg:col-span-8 relative aspect-video rounded-[3rem] overflow-hidden group shadow-2xl bg-ruah-950">
              <AppImage context="hero" src="/assets/editorial/ruah-tv.svg" alt="YouTube Featured Video" fill className="object-cover opacity-60 group-hover:scale-[1.05] transition-transform motion-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:bg-accent-gold group-hover:scale-110 transition-all shadow-2xl">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[22px] border-l-white border-b-[12px] border-b-transparent ml-1" />
                </div>
              </div>
              <div className="absolute top-10 left-10">
                <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.1em]">Destaque</span>
              </div>
              <div className="absolute bottom-10 left-10 right-10">
                <h4 className="text-white text-2xl font-serif italic font-semibold uppercase tracking-tighter mb-2">A Origem do Traço de Lucas S.</h4>
                <p className="text-white/60 text-xs font-bold uppercase tracking-[0.1em]">Documentário Curto • 04:20</p>
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
                      <AppImage context="content-banner" src="/assets/editorial/spotify-track.svg" alt="Album Cover" fill className="object-cover" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[14px] font-serif italic font-black text-ruah-950 uppercase tracking-tighter">Sopro da Manhã Vol. 1</span>
                      <span className="text-xs font-bold text-accent-gold uppercase tracking-[0.1em]">Curadoria Oficial Ruah</span>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 pulse-soft" />
                        <span className="text-xs font-bold text-ruah-200 uppercase tracking-[0.1em]">Tocando Agora</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    {TRACKS.map((track, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-ruah-50 transition-colors group/track cursor-pointer border border-transparent hover:border-ruah-100">
                        <div className="flex items-center gap-5">
                          <span className="text-xs font-serif italic text-ruah-200 group-hover/track:text-accent-gold font-black">0{i + 1}</span>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-ruah-950 uppercase">{track.title}</span>
                            <span className="text-xs font-bold text-ruah-200 uppercase tracking-[0.1em]">{track.artist}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-serif italic text-ruah-200">{track.time}</span>
                          <Music className="text-ruah-100 group-hover/track:text-green-500 transition-colors" size={12} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link href="https://spotify.com" target="_blank" className="w-full bg-ruah-950 text-white p-6 rounded-2xl flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.1em] hover:bg-green-500 transition-all shadow-2xl">
                    Ouvir no Spotify <Music size={18} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-10 order-1 lg:order-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Music className="text-green-500" size={24} />
                  <span className="tech-label text-ruah-300">Sopro de Adoração</span>
                </div>
                <h2 className="ur-type-display-lg italic uppercase text-ruah-950">
                  A Trilha <br /> do Seu Dia.
                </h2>
              </div>

              <p className="text-[12px] font-bold text-ruah-400 uppercase tracking-[0.1em] leading-loose max-w-sm">
                Selecionamos as melodias que alimentam a alma e inspiram a criação. Nossa trilha sonora é composta por artistas que buscam o sagrado em cada nota.
              </p>

              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4 border-l-2 border-accent-gold pl-6">
                  <p className="text-xs font-bold text-ruah-950 uppercase tracking-[0.2em] italic">
                    &quot;A música é a oração que não precisa de palavras para ser sentida.&quot;
                  </p>
                </div>

                <div className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-subtle">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">Curadoria sensorial</span>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-ruah-500">
                    A trilha certa amplia a presença da marca sem disputar atenção com o produto. Essa camada ajuda a transformar mídia em atmosfera.
                  </p>
                </div>

                <div className="flex gap-4">
                  {['Spotify', 'Apple Music', 'Deezer'].map((plat) => (
                    <button key={plat} className="px-6 py-3 bg-white border border-ruah-100 rounded-xl text-xs font-bold uppercase tracking-[0.1em] hover:border-accent-gold transition-colors">
                      {plat}
                    </button>
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




