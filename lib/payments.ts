export type PaymentMethod = 'card' | 'pix' | 'wallet';
export type PaymentStatus = 'created' | 'processing' | 'approved' | 'failed';

export interface CheckoutPaymentPayload {
  orderId: string;
  method: PaymentMethod;
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
  method: PaymentMethod;
  amount: number;
  currency: 'BRL';
  status: PaymentStatus;
  providerReference: string;
  createdAt: string;
  approvedAt?: string;
}
