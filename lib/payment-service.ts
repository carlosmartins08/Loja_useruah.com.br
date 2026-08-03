import { createHmac, timingSafeEqual } from 'crypto';
import {
  appendPaymentEvent,
  createPaymentRecord,
  findPaymentByOrderId,
  findPaymentByProviderReference,
  getPaymentByIdempotencyKey,
  linkIdempotencyKey,
  updatePaymentStatus,
} from '@/lib/payment-store';
import {
  applyPaymentApprovedTransaction,
  PaymentApprovedTransactionError,
} from '@/lib/payment-approved-outbox-store';
import { getPaymentProvider } from '@/lib/payment-provider';
import type { CheckoutPaymentPayload, PaymentCheckoutRequest, PaymentRecord, PaymentStatus } from '@/lib/payments';
import { getPaymentGateway } from '@/lib/payment-gateway-registry';
import { getPaymentConnectorConfigPlain, resolveDefaultPaymentProvider } from '@/lib/payment-connector-store';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getOrder } from '@/lib/order-store';
import { isWebhookEventProcessed, markWebhookEventProcessed } from '@/lib/webhook-event-store';
import { appendIntegrationLog } from '@/lib/integration-log-store';

export class PaymentFlowError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

export async function createPaymentWithIdempotency(
  payload: PaymentCheckoutRequest,
  idempotencyKey: string
): Promise<{ payment: PaymentRecord; nextAction: 'none' | 'await_pix_confirmation' | 'await_wallet_confirmation'; reused: boolean }> {
  const existing = await getPaymentByIdempotencyKey(idempotencyKey);
  if (existing) {
    if (existing.orderId !== payload.orderId) {
      throw new PaymentFlowError(409, 'idempotency_key_order_conflict');
    }
    return {
      payment: existing,
      nextAction:
        existing.method === 'card'
          ? 'none'
          : existing.method === 'pix'
            ? 'await_pix_confirmation'
            : 'await_wallet_confirmation',
      reused: true,
    };
  }

  const order = await getOrder(payload.orderId);
  if (!order) {
    throw new PaymentFlowError(404, 'order_not_found');
  }

  if (order.status !== 'placed') {
    throw new PaymentFlowError(409, 'invalid_transition');
  }

  const previousPayment = await findPaymentByOrderId(payload.orderId);
  if (previousPayment && previousPayment.status === 'processing') {
    throw new PaymentFlowError(409, 'invalid_transition');
  }

  const selectedProvider = payload.provider ?? (await resolveDefaultPaymentProvider('sandbox'));
  const gateway = getPaymentGateway(selectedProvider);
  const connector = await getPaymentConnectorConfigPlain(selectedProvider);
  const enabledByConnector = connector ? connector.enabled : gateway?.enabled ?? false;
  if (!gateway || !enabledByConnector) {
    throw new PaymentFlowError(422, 'provider_not_available');
  }
  if (!gateway.methods.includes(payload.method)) {
    throw new PaymentFlowError(422, 'provider_method_not_supported');
  }

  const chargePayload: CheckoutPaymentPayload = {
    orderId: order.orderId,
    method: payload.method,
    provider: selectedProvider,
    amount: order.totalAmount,
    currency: 'BRL',
    items: order.items.map((item) => ({
      id: item.orderItemId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      spec: item.variantLabel,
    })),
  };

  const provider = getPaymentProvider(selectedProvider);
  const charge = await provider.createCharge(chargePayload);
  await appendIntegrationLog({
    provider: selectedProvider,
    action: 'create_charge',
    requestPayload: {
      orderId: chargePayload.orderId,
      method: chargePayload.method,
      amount: chargePayload.amount,
      currency: chargePayload.currency,
      itemsCount: chargePayload.items.length,
    },
    responsePayload: {
      providerReference: charge.providerReference,
      status: charge.status,
      nextAction: charge.nextAction,
    },
    statusCode: 200,
    success: true,
  });

  const payment = await createPaymentRecord({
    payload: chargePayload,
    orderId: order.orderId,
    provider: selectedProvider,
    providerReference: charge.providerReference,
    status: charge.status,
  });

  await linkIdempotencyKey(idempotencyKey, payment.paymentId);
  await appendPaymentEvent({
    paymentId: payment.paymentId,
    event: 'payment.checkout_started',
    fromStatus: 'created',
    toStatus: payment.status,
    meta: JSON.stringify({ method: payment.method, orderId: payment.orderId }),
  });
  appendAuditLog({
    actor_id: 'system',
    actor_role: 'backend',
    action: 'payment.checkout_started',
    entity_type: 'Payment',
    entity_id: payment.paymentId,
    previous_status: 'created',
    new_status: payment.status,
    reason: 'checkout_started',
  });

  return { payment, nextAction: charge.nextAction, reused: false };
}

function mapApprovedTransactionError(error: PaymentApprovedTransactionError): PaymentFlowError {
  if (error.code === 'order_not_found') return new PaymentFlowError(404, error.code);
  if (error.code === 'invalid_transition') return new PaymentFlowError(409, error.code);
  if (error.code === 'mysql_required_for_payment_approved') return new PaymentFlowError(503, error.code);
  if (error.code === 'provider_webhook_event_not_found' || error.code === 'provider_webhook_event_state_conflict') {
    return new PaymentFlowError(409, error.code);
  }
  return new PaymentFlowError(500, error.code);
}

export async function applyWebhookEvent(input: {
  provider: string;
  providerReference: string;
  eventId: string;
  event: 'payment.approved' | 'payment.failed' | 'payment.pending';
  injectFailureBeforeCommit?: boolean;
}) {
  if (input.event === 'payment.approved') {
    try {
      return await applyPaymentApprovedTransaction({
        provider: input.provider,
        providerReference: input.providerReference,
        providerEventId: input.eventId,
        injectFailureBeforeCommit: input.injectFailureBeforeCommit,
      });
    } catch (error) {
      if (error instanceof PaymentApprovedTransactionError) {
        throw mapApprovedTransactionError(error);
      }
      throw error;
    }
  }

  if (await isWebhookEventProcessed(input.eventId)) {
    return { kind: 'already_processed' as const };
  }

  const payment = await findPaymentByProviderReference(input.providerReference);
  if (!payment) return { kind: 'not_found' as const };

  const status: PaymentStatus = input.event === 'payment.failed' ? 'failed' : 'processing';
  if (payment.status !== 'processing') {
    throw new PaymentFlowError(409, 'invalid_transition');
  }

  const updatedPayment = await updatePaymentStatus(payment.paymentId, status);
  if (!updatedPayment) return { kind: 'not_found' as const };
  await appendPaymentEvent({
    paymentId: updatedPayment.paymentId,
    event: input.event,
    fromStatus: payment.status,
    toStatus: updatedPayment.status,
    meta: JSON.stringify({ providerReference: input.providerReference, eventId: input.eventId }),
  });

  appendAuditLog({
    actor_id: 'system',
    actor_role: 'webhook',
    action: input.event,
    entity_type: 'Payment',
    entity_id: updatedPayment.paymentId,
    previous_status: payment.status,
    new_status: updatedPayment.status,
    reason: 'webhook_event',
  });

  await markWebhookEventProcessed(input.eventId);
  return { kind: 'processed' as const, payment: updatedPayment };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  if (!signature) return false;

  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}
