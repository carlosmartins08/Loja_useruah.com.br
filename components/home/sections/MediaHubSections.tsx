
import { Instagram, Music, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const TRACKS = [
  { title: 'Oração em Linhas', artist: 'Sopro Vocal', time: '04:12' },
  { title: 'Vento Impulsionador', artist: 'Instrumental Reino', time: '03:45' },
  { title: 'Fogo Criativo', artist: 'Adoração Lab', time: '05:20' },
];

export function MediaHubSections() {
  return (
    <>
      <section className="bg-ruah-50 section-space border-y border-ruah-100">
        <div className="section-container">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="flex items-center gap-4 mb-4">
              <Instagram size={20} className="text-accent-gold" />
              <span className="tech-label text-accent-gold">Comunidade Ruah</span>
            </div>
            <h2 className="text-4xl font-serif lowercase italic tracking-tighter font-semibold uppercase text-ruah-950">Ruah no cotidiano.</h2>
            <p className="text-xs font-bold text-ruah-400 uppercase tracking-[0.1em] mt-6">Use #GeraçãoRuah e faça parte da nossa história.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
                <Image src={`https://picsum.photos/seed/ruah-ugc-${i}/600/600`} alt="UGC Content" fill className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale hover:grayscale-0" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-ruah-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Instagram size={24} className="text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-4 flex flex-col gap-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Youtube className="text-red-600" size={24} />
                  <span className="tech-label text-ruah-300">Ruah TV</span>
                </div>
                <h3 className="text-5xl lg:text-7xl font-serif italic font-semibold uppercase tracking-tighter text-ruah-950 leading-none">
                  Respiro <br /> Criativo.
                </h3>
              </div>

              <p className="text-[12px] font-bold text-ruah-400 uppercase tracking-[0.1em] leading-loose max-w-sm">
                Assista à jornada dos nossos artistas e mergulhe no processo criativo que transforma oração em arte contemporânea.
              </p>

              <Link href="https://youtube.com" target="_blank" className="flex items-center gap-6 group self-start">
                <div className="w-14 h-14 bg-ruah-950 text-white rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <Youtube size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.1em] group-hover:text-red-600 transition-colors">Ver Canal Youtube</span>
              </Link>
            </div>

            <div className="lg:col-span-8 relative aspect-video rounded-[3rem] overflow-hidden group shadow-2xl bg-ruah-950">
              <Image src="https://picsum.photos/seed/ruah-yt-hero/1280/720" alt="YouTube Featured Video" fill className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-[3rem] border border-ruah-100 p-10 lg:p-16 shadow-fancy relative overflow-hidden group">
                <div className="flex flex-col gap-10">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-ruah-950 rounded-2xl relative overflow-hidden shadow-xl ring-4 ring-ruah-50">
                      <Image src="https://picsum.photos/seed/spotify-hero/400/400" alt="Album Cover" fill className="object-cover" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[14px] font-serif italic font-black text-ruah-950 uppercase tracking-tighter">Sopro da Manhã Vol. 1</span>
                      <span className="text-xs font-bold text-accent-gold uppercase tracking-[0.1em]">Curadoria Oficial Ruah</span>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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

            <div className="flex flex-col gap-10 order-1 lg:order-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Music className="text-green-500" size={24} />
                  <span className="tech-label text-ruah-300">Sopro de Adoração</span>
                </div>
                <h2 className="text-5xl lg:text-7xl font-serif italic font-semibold uppercase tracking-tighter text-ruah-950 leading-none">
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



