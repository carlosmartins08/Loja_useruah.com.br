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
import { getPaymentProvider } from '@/lib/payment-provider';
import type { CheckoutPaymentPayload, PaymentRecord, PaymentStatus } from '@/lib/payments';
import { appendAuditLog } from '@/lib/audit-log-store';
import { createCommissionPending } from '@/lib/commission-store';
import { getOrder, updateOrderStatus } from '@/lib/order-store';
import { createQueuedProductionJob } from '@/lib/production-store';
import { isWebhookEventProcessed, markWebhookEventProcessed } from '@/lib/webhook-event-store';

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
  payload: CheckoutPaymentPayload,
  idempotencyKey: string
): Promise<{ payment: PaymentRecord; nextAction: 'none' | 'await_pix_confirmation' | 'await_wallet_confirmation'; reused: boolean }> {
  const existing = await getPaymentByIdempotencyKey(idempotencyKey);
  if (existing) {
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

  const provider = getPaymentProvider();
  const charge = await provider.createCharge(payload);

  const payment = await createPaymentRecord({
    payload,
    orderId: order.orderId,
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

export async function applyWebhookEvent(input: {
  providerReference: string;
  eventId: string;
  event: 'payment.approved' | 'payment.failed' | 'payment.pending';
}) {
  if (await isWebhookEventProcessed(input.eventId)) {
    return { kind: 'already_processed' as const };
  }

  const payment = await findPaymentByProviderReference(input.providerReference);
  if (!payment) return { kind: 'not_found' as const };

  const status: PaymentStatus =
    input.event === 'payment.approved' ? 'approved' : input.event === 'payment.failed' ? 'failed' : 'processing';

  if ((status === 'approved' || status === 'failed') && payment.status !== 'processing') {
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

  if (status === 'approved') {
    const order = await getOrder(updatedPayment.orderId);
    if (!order) {
      throw new PaymentFlowError(404, 'order_not_found');
    }
    if (order.status !== 'placed') {
      throw new PaymentFlowError(409, 'invalid_transition');
    }

    const paidOrder = await updateOrderStatus(order.orderId, 'paid');
    if (!paidOrder) {
      throw new PaymentFlowError(404, 'order_not_found');
    }

    appendAuditLog({
      actor_id: 'system',
      actor_role: 'webhook',
      action: 'order.paid',
      entity_type: 'Order',
      entity_id: paidOrder.orderId,
      previous_status: order.status,
      new_status: paidOrder.status,
      reason: 'payment.approved',
    });

    const production = await createQueuedProductionJob(order.orderId);
    if (production.created) {
      appendAuditLog({
        actor_id: 'system',
        actor_role: 'backend',
        action: 'production.created',
        entity_type: 'ProductionJob',
        entity_id: production.job.productionJobId,
        previous_status: 'none',
        new_status: production.job.status,
        reason: 'order.paid',
      });
    }

    const commissionRate = Number(process.env.COMMISSION_RATE ?? '0.15');
    const ownerId = process.env.COMMISSION_OWNER_DEFAULT_ID ?? 'artist-default';
    const ownerRole = (process.env.COMMISSION_OWNER_DEFAULT_ROLE ?? 'artist') as 'artist' | 'community_manager';
    const commissionAmount = Number((updatedPayment.amount * commissionRate).toFixed(2));
    const commissionResult = await createCommissionPending({
      orderId: order.orderId,
      ownerId,
      ownerRole,
      amount: commissionAmount,
      sourceKey: `order.paid:${order.orderId}`,
    });

    if (commissionResult.created) {
      appendAuditLog({
        actor_id: 'system',
        actor_role: 'backend',
        action: 'commission.created',
        entity_type: 'Commission',
        entity_id: commissionResult.commission.commissionId,
        previous_status: 'none',
        new_status: commissionResult.commission.status,
        reason: `order:${order.orderId}`,
      });
    }
  }

  await markWebhookEventProcessed(input.eventId);
  return { kind: 'processed' as const, payment: updatedPayment };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}
