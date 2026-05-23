'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Plug, Save } from 'lucide-react';
import type { PaymentProviderKey } from '@/lib/payments';

interface RegistryItem {
  key: PaymentProviderKey;
  label: string;
  methods: string[];
  enabled: boolean;
}

interface ConfigItem {
  provider: PaymentProviderKey;
  enabled: boolean;
  settings: Record<string, string>;
  updatedAt: string;
  updatedBy: string;
}

export default function AdminPaymentConnectorsPage() {
  const [registry, setRegistry] = React.useState<RegistryItem[]>([]);
  const [configs, setConfigs] = React.useState<Record<string, ConfigItem>>({});
  const [provider, setProvider] = React.useState<PaymentProviderKey>('inter');
  const [enabled, setEnabled] = React.useState(false);
  const [baseUrl, setBaseUrl] = React.useState('');
  const [tokenUrl, setTokenUrl] = React.useState('');
  const [clientId, setClientId] = React.useState('');
  const [clientSecret, setClientSecret] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [merchantId, setMerchantId] = React.useState('');
  const [status, setStatus] = React.useState<string | null>(null);

  const applyConfigToForm = React.useCallback((selectedProvider: PaymentProviderKey, snapshot: Record<string, ConfigItem>) => {
    const current = snapshot[selectedProvider];
    if (!current) {
      setEnabled(false);
      setBaseUrl('');
      setTokenUrl('');
      setClientId('');
      setClientSecret('');
      setApiKey('');
      setMerchantId('');
      return;
    }
    setEnabled(current.enabled);
    setBaseUrl(current.settings.baseUrl ?? '');
    setTokenUrl(current.settings.tokenUrl ?? '');
    setClientId(current.settings.clientId ?? '');
    setClientSecret('');
    setApiKey('');
    setMerchantId(current.settings.merchantId ?? '');
  }, []);

  const load = React.useCallback(async () => {
    const response = await fetch('/api/admin/payment-connectors', { cache: 'no-store' });
    if (!response.ok) return;
    const data = (await response.json()) as { registry: RegistryItem[]; configs: ConfigItem[] };
    setRegistry(data.registry);
    const indexed: Record<string, ConfigItem> = {};
    for (const row of data.configs) indexed[row.provider] = row;
    setConfigs(indexed);
    applyConfigToForm(provider, indexed);
  }, [applyConfigToForm, provider]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const save = async () => {
    setStatus(null);
    const settings: Record<string, string> = {
      baseUrl,
      tokenUrl,
      clientId,
      clientSecret,
      apiKey,
      merchantId,
    };
    const response = await fetch('/api/admin/payment-connectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, enabled, settings }),
    });
    if (!response.ok) {
      setStatus('Falha ao salvar configuração.');
      return;
    }
    setStatus('Configuração salva com sucesso.');
    await load();
  };

  const testConnection = async () => {
    setStatus(null);
    const response = await fetch('/api/admin/payment-connectors/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string; statusCode?: number };
    if (data.ok) {
      setStatus(`Conexão validada (${data.statusCode}).`);
    } else {
      setStatus(`Conexão falhou: ${data.message ?? 'erro'}.`);
    }
  };

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='max-w-5xl mx-auto flex flex-col gap-8'>
        <header className='bg-white border border-ruah-100 rounded-3xl p-8'>
          <div className='flex items-center gap-3 mb-3'>
            <Plug size={18} className='text-accent-gold' />
            <span className='text-[10px] font-bold uppercase tracking-widest text-ruah-400'>Conectores de Pagamento</span>
          </div>
          <h1 className='text-3xl font-serif italic uppercase text-ruah-950'>Configuração Self-Service</h1>
          <p className='text-xs font-bold uppercase tracking-widest text-ruah-400 mt-3'>Salve credenciais com segurança e teste sem desenvolvedor.</p>
        </header>

        <section className='bg-white border border-ruah-100 rounded-3xl p-8 flex flex-col gap-4'>
          <label className='text-[9px] font-bold uppercase tracking-widest text-ruah-500'>Provider</label>
          <select
            value={provider}
            onChange={(event) => {
              const next = event.target.value as PaymentProviderKey;
              setProvider(next);
              applyConfigToForm(next, configs);
            }}
            className='h-11 rounded-xl border border-ruah-100 bg-white px-3 text-sm font-bold text-ruah-950 outline-none focus:border-accent-gold'
          >
            {registry.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label} ({item.key})
              </option>
            ))}
          </select>

          <label className='flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ruah-500'>
            <input type='checkbox' checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            Ativar provider
          </label>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder='baseUrl' className='h-11 rounded-xl border border-ruah-100 px-3 text-sm' />
            <input value={tokenUrl} onChange={(e) => setTokenUrl(e.target.value)} placeholder='tokenUrl (Inter OAuth)' className='h-11 rounded-xl border border-ruah-100 px-3 text-sm' />
            <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder='clientId' className='h-11 rounded-xl border border-ruah-100 px-3 text-sm' />
            <input value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder='clientSecret' className='h-11 rounded-xl border border-ruah-100 px-3 text-sm' />
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder='apiKey' className='h-11 rounded-xl border border-ruah-100 px-3 text-sm' />
            <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder='merchantId' className='h-11 rounded-xl border border-ruah-100 px-3 text-sm' />
          </div>

          <div className='flex gap-3'>
            <button type='button' onClick={save} className='px-4 py-3 bg-ruah-950 text-white rounded-xl text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2'>
              <Save size={14} />
              Salvar
            </button>
            <button type='button' onClick={testConnection} className='px-4 py-3 border border-ruah-200 rounded-xl text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2'>
              <CheckCircle2 size={14} />
              Testar conexão
            </button>
          </div>

          {status && (
            <p className='text-xs font-bold uppercase tracking-widest text-ruah-500 inline-flex items-center gap-2'>
              <AlertCircle size={14} />
              {status}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
