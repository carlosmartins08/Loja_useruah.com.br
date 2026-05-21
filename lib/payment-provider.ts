import type { CheckoutPaymentPayload, PaymentMethod, PaymentStatus } from '@/lib/payments';

export interface ProviderChargeResult {
  providerReference: string;
  status: PaymentStatus;
  nextAction: 'none' | 'await_pix_confirmation' | 'await_wallet_confirmation';
  method: PaymentMethod;
}

export interface PaymentProvider {
  createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult>;
}

class SandboxProvider implements PaymentProvider {
  async createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult> {
    const providerReference = `sandbox_${payload.method}_${Date.now()}`;
    const status: PaymentStatus = 'processing';

    return {
      providerReference,
      status,
      method: payload.method,
      nextAction:
        payload.method === 'card'
          ? 'none'
          : payload.method === 'pix'
            ? 'await_pix_confirmation'
            : 'await_wallet_confirmation',
    };
  }
}

class GatewaySandboxProvider implements PaymentProvider {
  async createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult> {
    const gatewayName = process.env.PAYMENT_GATEWAY_NAME?.trim() || 'gateway_sandbox';
    const providerReference = `${gatewayName}_${payload.method}_${Date.now()}`;
    const status: PaymentStatus = 'processing';

    // Gateway sandbox homologado: simula protocolo externo sem confirmar pagamento no checkout.
    // A confirmação continua exclusiva por webhook para preservar comportamento de produção.
    return {
      providerReference,
      status,
      method: payload.method,
      nextAction:
        payload.method === 'card'
          ? 'none'
          : payload.method === 'pix'
            ? 'await_pix_confirmation'
            : 'await_wallet_confirmation',
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase() ?? 'sandbox';

  switch (provider) {
    case 'gateway_sandbox':
      return new GatewaySandboxProvider();
    case 'sandbox':
    default:
      return new SandboxProvider();
  }
}
