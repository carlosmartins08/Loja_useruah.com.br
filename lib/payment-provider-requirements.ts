import type { PaymentProviderKey } from '@/lib/payments';

export interface ProviderFieldRequirement {
  key: string;
  label: string;
  required: boolean;
  placeholder: string;
}

export interface ProviderRequirement {
  provider: PaymentProviderKey;
  fields: ProviderFieldRequirement[];
  defaults: Record<string, string>;
}

const MAP: Partial<Record<PaymentProviderKey, ProviderRequirement>> = {
  inter: {
    provider: 'inter',
    fields: [
      { key: 'baseUrl', label: 'Base URL', required: true, placeholder: 'https://api.inter...' },
      { key: 'tokenUrl', label: 'Token URL', required: true, placeholder: 'https://.../oauth/v2/token' },
      { key: 'clientId', label: 'Client ID', required: true, placeholder: 'client_id' },
      { key: 'clientSecret', label: 'Client Secret', required: true, placeholder: 'client_secret' },
    ],
    defaults: {
      tokenUrl: 'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
    },
  },
  infinitepay: {
    provider: 'infinitepay',
    fields: [
      { key: 'baseUrl', label: 'Base URL', required: true, placeholder: 'https://api....' },
      { key: 'apiKey', label: 'API Key', required: true, placeholder: 'sk_...' },
    ],
    defaults: {},
  },
  mercadopago: {
    provider: 'mercadopago',
    fields: [
      { key: 'baseUrl', label: 'Base URL', required: true, placeholder: 'https://api.mercadopago.com' },
      { key: 'apiKey', label: 'API Key', required: true, placeholder: 'APP_USR-...' },
    ],
    defaults: {
      baseUrl: 'https://api.mercadopago.com',
    },
  },
  pagarme: {
    provider: 'pagarme',
    fields: [
      { key: 'baseUrl', label: 'Base URL', required: true, placeholder: 'https://api.pagar.me' },
      { key: 'apiKey', label: 'API Key', required: true, placeholder: 'ak_...' },
    ],
    defaults: {},
  },
  cielo: {
    provider: 'cielo',
    fields: [
      { key: 'baseUrl', label: 'Base URL', required: true, placeholder: 'https://api.cielo.com.br' },
      { key: 'apiKey', label: 'API Key', required: true, placeholder: 'api-key' },
      { key: 'merchantId', label: 'Merchant ID', required: true, placeholder: 'merchant-id' },
    ],
    defaults: {},
  },
  stripe: {
    provider: 'stripe',
    fields: [
      { key: 'baseUrl', label: 'Base URL', required: true, placeholder: 'https://api.stripe.com' },
      { key: 'apiKey', label: 'API Key', required: true, placeholder: 'sk_live_...' },
    ],
    defaults: {
      baseUrl: 'https://api.stripe.com',
    },
  },
};

export function getProviderRequirement(provider: PaymentProviderKey): ProviderRequirement | null {
  return MAP[provider] ?? null;
}

export function validateProviderSettings(provider: PaymentProviderKey, settings: Record<string, string>) {
  const requirement = getProviderRequirement(provider);
  if (!requirement) return { ok: true, missing: [] as string[] };
  const missing = requirement.fields
    .filter((field) => field.required)
    .map((field) => field.key)
    .filter((key) => !settings[key] || !settings[key].trim());
  return {
    ok: missing.length === 0,
    missing,
  };
}

