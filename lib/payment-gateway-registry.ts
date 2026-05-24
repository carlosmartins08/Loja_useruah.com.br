import type { PaymentMethod, PaymentProviderKey } from '@/lib/payments';

export interface PaymentGatewayDescriptor {
  key: PaymentProviderKey;
  label: string;
  methods: PaymentMethod[];
  mode: 'sandbox' | 'bridge' | 'direct';
}

const REGISTRY: PaymentGatewayDescriptor[] = [
  { key: 'sandbox', label: 'Sandbox interno', methods: ['card', 'pix', 'wallet'], mode: 'sandbox' },
  { key: 'gateway_sandbox', label: 'Gateway sandbox', methods: ['card', 'pix', 'wallet'], mode: 'bridge' },
  { key: 'gateway_real', label: 'Gateway real (generico)', methods: ['card', 'pix', 'wallet'], mode: 'bridge' },
  { key: 'inter', label: 'Inter', methods: ['pix'], mode: 'direct' },
  { key: 'infinitepay', label: 'InfinitePay', methods: ['card', 'pix'], mode: 'direct' },
  { key: 'mercadopago', label: 'Mercado Pago', methods: ['card', 'pix', 'wallet'], mode: 'direct' },
  { key: 'pagarme', label: 'Pagar.me', methods: ['card', 'pix'], mode: 'direct' },
  { key: 'cielo', label: 'Cielo', methods: ['card'], mode: 'direct' },
  { key: 'stripe', label: 'Stripe', methods: ['card', 'wallet'], mode: 'direct' },
];

export function listPaymentGateways() {
  // Habilitacao de provider deve vir do painel de conectores (self-service), nao de env por provider.
  return REGISTRY.map((gateway) => ({
    ...gateway,
    enabled: true,
  }));
}

export function getPaymentGateway(key: string | undefined | null) {
  if (!key) return null;
  return listPaymentGateways().find((gateway) => gateway.key === key) ?? null;
}
