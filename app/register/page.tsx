'use client';

import React from 'react';
import Link from 'next/link';
import { AppImage } from '@/components/shared/AppImage';
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
import { HttpRequestError, patchJson, postJson } from '@/lib/http-client';
import { useUser } from '@/context/UserContext';

type Persona = 'ALMA' | 'FAROL' | 'SOPRO' | null;
type PersonaKey = Exclude<Persona, null>;

type RegistrationDraft = {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  interest: string;
  institutionName: string;
  cnpj: string;
  communitySize: string;
  leaderName: string;
  whatsapp: string;
  artisticName: string;
  creativeEmail: string;
  portfolioUrl: string;
  manifesto: string;
  password: string;
  termsAccepted: boolean;
};

type DraftErrors = Partial<Record<keyof RegistrationDraft, string>>;

const STORAGE_KEY = 'ruah_register_draft_v2';

const DEFAULT_DRAFT: RegistrationDraft = {
  fullName: '',
  email: '',
  phone: '',
  cpf: '',
  interest: 'Vestuário & Fé',
  institutionName: '',
  cnpj: '',
  communitySize: 'Até 50 pessoas',
  leaderName: '',
  whatsapp: '',
  artisticName: '',
  creativeEmail: '',
  portfolioUrl: '',
  manifesto: '',
  password: '',
  termsAccepted: false,
};

const REQUIRED_FIELDS: Record<PersonaKey, (keyof RegistrationDraft)[]> = {
  ALMA: ['fullName', 'email', 'phone', 'cpf', 'interest', 'password', 'termsAccepted'],
  FAROL: ['institutionName', 'leaderName', 'whatsapp', 'password', 'termsAccepted'],
  SOPRO: ['artisticName', 'creativeEmail', 'portfolioUrl', 'password', 'termsAccepted'],
};

function readStoredRegistrationDraft(): { step: number; persona: Persona; draft: RegistrationDraft } {
  if (typeof window === 'undefined') {
    return { step: 1, persona: null, draft: DEFAULT_DRAFT };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { step: 1, persona: null, draft: DEFAULT_DRAFT };
  try {
    const parsed = JSON.parse(raw) as { step?: number; persona?: Persona; draft?: RegistrationDraft };
    return {
      step: parsed.step === 2 ? 2 : 1,
      persona: parsed.persona ?? null,
      draft: { ...DEFAULT_DRAFT, ...(parsed.draft ?? {}) },
    };
  } catch {
    return { step: 1, persona: null, draft: DEFAULT_DRAFT };
  }
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function maskCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function maskCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterPage() {
  const { isAuthenticated, refreshRegistration } = useUser();
  const initialState = React.useMemo(() => readStoredRegistrationDraft(), []);
  const [step, setStep] = React.useState(initialState.step);
  const [persona, setPersona] = React.useState<Persona>(initialState.persona);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<RegistrationDraft>(initialState.draft);
  const [errors, setErrors] = React.useState<DraftErrors>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof RegistrationDraft, boolean>>>({});

  const personas = [
    {
      id: 'ALMA' as Persona,
      title: 'Cliente Alma Ruah',
      subtitle: 'Cliente / Comprador',
      description: 'Quero comprar peças exclusivas para meu testemunho e estilo de vida.',
      icon: User,
      color: 'bg-accent-gold/10 text-accent-gold',
    },
    {
      id: 'FAROL' as Persona,
      title: 'Conexão Farol',
      subtitle: 'Igrejas / Ministérios',
      description: 'Represento uma comunidade e quero organizar compras ou interesse coletivo com atendimento orientado, sem depender de personalização self-service.',
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

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ persona, draft, step }));
  }, [persona, draft, step]);

  React.useEffect(() => {
    const hydrateFromBackend = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch('/api/auth/registration/me', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          authenticated: boolean;
          registration: null | {
            persona: PersonaKey;
            status: string;
            fullName: string;
            email: string;
            metadata?: Record<string, unknown>;
          };
        };
        if (!payload.authenticated || !payload.registration) return;
        const registration = payload.registration;
        const apiPersona = registration.persona;
        setPersona(apiPersona);
        setStep(registration.status === 'active' ? 1 : 2);
        setDraft((prev) => ({
          ...prev,
          ...(registration.metadata ?? {}),
          fullName: registration.fullName || prev.fullName,
          email: registration.email || prev.email,
        }));
      } catch {}
    };
    void hydrateFromBackend();
  }, [isAuthenticated]);

  const validateField = React.useCallback((field: keyof RegistrationDraft, value: string | boolean): string => {
    if (field === 'termsAccepted') return value ? '' : 'Aceite os termos para prosseguir.';
    if (field === 'email' || field === 'creativeEmail') return isValidEmail(String(value)) ? '' : 'E-mail inválido.';
    if (field === 'phone') return onlyDigits(String(value)).length >= 10 ? '' : 'Telefone inválido.';
    if (field === 'cpf') return onlyDigits(String(value)).length === 11 ? '' : 'CPF deve ter 11 dígitos.';
    if (field === 'cnpj' && String(value).trim().length > 0) return onlyDigits(String(value)).length === 14 ? '' : 'CNPJ deve ter 14 dígitos.';
    if (field === 'whatsapp') return onlyDigits(String(value)).length >= 10 ? '' : 'Telefone inválido.';
    if (field === 'password') return String(value).length >= 6 ? '' : 'Senha deve ter ao menos 6 caracteres.';
    if (typeof value === 'string' && value.trim().length === 0) return 'Campo obrigatório.';
    return '';
  }, []);

  const validateCurrentPersona = React.useCallback((): DraftErrors => {
    if (!persona) return {};
    const nextErrors: DraftErrors = {};
    for (const field of REQUIRED_FIELDS[persona]) {
      const message = validateField(field, draft[field]);
      if (message) nextErrors[field] = message;
    }
    if (persona === 'FAROL' && draft.cnpj.trim().length > 0) {
      const cnpjError = validateField('cnpj', draft.cnpj);
      if (cnpjError) nextErrors.cnpj = cnpjError;
    }
    return nextErrors;
  }, [draft, persona, validateField]);

  const completion = React.useMemo(() => {
    if (!persona) return { completed: 0, total: 1, percentage: 0 };
    const required = REQUIRED_FIELDS[persona];
    const completed = required.filter((field) => validateField(field, draft[field]) === '').length;
    return { completed, total: required.length, percentage: Math.round((completed / required.length) * 100) };
  }, [draft, persona, validateField]);

  const handleFieldChange = (field: keyof RegistrationDraft, value: string | boolean) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const message = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: message || undefined }));
    }
  };

  const handleFieldBlur = (field: keyof RegistrationDraft) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const message = validateField(field, draft[field]);
    setErrors((prev) => ({ ...prev, [field]: message || undefined }));
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!persona) return;
    const nextErrors = validateCurrentPersona();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        persona,
        fullName: draft.fullName || draft.artisticName || draft.leaderName || 'Novo Usuário',
        email: (persona === 'SOPRO' ? draft.creativeEmail : draft.email).trim(),
        password: draft.password,
        termsAccepted: draft.termsAccepted,
        draft,
      };
      if (isAuthenticated) {
        await patchJson<{ ok: true; registration: { status: string } }>('/api/auth/registration/me', payload);
        await refreshRegistration();
      } else {
        await postJson<{ ok: true; status: string; session: { userRole: string; activeRole?: string } }>('/api/auth/register', payload);
      }
      setStep(3);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      if (error instanceof HttpRequestError && error.status === 422) {
        setSubmitError('Revise os dados obrigatórios antes de concluir.');
      } else {
        setSubmitError('Não foi possível concluir o cadastro agora. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="px-8 py-10 flex justify-between items-center border-b border-ruah-100 bg-white">
        <Link href="/" aria-label="UseRuah">
          <AppImage context="content-banner" src="/brand/SVG/logo-wordmark-dark.svg" alt="UseRuah" width={180} height={48} className="h-auto w-[180px]" priority />
        </Link>
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
                    A UseRuah organiza perfis de compra, comunidade e colaboração para liberar a jornada adequada sem prometer automação que ainda não existe.
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
                     <span className="text-[9px] font-bold uppercase tracking-widest text-accent-gold">Cadastro {persona === 'ALMA' ? 'Cliente' : persona === 'FAROL' ? 'Comunitário' : 'Consultivo'}</span>
                     <h2 className="text-3xl font-serif italic text-ruah-950">Sopro de Identidade</h2>
                   </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Completude do cadastro</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-950">{completion.percentage}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-ruah-100 overflow-hidden">
                    <div className="h-full bg-accent-gold transition-all" style={{ width: `${completion.percentage}%` }} />
                  </div>
                  <p className="text-[10px] mt-2 text-ruah-400 uppercase tracking-wider">
                    {completion.completed} de {completion.total} requisitos prontos para liberar o acesso inicial.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[3.5rem] border border-ruah-100 shadow-subtle flex flex-col gap-8">
                  {persona === 'ALMA' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Respiro do Nome</label>
                        <input value={draft.fullName} onChange={(e) => handleFieldChange('fullName', e.target.value)} onBlur={() => handleFieldBlur('fullName')} required type="text" placeholder="Nome Completo" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.fullName && <p className="text-[10px] text-red-600 font-semibold">{errors.fullName}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Cetro Digital (Email)</label>
                        <input value={draft.email} onChange={(e) => handleFieldChange('email', e.target.value)} onBlur={() => handleFieldBlur('email')} required type="email" placeholder="seu@email.com" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.email && <p className="text-[10px] text-red-600 font-semibold">{errors.email}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">CPF</label>
                        <input value={draft.cpf} onChange={(e) => handleFieldChange('cpf', maskCpf(e.target.value))} onBlur={() => handleFieldBlur('cpf')} required type="text" inputMode="numeric" placeholder="000.000.000-00" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.cpf && <p className="text-[10px] text-red-600 font-semibold">{errors.cpf}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Telefone / WhatsApp</label>
                        <input value={draft.phone} onChange={(e) => handleFieldChange('phone', maskPhone(e.target.value))} onBlur={() => handleFieldBlur('phone')} required type="text" inputMode="tel" placeholder="(00) 00000-0000" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.phone && <p className="text-[10px] text-red-600 font-semibold">{errors.phone}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Interesse Principal</label>
                        <select value={draft.interest} onChange={(e) => handleFieldChange('interest', e.target.value)} className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all appearance-none cursor-pointer">
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
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Nome da Instituição / Paróquia / Ministério</label>
                        <input value={draft.institutionName} onChange={(e) => handleFieldChange('institutionName', e.target.value)} onBlur={() => handleFieldBlur('institutionName')} required type="text" placeholder="Ex: Paróquia São Lucas" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.institutionName && <p className="text-[10px] text-red-600 font-semibold">{errors.institutionName}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">CNPJ (Opcional)</label>
                        <input value={draft.cnpj} onChange={(e) => handleFieldChange('cnpj', maskCnpj(e.target.value))} onBlur={() => handleFieldBlur('cnpj')} type="text" inputMode="numeric" placeholder="00.000.000/0000-00" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.cnpj && <p className="text-[10px] text-red-600 font-semibold">{errors.cnpj}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Tamanho da Comunidade</label>
                        <select value={draft.communitySize} onChange={(e) => handleFieldChange('communitySize', e.target.value)} className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all appearance-none cursor-pointer">
                          <option>Até 50 pessoas</option>
                          <option>50 - 200 pessoas</option>
                          <option>200 - 1000 pessoas</option>
                          <option>Acima de 1000</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Nome do Líder Responsável</label>
                        <input value={draft.leaderName} onChange={(e) => handleFieldChange('leaderName', e.target.value)} onBlur={() => handleFieldBlur('leaderName')} required type="text" placeholder="Nome do representante" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.leaderName && <p className="text-[10px] text-red-600 font-semibold">{errors.leaderName}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">WhatsApp de Contato</label>
                        <input value={draft.whatsapp} onChange={(e) => handleFieldChange('whatsapp', maskPhone(e.target.value))} onBlur={() => handleFieldBlur('whatsapp')} required type="text" inputMode="tel" placeholder="(00) 00000-0000" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.whatsapp && <p className="text-[10px] text-red-600 font-semibold">{errors.whatsapp}</p>}
                      </div>
                    </div>
                  )}

                  {persona === 'SOPRO' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Assinatura Artística (Nome)</label>
                        <input value={draft.artisticName} onChange={(e) => handleFieldChange('artisticName', e.target.value)} onBlur={() => handleFieldBlur('artisticName')} required type="text" placeholder="Como você é conhecido(a)" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.artisticName && <p className="text-[10px] text-red-600 font-semibold">{errors.artisticName}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Email Criativo</label>
                        <input value={draft.creativeEmail} onChange={(e) => handleFieldChange('creativeEmail', e.target.value)} onBlur={() => handleFieldBlur('creativeEmail')} required type="email" placeholder="seu@email.com" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.creativeEmail && <p className="text-[10px] text-red-600 font-semibold">{errors.creativeEmail}</p>}
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Vitrine Digital (Portfolio / Instagram)</label>
                        <input value={draft.portfolioUrl} onChange={(e) => handleFieldChange('portfolioUrl', e.target.value)} onBlur={() => handleFieldBlur('portfolioUrl')} required type="url" placeholder="https://instagram.com/seuusuario" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                        {errors.portfolioUrl && <p className="text-[10px] text-red-600 font-semibold">{errors.portfolioUrl}</p>}
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Breve Manifesto de Estilo</label>
                        <textarea value={draft.manifesto} onChange={(e) => handleFieldChange('manifesto', e.target.value)} placeholder="Conte-nos como sua arte respira e se conecta com a fé..." className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all h-32 resize-none" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">Definir Senha de Acesso</label>
                    <input value={draft.password} onChange={(e) => handleFieldChange('password', e.target.value)} onBlur={() => handleFieldBlur('password')} required type="password" placeholder="********" className="bg-ruah-50 border border-ruah-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-accent-gold transition-all" />
                    <p className="text-[10px] text-ruah-400">Use pelo menos 6 caracteres.</p>
                    {errors.password && <p className="text-[10px] text-red-600 font-semibold">{errors.password}</p>}
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-ruah-50/50 rounded-2xl border border-ruah-100">
                     <input checked={draft.termsAccepted} onChange={(e) => handleFieldChange('termsAccepted', e.target.checked)} onBlur={() => handleFieldBlur('termsAccepted')} type="checkbox" required className="mt-1 w-4 h-4 rounded border-ruah-200 text-accent-gold focus:ring-accent-gold" />
                     <p className="text-[10px] text-ruah-400 font-medium leading-relaxed uppercase tracking-widest">
                        Aceito as{' '}
                        <Link href="/policies" className="text-ruah-950 font-bold decoration-accent-gold underline decoration-2">
                          regras da loja
                        </Link>{' '}
                        e a{' '}
                        <Link href="/policies" className="text-ruah-950 font-bold decoration-accent-gold underline decoration-2">
                          politica publica vigente
                        </Link>{' '}
                        da UseRuah.
                     </p>
                  </div>
                  {errors.termsAccepted && <p className="text-[10px] text-red-600 font-semibold">{errors.termsAccepted}</p>}
                  {submitError && <p className="text-[10px] text-red-600 font-semibold uppercase tracking-widest">{submitError}</p>}

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
                    Seu cadastro como <span className="text-ruah-950 font-bold">{persona === 'ALMA' ? 'Cliente Alma Ruah' : persona === 'FAROL' ? 'Conexão Farol' : 'Curadoria Sopro'}</span> foi processado com sucesso.
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
                        : 'Nossa equipe revisará os dados enviados para liberar o próximo passo compatível com esse perfil.'}
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
          UseRuah &copy; 2026 | CONECTANDO FÉ & ARTE | TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>
    </div>
  );
}


