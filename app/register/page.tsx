'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Church, 
  Palette, 
  CheckCircle2, 
  Heart,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

type Persona = 'ALMA' | 'FAROL' | 'SOPRO' | null;

export default function RegisterPage() {
  const [step, setStep] = React.useState(1);
  const [persona, setPersona] = React.useState<Persona>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const personas = [
    {
      id: 'ALMA' as Persona,
      title: 'Alma Ruah',
      subtitle: 'Individual / Fiel',
      description: 'Desejo adquirir peças exclusivas para meu testemunho e estilo de vida individual.',
      icon: User,
      color: 'bg-accent-gold/10 text-accent-gold',
    },
    {
      id: 'FAROL' as Persona,
      title: 'Conexão Farol',
      subtitle: 'Igrejas / Ministérios',
      description: 'Represento uma comunidade que busca personalização em escala para eventos e missões.',
      icon: Church,
      color: 'bg-ruah-950/10 text-ruah-950',
    },
    {
      id: 'SOPRO' as Persona,
      title: 'Curadoria Sopro',
      subtitle: 'Artistas / Co-criadores',
      description: 'Sou artista e quero conectar minha arte ao movimento Ruah através de colaborações.',
      icon: Palette,
      color: 'bg-ruah-300/10 text-ruah-300',
    },
  ];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep(3);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="px-8 py-10 flex justify-between items-center border-b border-ruah-100 bg-white">
        <Link href="/" className="text-2xl font-serif font-black tracking-tighter text-ruah-950 italic">USERUAH</Link>
        <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-ruah-400 hover:text-ruah-950 transition-colors">
          Já tenho acesso
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex flex-col gap-12"
              >
                <div className="text-center md:text-left">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent-gold mb-4 block font-bold">Início da Jornada</span>
                  <h1 className="text-4xl md:text-6xl font-serif italic text-ruah-950 leading-tight">Escolha como sua fé <br/>quer se expressar.</h1>
                  <p className="text-sm text-ruah-400 mt-6 max-w-md md:mx-0 mx-auto">
                    A UseRuah é um ecossistema. Identifique sua persona para que possamos oferecer a melhor experiência de co-criação.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p.id)}
                      className={`group relative p-10 rounded-[2.5rem] border-2 transition-all flex flex-col gap-6 text-left ${
                        persona === p.id 
                          ? 'border-accent-gold bg-white shadow-2xl scale-[1.02]' 
                          : 'border-ruah-50 bg-white hover:border-ruah-100'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${p.color}`}>
                        <p.icon size={24} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-serif italic text-ruah-950 uppercase">{p.title}</h3>
                        <span className="text-[9px] font-bold tracking-widest text-ruah-300 uppercase">{p.subtitle}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-ruah-400 font-medium">
                        {p.description}
                      </p>
                      {persona === p.id && (
                        <div className="absolute top-6 right-6 text-accent-gold">
                          <CheckCircle2 size={24} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center md:justify-end mt-4">
                  <button
                    disabled={!persona}
                    onClick={handleNext}
                    className="group bg-ruah-950 text-white px-12 py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-4 transition-all hover:bg-accent-gold disabled:opacity-30 disabled:cursor-not-allowed shadow-fancy"
                  >
                    Prosseguir <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="flex items-center gap-4 mb-12">
                   <button onClick={handleBack} className="p-3 hover:bg-ruah-50 rounded-full transition-colors text-ruah-300 hover:text-ruah-950">
                     <ChevronLeft />
                   </button>
                   <div>
                     <span className="text-[9px] font-bold uppercase tracking-widest text-accent-gold">Cadastro {persona === 'ALMA' ? 'Individual' : persona === 'FAROL' ? 'Comunitário' : 'Consultivo'}</span>
                     <h2 className="text-3xl font-serif italic text-ruah-950">Sopro de Identidade</h2>
                   </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[3.5rem] border border-ruah-100 shadow-subtle flex flex-col gap-8">
                  {persona === 'ALMA' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Respiro do Nome</label>
                        <input required type="text" placeholder="Nome Completo" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Cetro Digital (Email)</label>
                        <input required type="email" placeholder="seu@email.com" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">CPF</label>
                        <input required type="text" placeholder="000.000.000-00" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Interesse Principal</label>
                        <select className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all appearance-none cursor-pointer">
                          <option>Vestuário & Fé</option>
                          <option>Arte & Curadoria</option>
                          <option>Lifestyle Cristão</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {persona === 'FAROL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Nome da Instituição / Paróquia / Mistério</label>
                        <input required type="text" placeholder="Ex: Paróquia São Lucas" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">CNPJ (Opcional)</label>
                        <input type="text" placeholder="00.000.000/0000-00" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Tamanho da Comunidade</label>
                        <select className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all appearance-none cursor-pointer">
                          <option>Até 50 pessoas</option>
                          <option>50 - 200 pessoas</option>
                          <option>200 - 1000 pessoas</option>
                          <option>Acima de 1000</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Nome do Líder Responsável</label>
                        <input required type="text" placeholder="Nome do representante" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">WhatsApp de Contato</label>
                        <input required type="text" placeholder="(00) 00000-0000" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                    </div>
                  )}

                  {persona === 'SOPRO' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Assinatura Artística (Nome)</label>
                        <input required type="text" placeholder="Como você é conhecido(a)" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Email Criativo</label>
                        <input required type="email" placeholder="seu@email.com" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Vitrine Digital (Portfolio / Instagram)</label>
                        <input required type="text" placeholder="https://instagram.com/seuusuario" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Breve Manifesto de Estilo</label>
                        <textarea placeholder="Conte-nos como sua arte respira e se conecta com a fé..." className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all h-32 resize-none" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Definir Senha de Acesso</label>
                    <input required type="password" placeholder="********" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-ruah-50/50 rounded-2xl border border-ruah-100">
                     <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-ruah-200 text-accent-gold focus:ring-accent-gold" />
                     <p className="text-[10px] text-ruah-400 font-medium leading-relaxed uppercase tracking-widest">
                        Aceito os <span className="text-ruah-950 font-bold decoration-accent-gold underline decoration-2 cursor-pointer">Termos de Co-Criação</span> e a <span className="text-ruah-950 font-bold decoration-accent-gold underline decoration-2 cursor-pointer">Política de Sopro Protegido</span> da UseRuah.
                     </p>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-accent-gold transition-all flex items-center justify-center gap-4 relative overflow-hidden"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                         MANIFESTANDO...
                      </span>
                    ) : (
                      <>CONCLUIR MANIFESTO <Sparkles size={16} /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[4rem] p-16 md:p-24 shadow-2xl border border-ruah-100 text-center flex flex-col items-center gap-10 max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                  <CheckCircle2 size={48} />
                </div>
                
                <div className="flex flex-col gap-4">
                  <h2 className="text-4xl md:text-5xl font-serif italic text-ruah-950">Seja Bem-vindo ao Sopro.</h2>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-ruah-400 max-w-sm">
                    Seu cadastro como <span className="text-ruah-950 font-bold">{persona === 'ALMA' ? 'Alma Ruah' : persona === 'FAROL' ? 'Conexão Farol' : 'Curadoria Sopro'}</span> foi processado com sucesso.
                  </p>
                </div>

                <div className="bg-ruah-50 p-8 rounded-3xl border border-ruah-100 flex flex-col gap-4 w-full">
                   <div className="flex items-center gap-3 justify-center text-accent-gold">
                      <ShieldCheck size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Verificação em Curso</span>
                   </div>
                   <p className="text-[10px] text-ruah-400 font-medium uppercase leading-relaxed tracking-widest">
                      {persona === 'ALMA' 
                        ? 'Seu acesso está liberado. Comece sua busca pela peça que respira sua verdade.'
                        : 'Nossa curadoria revisará os dados do seu ministério/arte em até 24h para liberar ferramentas exclusivas.'}
                   </p>
                </div>

                <Link 
                  href="/shop" 
                  className="bg-ruah-950 text-white px-12 py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-accent-gold transition-all shadow-fancy"
                >
                  Entrar na Coleção
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-12 border-t border-ruah-100 text-center bg-white">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">
          USERUAH &copy; 2026 | CONECTANDO FÉ & ARTE | TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>
    </div>
  );
}
