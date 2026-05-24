import Image from 'next/image';

interface CheckoutStepOneSectionProps {
  isActive: boolean;
  region: string;
  deliveryDateLabel: string;
  maxProductionDays: number;
  shippingDays: number;
  composedDeadline: number;
  selectedAddress: string;
  onSelectAddress: (value: string) => void;
  gifting: {
    isGift: boolean;
    message: string;
    premiumPackage: boolean;
  };
  onToggleGift: () => void;
  onGiftMessageChange: (value: string) => void;
  onContinue: () => void;
}

export function CheckoutStepOneSection({
  isActive,
  region,
  deliveryDateLabel,
  maxProductionDays,
  shippingDays,
  composedDeadline,
  selectedAddress,
  onSelectAddress,
  gifting,
  onToggleGift,
  onGiftMessageChange,
  onContinue,
}: CheckoutStepOneSectionProps) {
  return (
    <div className={`flex flex-col gap-8 transition-opacity ${isActive ? '' : 'opacity-40 pointer-events-none'}`}>
      <div className="flex items-center gap-6 text-ruah-950">
        <div className="w-10 h-10 bg-ruah-950 text-white rounded-full flex items-center justify-center font-serif italic text-lg">1</div>
        <h2 className="text-3xl font-serif italic uppercase tracking-tighter">Handover de Entrega</h2>
      </div>

      <div className="bg-ruah-950 text-white p-8 rounded-3xl flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-full bg-accent-gold/10 blur-3xl" />
        <div className="flex flex-col gap-2 relative z-10">
          <span className="text-xs font-bold text-accent-gold uppercase tracking-[0.2em]">Logística: {region}</span>
          <h3 className="text-xl font-serif italic">Previsão para {deliveryDateLabel}</h3>
          <p className="text-xs text-white/70 font-medium leading-relaxed">Prazo composto: {maxProductionDays} dias de produção + {shippingDays} dias de logística.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-serif italic text-accent-gold">{composedDeadline}</div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Dias úteis</div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-ruah-100 flex flex-col gap-8">
        <div className="flex gap-4">
          <button type="button" aria-pressed={selectedAddress === 'home'} onClick={() => onSelectAddress('home')} className={`p-6 rounded-2xl border transition-all text-left flex-1 ${selectedAddress === 'home' ? 'border-accent-gold bg-accent-gold/5' : 'border-ruah-100'}`}>
            <h4 className="text-sm font-bold uppercase mb-1 text-ruah-950">Entregar na Toca</h4>
            <p className="text-xs text-ruah-500">Endereço principal cadastrado.</p>
          </button>
          <button type="button" aria-pressed={selectedAddress === 'work'} onClick={() => onSelectAddress('work')} className={`p-6 rounded-2xl border transition-all text-left flex-1 ${selectedAddress === 'work' ? 'border-accent-gold bg-accent-gold/5' : 'border-ruah-100'}`}>
            <h4 className="text-sm font-bold uppercase mb-1 text-ruah-950">Presente/Outro</h4>
            <p className="text-xs text-ruah-500">Novo ponto de entrega.</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-ruah-950 font-bold">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">CEP</label>
            <input type="text" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" className="bg-ruah-50 border border-ruah-100 rounded-xl px-6 py-4 text-xs focus:border-accent-gold outline-none transition-all" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">Destinatário</label>
            <input type="text" autoComplete="name" placeholder="Nome de quem recebe" className="bg-ruah-50 border border-ruah-100 rounded-xl px-6 py-4 text-xs focus:border-accent-gold outline-none transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-ruah-100 flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-ruah-50 rounded-xl flex items-center justify-center text-accent-gold">
              <Image src="https://picsum.photos/seed/gift/100/100" alt="Gift" width={20} height={20} className="grayscale" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-ruah-950">Experiência Gift Ruah</h3>
              <p className="text-xs text-ruah-500">Unboxing premium com cartão autoral.</p>
            </div>
          </div>
          <button type="button" aria-pressed={gifting.isGift} aria-label="Ativar experiência de presente" onClick={onToggleGift} className={`w-12 h-6 rounded-full transition-all relative ${gifting.isGift ? 'bg-accent-gold' : 'bg-ruah-200'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${gifting.isGift ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {gifting.isGift && (
          <div className="flex flex-col gap-6 pt-4 text-ruah-950 font-bold">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">Mensagem Alma Ruah (manuscrita)</label>
              <textarea
                placeholder="Sua mensagem será escrita à mão em nosso cartão oficial..."
                value={gifting.message}
                onChange={(e) => onGiftMessageChange(e.target.value)}
                className="bg-ruah-50 border border-ruah-100 rounded-xl px-6 py-4 text-xs font-medium focus:border-accent-gold outline-none transition-all h-24 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={onContinue} className="bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-accent-gold transition-all shadow-fancy">
        Ir para Pagamento Seguro
      </button>
    </div>
  );
}


