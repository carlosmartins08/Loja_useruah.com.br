import type { PaymentMethod, PaymentProviderKey } from '@/lib/payments';

export interface PaymentGatewayDescriptor {
  key: PaymentProviderKey;
  label: string;
  methods: PaymentMethod[];
  mode: 'sandbox' | 'bridge' | 'direct';
  envFlag?: string;
}

const REGISTRY: PaymentGatewayDescriptor[] = [
  { key: 'sandbox', label: 'Sandbox interno', methods: ['card', 'pix', 'wallet'], mode: 'sandbox' },
  { key: 'gateway_sandbox', label: 'Gateway sandbox', methods: ['card', 'pix', 'wallet'], mode: 'bridge' },
  { key: 'gateway_real', label: 'Gateway real (genérico)', methods: ['card', 'pix', 'wallet'], mode: 'bridge' },
  { key: 'inter', label: 'Inter', methods: ['pix'], mode: 'direct', envFlag: 'PAYMENT_ENABLE_INTER' },
  { key: 'infinitepay', label: 'InfinitePay', methods: ['card', 'pix'], mode: 'direct', envFlag: 'PAYMENT_ENABLE_INFINITEPAY' },
  { key: 'mercadopago', label: 'Mercado Pago', methods: ['card', 'pix', 'wallet'], mode: 'direct', envFlag: 'PAYMENT_ENABLE_MERCADOPAGO' },
  { key: 'pagarme', label: 'Pagar.me', methods: ['card', 'pix'], mode: 'direct', envFlag: 'PAYMENT_ENABLE_PAGARME' },
  { key: 'cielo', label: 'Cielo', methods: ['card'], mode: 'direct', envFlag: 'PAYMENT_ENABLE_CIELO' },
  { key: 'stripe', label: 'Stripe', methods: ['card', 'wallet'], mode: 'direct', envFlag: 'PAYMENT_ENABLE_STRIPE' },
];

function flagEnabled(name: string | undefined) {
  if (!name) return true;
  return process.env[name]?.toLowerCase() === 'true';
}

export function listPaymentGateways() {
  return REGISTRY.map((gateway) => ({
    ...gateway,
    enabled: flagEnabled(gateway.envFlag),
  }));
}

export function getPaymentGateway(key: string | undefined | null) {
  if (!key) return null;
  return listPaymentGateways().find((gateway) => gateway.key === key) ?? null;
}

