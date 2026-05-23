import type { PaymentProviderKey } from '@/lib/payments';

export interface ConnectorTestResult {
  ok: boolean;
  provider: PaymentProviderKey;
  statusCode: number;
  message: string;
  detail?: string;
}

function missing(...keys: string[]) {
  return { ok: false, statusCode: 422, message: 'missing_required_settings', detail: keys.join(', ') };
}

function ensure(setting: Record<string, string>, ...keys: string[]) {
  const absent = keys.filter((key) => !setting[key] || !setting[key].trim());
  if (absent.length > 0) return missing(...absent);
  return null;
}

async function testInter(settings: Record<string, string>) {
  const invalid = ensure(settings, 'tokenUrl', 'clientId', 'clientSecret');
  if (invalid) return invalid;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: settings.clientId.trim(),
    client_secret: settings.clientSecret.trim(),
  });
  const response = await fetch(settings.tokenUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) {
    return { ok: false, statusCode: response.status, message: 'oauth_token_failed' };
  }
  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    return { ok: false, statusCode: response.status, message: 'oauth_token_missing' };
  }
  return { ok: true, statusCode: response.status, message: 'oauth_token_ok' };
}

async function testBearerProvider(settings: Record<string, string>, provider: PaymentProviderKey) {
  const invalid = ensure(settings, 'baseUrl', 'apiKey');
  if (invalid) return invalid;
  const probePath = settings.probePath?.trim() || '/';
  const baseUrl = settings.baseUrl.trim().replace(/\/+$/, '');
  const url = `${baseUrl}${probePath.startsWith('/') ? probePath : `/${probePath}`}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      ...(settings.merchantId ? { 'x-merchant-id': settings.merchantId.trim() } : {}),
      'x-payment-provider': provider,
    },
  });
  if (response.status === 401) {
    return { ok: false, statusCode: 401, message: 'invalid_credentials' };
  }
  if (response.status >= 500) {
    return { ok: false, statusCode: response.status, message: 'provider_unavailable' };
  }
  return { ok: true, statusCode: response.status, message: 'provider_reachable' };
}

export async function runPaymentConnectorTest(provider: PaymentProviderKey, settings: Record<string, string>): Promise<ConnectorTestResult> {
  try {
    let result: { ok: boolean; statusCode: number; message: string; detail?: string };
    if (provider === 'inter') {
      result = await testInter(settings);
    } else if (provider === 'cielo') {
      const invalid = ensure(settings, 'baseUrl', 'apiKey', 'merchantId');
      result = invalid ?? (await testBearerProvider(settings, provider));
    } else if (provider === 'infinitepay' || provider === 'mercadopago' || provider === 'pagarme' || provider === 'stripe' || provider === 'gateway_real') {
      result = await testBearerProvider(settings, provider);
    } else {
      const invalid = ensure(settings, 'baseUrl');
      result = invalid ?? { ok: true, statusCode: 200, message: 'basic_config_ok' };
    }

    return {
      ...result,
      provider,
    };
  } catch (error) {
    return {
      ok: false,
      provider,
      statusCode: 0,
      message: 'connection_error',
      detail: error instanceof Error ? error.message : 'unknown_error',
    };
  }
}

