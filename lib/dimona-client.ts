const DIMONA_DEFAULT_BASE_URL = 'https://admin.camisadimona.com.br';

export interface DimonaCreateOrderItem {
  name: string;
  sku: string;
  qty: number;
  dimona_sku_id: string;
  designs: string[];
  mocks?: string[];
}

export interface DimonaCreateOrderPayload {
  shipping_speed: 'pac' | 'sedex';
  order_id: string;
  customer_name: string;
  customer_email: string;
  items: DimonaCreateOrderItem[];
  webhook_url?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipcode: string;
    neighborhood?: string;
    phone?: string;
    country: string;
  };
}

function getBaseUrl() {
  const base = process.env.DIMONA_API_BASE_URL?.trim();
  return base && base.length > 0 ? base.replace(/\/+$/, '') : DIMONA_DEFAULT_BASE_URL;
}

function getApiKey() {
  const key = process.env.DIMONA_API_KEY?.trim();
  if (!key) throw new Error('dimona_api_key_missing');
  return key;
}

async function dimonaRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': getApiKey(),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response
    .json()
    .catch(() => ({ message: 'invalid_json_response' })) as unknown;

  return { ok: response.ok, status: response.status, payload };
}

export async function dimonaCreateOrder(input: DimonaCreateOrderPayload) {
  return dimonaRequest('/api/v2/order', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function dimonaGetOrder(orderId: string) {
  return dimonaRequest(`/api/v2/order/${encodeURIComponent(orderId)}`, {
    method: 'GET',
  });
}

export async function dimonaGetOrderTracking(orderId: string) {
  return dimonaRequest(`/api/v2/order/${encodeURIComponent(orderId)}/tracking`, {
    method: 'GET',
  });
}

export async function dimonaPing() {
  return dimonaRequest('/api/v2/orders', { method: 'GET' });
}

