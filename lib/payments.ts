export type PaymentMethod = 'card' | 'pix' | 'wallet';
export type PaymentProviderKey =
  | 'sandbox'
  | 'gateway_sandbox'
  | 'gateway_real'
  | 'inter'
  | 'infinitepay'
  | 'mercadopago'
  | 'pagarme'
  | 'cielo'
  | 'stripe';
export type PaymentStatus =
  | 'created'
  | 'processing'
  | 'approved'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'chargeback';

export interface CheckoutPaymentPayload {
  orderId: string;
  method: PaymentMethod;
  provider?: PaymentProviderKey;
  amount: number;
  currency: 'BRL';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    spec?: string;
  }>;
}

export interface PaymentRecord {
  paymentId: string;
  orderId: string;
  provider: PaymentProviderKey;
  method: PaymentMethod;
  amount: number;
  currency: 'BRL';
  status: PaymentStatus;
  providerReference: string;
  createdAt: string;
  approvedAt?: string;
}
