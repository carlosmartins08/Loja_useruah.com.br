import { appendAuditLog } from '@/lib/audit-log-store';
import { createChargebackEvent } from '@/lib/chargeback-store';
import { createImpactReview } from '@/lib/impact-review-store';
import { notifyImpactReviewEvent } from '@/lib/impact-notification-service';
import { updateLicenseEventsByOrderId } from '@/lib/license-event-store';
import { getOrder, updateOrderStatus } from '@/lib/order-store';
import { appendPaymentEvent, findPaymentByOrderId, findPaymentByProviderReference, updatePaymentStatus } from '@/lib/payment-store';
import { updatePaymentSplitsStatusByPaymentId } from '@/lib/payment-split-store';
import { createRefundRequested, getRefund, updateRefundStatus } from '@/lib/refund-store';

export class PaymentExceptionError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.status = status;
    this.code = code;
  }
}

function canTransitionOrderToCancelled(current: string) {
  return current === 'placed' || current === 'paid';
}

export async function cancelOrderWithFinancials(input: {
  orderId: string;
  actorId: string;
  actorRole: string;
  reason: string;
}) {
  const order = await getOrder(input.orderId);
  if (!order) throw new PaymentExceptionError(404, 'not_found');
  if (!canTransitionOrderToCancelled(order.status)) throw new PaymentExceptionError(409, 'invalid_transition');

  const updatedOrder = await updateOrderStatus(order.orderId, 'cancelled');
  if (!updatedOrder) throw new PaymentExceptionError(404, 'not_found');

  appendAuditLog({
    actor_id: input.actorId,
    actor_role: input.actorRole,
    action: 'order.cancelled',
    entity_type: 'Order',
    entity_id: updatedOrder.orderId,
    previous_status: order.status,
    new_status: updatedOrder.status,
    reason: input.reason,
  });

  const payment = await findPaymentByOrderId(order.orderId);
  if (!payment) return { order: updatedOrder, payment: null };

  if (payment.status === 'approved') {
    const updatedPayment = await updatePaymentStatus(payment.paymentId, 'refunded');
    if (updatedPayment) {
      await appendPaymentEvent({
        paymentId: payment.paymentId,
        event: 'payment.refunded',
        fromStatus: payment.status,
        toStatus: updatedPayment.status,
        meta: JSON.stringify({ reason: input.reason, source: 'order.cancel' }),
      });
    }
    await updatePaymentSplitsStatusByPaymentId(payment.paymentId, 'refunded');
    await updateLicenseEventsByOrderId(order.orderId, {
      paymentStatus: 'refunded',
      canceledAt: new Date().toISOString(),
      refundedAt: new Date().toISOString(),
    });
    return { order: updatedOrder, payment: updatedPayment };
  }

  return { order: updatedOrder, payment };
}

export async function requestRefund(input: {
  orderId: string;
  reason: string;
  actorId: string;
  idempotencyKey: string;
}) {
  const order = await getOrder(input.orderId);
  if (!order) throw new PaymentExceptionError(404, 'not_found');

  const payment = await findPaymentByOrderId(order.orderId);
  if (!payment) throw new PaymentExceptionError(404, 'payment_not_found');
  if (payment.status !== 'approved') throw new PaymentExceptionError(409, 'invalid_transition');

  const result = await createRefundRequested({
    orderId: order.orderId,
    paymentId: payment.paymentId,
    reason: input.reason,
    requestedBy: input.actorId,
    idempotencyKey: input.idempotencyKey,
  });

  if (result.created) {
    const impactReview = createImpactReview({
      domain: 'payout_finance',
      entityType: 'Refund',
      entityId: result.refund.refundId,
      sensitiveFields: ['refundDecision'],
      requestedBy: input.actorId,
      priority: 'high',
      slaHours: 2,
    });
    await notifyImpactReviewEvent({
      event: 'created_pending',
      reviewId: impactReview.review.reviewId,
      entityId: result.refund.refundId,
      actorId: input.actorId,
      actorRole: 'support_agent',
      dueAt: impactReview.review.dueAt,
    });
    appendAuditLog({
      actor_id: input.actorId,
      actor_role: 'support_agent',
      action: 'refund.requested',
      entity_type: 'Refund',
      entity_id: result.refund.refundId,
      previous_status: 'none',
      new_status: result.refund.status,
      reason: input.reason,
    });
  }

  return { refund: result.refund, reused: !result.created };
}

export async function approveRefund(input: { refundId: string; actorId: string }) {
  const refund = await getRefund(input.refundId);
  if (!refund) throw new PaymentExceptionError(404, 'not_found');
  if (refund.status !== 'requested') throw new PaymentExceptionError(409, 'invalid_transition');

  const payment = await updatePaymentStatus(refund.paymentId, 'refunded');
  if (!payment) throw new PaymentExceptionError(404, 'payment_not_found');

  await appendPaymentEvent({
    paymentId: payment.paymentId,
    event: 'payment.refunded',
    fromStatus: 'approved',
    toStatus: 'refunded',
    meta: JSON.stringify({ refundId: refund.refundId }),
  });

  await updatePaymentSplitsStatusByPaymentId(payment.paymentId, 'refunded');
  await updateLicenseEventsByOrderId(refund.orderId, {
    paymentStatus: 'refunded',
    refundedAt: new Date().toISOString(),
  });

  const updatedRefund = await updateRefundStatus(refund.refundId, { status: 'approved', approvedBy: input.actorId });
  if (!updatedRefund) throw new PaymentExceptionError(404, 'not_found');

  appendAuditLog({
    actor_id: input.actorId,
    actor_role: 'finance_admin',
    action: 'refund.approved',
    entity_type: 'Refund',
    entity_id: updatedRefund.refundId,
    previous_status: refund.status,
    new_status: updatedRefund.status,
    reason: 'manual_approval',
  });

  return updatedRefund;
}

export async function rejectRefund(input: { refundId: string; actorId: string; reason: string }) {
  const refund = await getRefund(input.refundId);
  if (!refund) throw new PaymentExceptionError(404, 'not_found');
  if (refund.status !== 'requested') throw new PaymentExceptionError(409, 'invalid_transition');

  const updatedRefund = await updateRefundStatus(refund.refundId, { status: 'rejected', rejectedBy: input.actorId });
  if (!updatedRefund) throw new PaymentExceptionError(404, 'not_found');

  appendAuditLog({
    actor_id: input.actorId,
    actor_role: 'finance_admin',
    action: 'refund.rejected',
    entity_type: 'Refund',
    entity_id: updatedRefund.refundId,
    previous_status: refund.status,
    new_status: updatedRefund.status,
    reason: input.reason,
  });

  return updatedRefund;
}

export async function processChargeback(input: {
  eventId: string;
  providerReference: string;
  reason?: string;
}) {
  const payment = await findPaymentByProviderReference(input.providerReference);
  if (!payment) throw new PaymentExceptionError(404, 'payment_not_found');

  const created = await createChargebackEvent({
    eventId: input.eventId,
    paymentId: payment.paymentId,
    orderId: payment.orderId,
    reason: input.reason,
  });
  if (!created.created) {
    return { alreadyProcessed: true, payment };
  }

  const impactReview = createImpactReview({
    domain: 'payout_finance',
    entityType: 'Chargeback',
    entityId: created.chargeback.eventId,
    sensitiveFields: ['chargebackDecision'],
    requestedBy: 'system',
    priority: 'high',
    slaHours: 2,
  });
  await notifyImpactReviewEvent({
    event: 'created_pending',
    reviewId: impactReview.review.reviewId,
    entityId: created.chargeback.eventId,
    actorId: 'system',
    actorRole: 'webhook',
    dueAt: impactReview.review.dueAt,
  });

  const shouldPreserveRefund = payment.status === 'refunded' || payment.status === 'partially_refunded';
  const nextStatus = shouldPreserveRefund ? payment.status : 'chargeback';
  const nextPayment = await updatePaymentStatus(payment.paymentId, nextStatus);
  if (!nextPayment) throw new PaymentExceptionError(404, 'payment_not_found');

  await appendPaymentEvent({
    paymentId: payment.paymentId,
    event: 'chargeback.received',
    fromStatus: payment.status,
    toStatus: nextPayment.status,
    meta: JSON.stringify({ eventId: input.eventId, reason: input.reason ?? null }),
  });

  await updatePaymentSplitsStatusByPaymentId(payment.paymentId, 'refunded');
  await updateLicenseEventsByOrderId(payment.orderId, {
    paymentStatus: 'refunded',
    refundedAt: new Date().toISOString(),
  });

  appendAuditLog({
    actor_id: 'system',
    actor_role: 'webhook',
    action: 'chargeback.received',
    entity_type: 'Payment',
    entity_id: payment.paymentId,
    previous_status: payment.status,
    new_status: nextPayment.status,
    reason: input.reason ?? 'chargeback_event',
  });

  return { alreadyProcessed: false, payment: nextPayment };
}
