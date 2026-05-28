import type { CheckoutPaymentPayload, PaymentMethod, PaymentProviderKey, PaymentStatus } from '@/lib/payments';
import { getPaymentConnectorConfigPlain } from '@/lib/payment-connector-store';

export interface ProviderChargeResult {
  providerReference: string;
  status: PaymentStatus;
  nextAction: 'none' | 'await_pix_confirmation' | 'await_wallet_confirmation';
  method: PaymentMethod;
}

export interface PaymentProvider {
  createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult>;
}

type GatewayAuthMode = 'bearer_static' | 'oauth_client_credentials';

interface GatewayConfig {
  providerKey: PaymentProviderKey;
  baseUrlEnv: string;
  chargePathEnv?: string;
  authMode: GatewayAuthMode;
  apiKeyEnv?: string;
  tokenUrlEnv?: string;
  clientIdEnv?: string;
  clientSecretEnv?: string;
  merchantIdEnv?: string;
}

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<PaymentProviderKey, TokenCacheEntry>();

function nextActionFromMethod(method: PaymentMethod): ProviderChargeResult['nextAction'] {
  return method === 'card' ? 'none' : method === 'pix' ? 'await_pix_confirmation' : 'await_wallet_confirmation';
}

function parseGatewayStatus(input: unknown): PaymentStatus {
  if (typeof input !== 'string') return 'processing';
  const value = input.toLowerCase();
  if (value.includes('approved') || value.includes('paid') || value.includes('succeeded') || value.includes('success')) return 'approved';
  if (value.includes('failed') || value.includes('denied') || value.includes('canceled') || value.includes('cancelled')) return 'failed';
  if (value.includes('created') || value.includes('new')) return 'created';
  if (value.includes('refunded')) return 'refunded';
  return 'processing';
}

function parseProviderReference(data: Record<string, unknown>) {
  const candidate =
    data.providerReference ??
    data.provider_reference ??
    data.reference ??
    data.paymentId ??
    data.payment_id ??
    data.transactionId ??
    data.transaction_id ??
    data.id;
  return typeof candidate === 'string' && candidate.trim() ? candidate : null;
}

function parseMethod(data: Record<string, unknown>, fallback: PaymentMethod): PaymentMethod {
  const candidate = data.method;
  if (candidate === 'card' || candidate === 'pix' || candidate === 'wallet') return candidate;
  return fallback;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

async function getOAuthToken(config: GatewayConfig, persistedSettings?: Record<string, string>): Promise<string> {
  const cached = tokenCache.get(config.providerKey);
  if (cached && cached.expiresAt > Date.now() + 5000) {
    return cached.token;
  }

  const tokenUrl = persistedSettings?.tokenUrl?.trim() || process.env[config.tokenUrlEnv ?? '']?.trim();
  const clientId = persistedSettings?.clientId?.trim() || process.env[config.clientIdEnv ?? '']?.trim();
  const clientSecret = persistedSettings?.clientSecret?.trim() || process.env[config.clientSecretEnv ?? '']?.trim();
  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error(`gateway_token_not_configured:${config.providerKey}`);
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`gateway_token_failed:${config.providerKey}:${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error(`gateway_token_invalid_response:${config.providerKey}`);
  }

  const ttlMs = Math.max(30, Number(data.expires_in ?? 300)) * 1000;
  tokenCache.set(config.providerKey, {
    token: data.access_token,
    expiresAt: Date.now() + ttlMs,
  });
  return data.access_token;
}

class SandboxProvider implements PaymentProvider {
  async createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult> {
    const providerReference = `sandbox_${payload.method}_${Date.now()}`;
    return {
      providerReference,
      status: 'processing',
      method: payload.method,
      nextAction: nextActionFromMethod(payload.method),
    };
  }
}

class GatewaySandboxProvider implements PaymentProvider {
  constructor(private readonly providerKey: PaymentProviderKey = 'gateway_sandbox') {}

  async createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult> {
    return {
      providerReference: `${this.providerKey}_${payload.method}_${Date.now()}`,
      status: 'processing',
      method: payload.method,
      nextAction: nextActionFromMethod(payload.method),
    };
  }
}

class ConfigurableGatewayProvider implements PaymentProvider {
  constructor(private readonly config: GatewayConfig) {}

  async createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult> {
    const persisted = await getPaymentConnectorConfigPlain(this.config.providerKey);
    const baseUrl = persisted?.settings.baseUrl?.trim() || process.env[this.config.baseUrlEnv]?.trim();
    if (!baseUrl) {
      throw new Error(`gateway_not_configured:${this.config.providerKey}:missing_base_url`);
    }

    const chargePath = persisted?.settings.chargePath?.trim() || process.env[this.config.chargePathEnv ?? '']?.trim() || '/charges';
    const merchantId = persisted?.settings.merchantId?.trim() || (this.config.merchantIdEnv ? process.env[this.config.merchantIdEnv]?.trim() : undefined);
    const token =
      this.config.authMode === 'oauth_client_credentials'
        ? await getOAuthToken(this.config, persisted?.settings)
        : persisted?.settings.apiKey?.trim() || process.env[this.config.apiKeyEnv ?? '']?.trim();

    if (!token) {
      throw new Error(`gateway_not_configured:${this.config.providerKey}:missing_auth_token`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-payment-provider': this.config.providerKey,
    };
    if (merchantId) {
      headers['x-merchant-id'] = merchantId;
    }

    const response = await fetch(`${normalizeBaseUrl(baseUrl)}${chargePath.startsWith('/') ? chargePath : `/${chargePath}`}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId: payload.orderId,
        method: payload.method,
        amount: payload.amount,
        currency: payload.currency,
        items: payload.items,
      }),
    });

    if (!response.ok) {
      throw new Error(`gateway_charge_failed:${this.config.providerKey}:${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const providerReference = parseProviderReference(data);
    if (!providerReference) {
      throw new Error(`gateway_invalid_response:${this.config.providerKey}`);
    }

    const method = parseMethod(data, payload.method);
    return {
      providerReference,
      status: parseGatewayStatus(data.status),
      method,
      nextAction: nextActionFromMethod(method),
    };
  }
}

class StripeNativeProvider implements PaymentProvider {
  async createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult> {
    const persisted = await getPaymentConnectorConfigPlain('stripe');
    const baseUrl = persisted?.settings.baseUrl?.trim() || process.env.PAYMENT_STRIPE_BASE_URL?.trim();
    const apiKey = persisted?.settings.apiKey?.trim() || process.env.PAYMENT_STRIPE_API_KEY?.trim();
    if (!baseUrl) {
      throw new Error('gateway_not_configured:stripe:missing_base_url');
    }
    if (!apiKey) {
      throw new Error('gateway_not_configured:stripe:missing_auth_token');
    }

    const amountInCents = Math.round(payload.amount * 100);
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      throw new Error('gateway_invalid_request:stripe:invalid_amount');
    }

    const body = new URLSearchParams();
    body.set('amount', String(amountInCents));
    body.set('currency', payload.currency.toLowerCase());
    body.set('description', `Order ${payload.orderId}`);
    body.set('metadata[orderId]', payload.orderId);
    body.set('metadata[method]', payload.method);
    body.set('automatic_payment_methods[enabled]', 'true');

    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/v1/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-payment-provider': 'stripe',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`gateway_charge_failed:stripe:${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const providerReference = parseProviderReference(data);
    if (!providerReference) {
      throw new Error('gateway_invalid_response:stripe');
    }

    return {
      providerReference,
      status: parseGatewayStatus(data.status),
      method: payload.method,
      nextAction: nextActionFromMethod(payload.method),
    };
  }
}

function providerConfig(provider: PaymentProviderKey): GatewayConfig | null {
  switch (provider) {
    case 'inter':
      return {
        providerKey: 'inter',
        baseUrlEnv: 'PAYMENT_INTER_BASE_URL',
        chargePathEnv: 'PAYMENT_INTER_CHARGE_PATH',
        authMode: 'oauth_client_credentials',
        tokenUrlEnv: 'PAYMENT_INTER_TOKEN_URL',
        clientIdEnv: 'PAYMENT_INTER_CLIENT_ID',
        clientSecretEnv: 'PAYMENT_INTER_CLIENT_SECRET',
      };
    case 'infinitepay':
      return {
        providerKey: 'infinitepay',
        baseUrlEnv: 'PAYMENT_INFINITEPAY_BASE_URL',
        chargePathEnv: 'PAYMENT_INFINITEPAY_CHARGE_PATH',
        authMode: 'bearer_static',
        apiKeyEnv: 'PAYMENT_INFINITEPAY_API_KEY',
        merchantIdEnv: 'PAYMENT_INFINITEPAY_MERCHANT_ID',
      };
    case 'mercadopago':
      return {
        providerKey: 'mercadopago',
        baseUrlEnv: 'PAYMENT_MERCADOPAGO_BASE_URL',
        chargePathEnv: 'PAYMENT_MERCADOPAGO_CHARGE_PATH',
        authMode: 'bearer_static',
        apiKeyEnv: 'PAYMENT_MERCADOPAGO_API_KEY',
      };
    case 'pagarme':
      return {
        providerKey: 'pagarme',
        baseUrlEnv: 'PAYMENT_PAGARME_BASE_URL',
        chargePathEnv: 'PAYMENT_PAGARME_CHARGE_PATH',
        authMode: 'bearer_static',
        apiKeyEnv: 'PAYMENT_PAGARME_API_KEY',
      };
    case 'cielo':
      return {
        providerKey: 'cielo',
        baseUrlEnv: 'PAYMENT_CIELO_BASE_URL',
        chargePathEnv: 'PAYMENT_CIELO_CHARGE_PATH',
        authMode: 'bearer_static',
        apiKeyEnv: 'PAYMENT_CIELO_API_KEY',
        merchantIdEnv: 'PAYMENT_CIELO_MERCHANT_ID',
      };
    case 'stripe':
      return null;
    case 'gateway_real':
      return {
        providerKey: 'gateway_real',
        baseUrlEnv: 'PAYMENT_GATEWAY_BASE_URL',
        chargePathEnv: 'PAYMENT_GATEWAY_CHARGE_PATH',
        authMode: 'bearer_static',
        apiKeyEnv: 'PAYMENT_GATEWAY_API_KEY',
        merchantIdEnv: 'PAYMENT_GATEWAY_MERCHANT_ID',
      };
    default:
      return null;
  }
}

export function getPaymentProvider(providerKey?: PaymentProviderKey): PaymentProvider {
  const provider = providerKey ?? ((process.env.PAYMENT_PROVIDER?.toLowerCase() as PaymentProviderKey | undefined) ?? 'sandbox');

  if (provider === 'sandbox') return new SandboxProvider();
  if (provider === 'gateway_sandbox') return new GatewaySandboxProvider('gateway_sandbox');
  if (provider === 'stripe') return new StripeNativeProvider();

  const config = providerConfig(provider);
  if (config) return new ConfigurableGatewayProvider(config);

  return new SandboxProvider();
}
