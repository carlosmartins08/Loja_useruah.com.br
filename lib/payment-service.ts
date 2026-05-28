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
import { getPaymentGateway } from '@/lib/payment-gateway-registry';
import { getPaymentConnectorConfigPlain, resolveDefaultPaymentProvider } from '@/lib/payment-connector-store';
import { appendAuditLog } from '@/lib/audit-log-store';
import { createCommissionPending } from '@/lib/commission-store';
import { getOrder, updateOrderStatus } from '@/lib/order-store';
import { createQueuedProductionJob } from '@/lib/production-store';
import { isWebhookEventProcessed, markWebhookEventProcessed } from '@/lib/webhook-event-store';
import { createPaymentSplits } from '@/lib/payment-split-store';
import { createLicenseEvents } from '@/lib/license-event-store';
import { getCatalogItem } from '@/lib/catalog-item-store';
import { getArtwork } from '@/lib/artwork-store';
import { appendIntegrationLog } from '@/lib/integration-log-store';
import { getProviderRecipient } from '@/lib/provider-recipient-store';

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

  const provider = getPaymentProvider(selectedProvider);
  const charge = await provider.createCharge(payload);
  await appendIntegrationLog({
    provider: selectedProvider,
    action: 'create_charge',
    requestPayload: {
      orderId: payload.orderId,
      method: payload.method,
      amount: payload.amount,
      currency: payload.currency,
      itemsCount: payload.items.length,
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
    payload,
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

    const providerName = updatedPayment.provider;
    const supplierDefault = process.env.SUPPLIER_OWNER_DEFAULT_ID?.trim() || 'supplier-default';
    const platformDefault = process.env.PLATFORM_OWNER_DEFAULT_ID?.trim() || 'platform-default';
    const artistDefault = process.env.ARTIST_OWNER_DEFAULT_ID?.trim() || 'artist-default';
    const artistRecipient = await getProviderRecipient({
      provider: providerName,
      entityType: 'artist',
      entityId: artistDefault,
    });
    const platformRecipient = await getProviderRecipient({
      provider: providerName,
      entityType: 'platform',
      entityId: platformDefault,
    });
    const supplierPct = Number(process.env.SUPPLIER_REVENUE_PCT ?? '0.7');
    const artistPct = Number(process.env.ARTIST_LICENSE_PCT ?? '0.1');
    const platformPct = Number(process.env.PLATFORM_COMMISSION_PCT ?? '0.15');
    const gatewayPct = Number(process.env.GATEWAY_FEE_PCT ?? '0.05');
    const taxReservePct = Number(process.env.TAX_RESERVE_PCT ?? '0');
    const round2 = (value: number) => Math.round(value * 100) / 100;
    const splitRows = (
      await Promise.all(
        paidOrder.items.map(async (item) => {
          const supplierId = item.supplierId || supplierDefault;
          const supplierRecipient = await getProviderRecipient({
            provider: providerName,
            entityType: 'supplier',
            entityId: supplierId,
          });
      const gross = item.grossItemAmount || Number((item.unitPrice * item.quantity).toFixed(2));
      const supplierAmount = item.supplierAmount ?? round2(gross * supplierPct);
      const artistLicenseAmount = item.artistLicenseAmount ?? round2(gross * artistPct);
      const platformCommissionAmount = item.platformCommissionAmount ?? round2(gross * platformPct);
      const gatewayFeeAmount = item.gatewayFeeAmount ?? round2(gross * gatewayPct);
      const taxReserveAmount = item.taxReserveAmount ?? round2(gross * taxReservePct);
      const supplierNetAmount = item.supplierNetAmount ?? round2(supplierAmount - gatewayFeeAmount - taxReserveAmount);
      const artistNetAmount = item.artistNetAmount ?? artistLicenseAmount;
      const platformNetAmount = item.platformNetAmount ?? platformCommissionAmount;
      return [
        {
          orderId: paidOrder.orderId,
          orderItemId: item.orderItemId || `${paidOrder.orderId}:${item.catalogItemId}:${item.variantId}`,
          paymentId: updatedPayment.paymentId,
          recipientType: 'supplier' as const,
          recipientId: supplierId,
          providerRecipientId: supplierRecipient?.providerRecipientId,
          grossAmount: gross,
          splitAmount: supplierAmount,
          splitPercentage: gross > 0 ? Number((supplierAmount / gross).toFixed(4)) : 0,
          netAmount: supplierNetAmount,
          liable: false,
          chargeProcessingFee: true,
          status: 'available' as const,
          providerReference: updatedPayment.providerReference,
        },
        {
          orderId: paidOrder.orderId,
          orderItemId: item.orderItemId || `${paidOrder.orderId}:${item.catalogItemId}:${item.variantId}`,
          paymentId: updatedPayment.paymentId,
          recipientType: 'artist' as const,
          recipientId: artistDefault,
          providerRecipientId: artistRecipient?.providerRecipientId,
          grossAmount: gross,
          splitAmount: artistLicenseAmount,
          splitPercentage: gross > 0 ? Number((artistLicenseAmount / gross).toFixed(4)) : 0,
          netAmount: artistNetAmount,
          liable: false,
          chargeProcessingFee: false,
          status: 'available' as const,
          providerReference: updatedPayment.providerReference,
        },
        {
          orderId: paidOrder.orderId,
          orderItemId: item.orderItemId || `${paidOrder.orderId}:${item.catalogItemId}:${item.variantId}`,
          paymentId: updatedPayment.paymentId,
          recipientType: 'platform' as const,
          recipientId: platformDefault,
          providerRecipientId: platformRecipient?.providerRecipientId,
          grossAmount: gross,
          splitAmount: platformCommissionAmount,
          splitPercentage: gross > 0 ? Number((platformCommissionAmount / gross).toFixed(4)) : 0,
          netAmount: platformNetAmount,
          liable: true,
          chargeProcessingFee: false,
          status: 'available' as const,
          providerReference: updatedPayment.providerReference,
        },
      ];
        })
      )
    ).flat();
    await createPaymentSplits({ paymentId: updatedPayment.paymentId, rows: splitRows });

    const licenseRows = await Promise.all(paidOrder.items.map(async (item) => {
      const catalog = await getCatalogItem(item.catalogItemId);
      const artwork = catalog ? getArtwork(catalog.artworkId) : null;
      const gross = item.grossItemAmount || Number((item.unitPrice * item.quantity).toFixed(2));
      const artistLicenseAmount = item.artistLicenseAmount ?? round2(gross * artistPct);
      const platformCommissionAmount = item.platformCommissionAmount ?? round2(gross * platformPct);
      const supplierAmount = item.supplierAmount ?? round2(gross * supplierPct);
      const supplierId = item.supplierId || supplierDefault;
      return {
        orderId: paidOrder.orderId,
        orderItemId: item.orderItemId || `${paidOrder.orderId}:${item.catalogItemId}:${item.variantId}`,
        artistId: artwork?.authorId ?? (process.env.ARTIST_OWNER_DEFAULT_ID?.trim() || 'artist-default'),
        artworkId: catalog?.artworkId ?? 'artwork-unknown',
        supplierId,
        productId: catalog?.productBaseId ?? item.catalogItemId,
        buyerId: paidOrder.customerId,
        licenseType: 'commercial_use' as const,
        quantity: item.quantity,
        grossSaleAmount: gross,
        artistPercentage: gross > 0 ? Number((artistLicenseAmount / gross).toFixed(4)) : 0,
        artistLicenseAmount,
        platformCommissionAmount,
        supplierAmount,
        paymentStatus: 'approved' as const,
        paidAt: new Date().toISOString(),
      };
    }));
    await createLicenseEvents(licenseRows);

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
