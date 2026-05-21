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

function nextActionFromMethod(method: PaymentMethod): ProviderChargeResult['nextAction'] {
  return method === 'card' ? 'none' : method === 'pix' ? 'await_pix_confirmation' : 'await_wallet_confirmation';
}

function parseGatewayStatus(input: unknown): PaymentStatus {
  if (input === 'approved' || input === 'failed' || input === 'processing' || input === 'created') {
    return input;
  }
  return 'processing';
}

class SandboxProvider implements PaymentProvider {
  async createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult> {
    const providerReference = `sandbox_${payload.method}_${Date.now()}`;
    const status: PaymentStatus = 'processing';

    return {
      providerReference,
      status,
      method: payload.method,
      nextAction: nextActionFromMethod(payload.method),
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
      nextAction: nextActionFromMethod(payload.method),
    };
  }
}

class GatewayRealProvider implements PaymentProvider {
  async createCharge(payload: CheckoutPaymentPayload): Promise<ProviderChargeResult> {
    const baseUrl = process.env.PAYMENT_GATEWAY_BASE_URL?.trim();
    const apiKey = process.env.PAYMENT_GATEWAY_API_KEY?.trim();
    const merchantId = process.env.PAYMENT_GATEWAY_MERCHANT_ID?.trim();

    if (!baseUrl || !apiKey || !merchantId) {
      throw new Error('gateway_real_not_configured');
    }

    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'x-merchant-id': merchantId,
      },
      body: JSON.stringify({
        orderId: payload.orderId,
        method: payload.method,
        amount: payload.amount,
        currency: payload.currency,
        items: payload.items,
      }),
    });

    if (!response.ok) {
      throw new Error(`gateway_real_charge_failed:${response.status}`);
    }

    const data = (await response.json()) as {
      providerReference?: string;
      status?: string;
      method?: PaymentMethod;
    };

    if (!data?.providerReference || typeof data.providerReference !== 'string') {
      throw new Error('gateway_real_invalid_response');
    }

    const method = data.method && (data.method === 'card' || data.method === 'pix' || data.method === 'wallet') ? data.method : payload.method;
    const status = parseGatewayStatus(data.status);

    return {
      providerReference: data.providerReference,
      status,
      method,
      nextAction: nextActionFromMethod(method),
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase() ?? 'sandbox';

  switch (provider) {
    case 'gateway_real':
      return new GatewayRealProvider();
    case 'gateway_sandbox':
      return new GatewaySandboxProvider();
    case 'sandbox':
    default:
      return new SandboxProvider();
  }
}
