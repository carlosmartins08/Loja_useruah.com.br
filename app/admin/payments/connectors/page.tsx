'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Plug, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import type { PaymentProviderKey } from '@/lib/payments';

type ConnectorField = {
  key: string;
  label: string;
  required: boolean;
  placeholder: string;
};

type ConnectorRequirement = {
  provider: PaymentProviderKey;
  fields: ConnectorField[];
  defaults: Record<string, string>;
};

interface RegistryItem {
  key: PaymentProviderKey;
  label: string;
  methods: string[];
}

interface ConfigItem {
  provider: PaymentProviderKey;
  enabled: boolean;
  settings: Record<string, string>;
  isDefault: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface Preference {
  defaultProvider: PaymentProviderKey | null;
  previousDefaultProvider: PaymentProviderKey | null;
}

type WizardStep = 1 | 2 | 3;

export default function AdminPaymentConnectorsPage() {
  const [registry, setRegistry] = React.useState<RegistryItem[]>([]);
  const [requirements, setRequirements] = React.useState<Record<string, ConnectorRequirement>>({});
  const [configs, setConfigs] = React.useState<Record<string, ConfigItem>>({});
  const [preference, setPreference] = React.useState<Preference>({ defaultProvider: null, previousDefaultProvider: null });

  const [provider, setProvider] = React.useState<PaymentProviderKey>('inter');
  const [enabled, setEnabled] = React.useState(false);
  const [settings, setSettings] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<WizardStep>(1);
  const [testPassed, setTestPassed] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSwitchingDefault, setIsSwitchingDefault] = React.useState(false);

  const providerRequirement = requirements[provider];

  const applyConfigToForm = React.useCallback(
    (selectedProvider: PaymentProviderKey, snapshot: Record<string, ConfigItem>, reqs: Record<string, ConnectorRequirement>) => {
      const req = reqs[selectedProvider];
      const current = snapshot[selectedProvider];
      const next: Record<string, string> = {};

      if (req) {
        for (const field of req.fields) {
          const fromConfig = current?.settings?.[field.key];
          const fromDefault = req.defaults?.[field.key];
          next[field.key] = fromConfig ?? fromDefault ?? '';
        }
      }

      setEnabled(current?.enabled ?? false);
      setSettings(next);
      setTestPassed(false);
      setStep(1);
    },
    []
  );

  const load = React.useCallback(async () => {
    const response = await fetch('/api/admin/payment-connectors', { cache: 'no-store' });
    if (!response.ok) return;
    const data = (await response.json()) as {
      registry: RegistryItem[];
      configs: ConfigItem[];
      requirements?: Record<string, ConnectorRequirement>;
      preference?: Preference;
    };

    const reqs = data.requirements ?? {};
    setRegistry(data.registry);
    setRequirements(reqs);

    const indexed: Record<string, ConfigItem> = {};
    for (const row of data.configs) indexed[row.provider] = row;
    setConfigs(indexed);
    setPreference(data.preference ?? { defaultProvider: null, previousDefaultProvider: null });

    applyConfigToForm(provider, indexed, reqs);
  }, [applyConfigToForm, provider]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const missingRequired = React.useMemo(() => {
    if (!providerRequirement) return [];
    return providerRequirement.fields
      .filter((field) => field.required)
      .map((field) => field.key)
      .filter((key) => !settings[key] || !settings[key].trim());
  }, [providerRequirement, settings]);

  const canGoStep2 = provider.length > 0;
  const canGoStep3 = missingRequired.length === 0;

  const testConnection = async () => {
    setStatus(null);
    setIsTesting(true);
    setTestPassed(false);
    const response = await fetch('/api/admin/payment-connectors/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, settings }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string; statusCode?: number };
    setIsTesting(false);
    if (data.ok) {
      setTestPassed(true);
      setStatus('Conexão validada com sucesso. Agora você pode ativar.');
    } else {
      setTestPassed(false);
      setStatus(`Conexão falhou. Revise os dados e tente novamente. (${data.message ?? 'erro'})`);
    }
  };

  const setAsDefault = async (target: PaymentProviderKey) => {
    setStatus(null);
    setIsSwitchingDefault(true);
    const response = await fetch('/api/admin/payment-connectors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_default', provider: target }),
    });
    setIsSwitchingDefault(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { detail?: string } | null;
      setStatus(data?.detail === 'provider_not_enabled' ? 'Ative o gateway antes de definir como padrao.' : 'Falha ao definir gateway padrao.');
      return;
    }
    setStatus('Gateway padrao atualizado.');
    await load();
  };

  const rollbackDefault = async () => {
    setStatus(null);
    setIsSwitchingDefault(true);
    const response = await fetch('/api/admin/payment-connectors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rollback_default' }),
    });
    setIsSwitchingDefault(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { detail?: string } | null;
      setStatus(data?.detail === 'no_previous_default' ? 'Não existe gateway anterior para rollback.' : 'Falha ao executar rollback.');
      return;
    }
    setStatus('Rollback de gateway padrao concluido.');
    await load();
  };

  const save = async () => {
    setStatus(null);
    setIsSaving(true);
    const response = await fetch('/api/admin/payment-connectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, enabled, settings }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { detail?: string; missing?: string[]; message?: string } | null;
      if (data?.detail === 'missing_required_settings' && Array.isArray(data.missing)) {
        setStatus(`Faltam campos obrigatorios: ${data.missing.join(', ')}.`);
      } else if (data?.detail === 'connection_test_failed') {
        setStatus(`Não foi possível ativar. Teste de conexão falhou (${data.message ?? 'erro'}).`);
      } else {
        setStatus('Falha ao salvar configuracao.');
      }
      return;
    }

    setStatus(enabled ? 'Gateway ativado com segurança.' : 'Configuração salva.');
    await load();
  };

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='max-w-5xl mx-auto flex flex-col gap-8'>
        <header className='bg-white border border-ruah-100 rounded-3xl p-8'>
          <div className='flex items-center gap-3 mb-3'>
            <Plug size={18} className='text-accent-gold' />
            <span className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Pagamento em 3 Passos</span>
          </div>
          <h1 className='text-3xl font-serif italic uppercase text-ruah-950'>Conectar Gateway</h1>
          <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400 mt-3'>Escolha, preencha e ative com seguranca sem depender de desenvolvedor.</p>
        </header>

        <section className='bg-white border border-ruah-100 rounded-3xl p-8 flex flex-col gap-6'>
          <div className='rounded-2xl border border-ruah-100 bg-ruah-25 p-5 flex flex-col gap-3'>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>Controle operacional</p>
              <button
                type='button'
                onClick={rollbackDefault}
                disabled={isSwitchingDefault || !preference.previousDefaultProvider}
                className='px-3 py-2 border border-ruah-200 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-50 inline-flex items-center gap-2'
              >
                <RefreshCw size={12} />
                Rollback padrao
              </button>
            </div>
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-700'>
              Padrao atual: {preference.defaultProvider ?? 'nao definido'}
            </p>
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>
              Anterior: {preference.previousDefaultProvider ?? 'nao disponivel'}
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {registry.map((item) => {
                const config = configs[item.key];
                return (
                  <div key={`state-${item.key}`} className='rounded-xl border border-ruah-100 bg-white p-3 flex items-center justify-between gap-3'>
                    <div className='flex flex-col gap-1'>
                      <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-700'>{item.label}</p>
                      <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>
                        {config?.enabled ? 'ativo' : 'inativo'} {config?.isDefault ? '| padrao' : ''}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => void setAsDefault(item.key)}
                      disabled={isSwitchingDefault || !config?.enabled || Boolean(config?.isDefault)}
                      className='px-3 py-2 border border-ruah-200 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-50 inline-flex items-center gap-2'
                    >
                      <ShieldCheck size={12} />
                      Definir padrao
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='grid grid-cols-3 gap-2 text-xs font-semibold uppercase tracking-[0.1em]'>
            <div className={`rounded-xl p-3 text-center ${step >= 1 ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-500'}`}>1. Escolher</div>
            <div className={`rounded-xl p-3 text-center ${step >= 2 ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-500'}`}>2. Preencher</div>
            <div className={`rounded-xl p-3 text-center ${step >= 3 ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-500'}`}>3. Testar e Ativar</div>
          </div>

          {step === 1 && (
            <div className='flex flex-col gap-4'>
              <label className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>Escolha seu meio de pagamento</label>
              <select
                value={provider}
                onChange={(event) => {
                  const next = event.target.value as PaymentProviderKey;
                  setProvider(next);
                  applyConfigToForm(next, configs, requirements);
                }}
                className='h-11 rounded-xl border border-ruah-100 bg-white px-3 text-sm font-bold text-ruah-950 outline-none focus:border-accent-gold'
              >
                {registry.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                type='button'
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
                className='px-4 py-3 bg-ruah-950 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-50'
              >
                Continuar
              </button>
            </div>
          )}

          {step === 2 && (
            <div className='flex flex-col gap-4'>
              <label className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>Preencha os dados obrigatorios</label>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {(providerRequirement?.fields ?? []).map((field) => (
                  <input
                    key={field.key}
                    value={settings[field.key] ?? ''}
                    onChange={(event) => setSettings((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    placeholder={`${field.label}${field.required ? ' *' : ''}`}
                    className='h-11 rounded-xl border border-ruah-100 px-3 text-sm'
                  />
                ))}
              </div>
              {missingRequired.length > 0 && (
                <p className='text-xs font-semibold uppercase tracking-[0.1em] text-amber-700'>Preencha todos os campos obrigatorios para continuar.</p>
              )}
              <div className='flex gap-3'>
                <button type='button' onClick={() => setStep(1)} className='px-4 py-3 border border-ruah-200 rounded-xl text-xs font-semibold uppercase tracking-[0.1em]'>
                  Voltar
                </button>
                <button
                  type='button'
                  disabled={!canGoStep3}
                  onClick={() => setStep(3)}
                  className='px-4 py-3 bg-ruah-950 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-50'
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className='flex flex-col gap-4'>
              <label className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>Teste a conexao e ative</label>
              <label className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>
                <input type='checkbox' checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                Ativar no checkout apos validar conexao
              </label>
              <div className='flex gap-3'>
                <button type='button' onClick={() => setStep(2)} className='px-4 py-3 border border-ruah-200 rounded-xl text-xs font-semibold uppercase tracking-[0.1em]'>
                  Voltar
                </button>
                <button
                  type='button'
                  onClick={testConnection}
                  disabled={isTesting}
                  className='px-4 py-3 border border-ruah-200 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                >
                  <CheckCircle2 size={14} />
                  {isTesting ? 'Testando...' : 'Testar conexao'}
                </button>
                <button
                  type='button'
                  onClick={save}
                  disabled={isSaving || (enabled && !testPassed)}
                  className='px-4 py-3 bg-ruah-950 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                >
                  <Save size={14} />
                  {isSaving ? 'Salvando...' : enabled ? 'Salvar e ativar' : 'Salvar'}
                </button>
              </div>
              {enabled && !testPassed && <p className='text-xs font-semibold uppercase tracking-[0.1em] text-amber-700'>Ativacao segura exige teste de conexao aprovado.</p>}
            </div>
          )}

          {status && (
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500 inline-flex items-center gap-2'>
              <AlertCircle size={14} />
              {status}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}


