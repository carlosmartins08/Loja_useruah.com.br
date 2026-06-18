import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { createPlacedOrder, listOrders, type ShippingAddress } from '@/lib/order-store';
import { isTermsGateEnabledFor, validateTermsAcceptance } from '@/lib/terms-enforcement';
import { findPaymentByOrderId } from '@/lib/payment-store';
import { getProductionJobByOrderId } from '@/lib/production-store';
import { getShipmentByOrderId } from '@/lib/shipment-store';
import { getCatalogItem } from '@/lib/catalog-item-store';
import { canReadOrder, getActorFromRequest } from '@/lib/access-control';
import { canManageFinancialOperations, canOperateSupport } from '@/lib/role-matrix/permission-matrix';
import { extractCookieValue } from '@/lib/session-token';
import { getCampaign } from '@/lib/campaign-store';
import { isCatalogItemLinkedToCampaign } from '@/lib/campaign-product-store';
import { composeCampaignPrice } from '@/lib/campaign-pricing';
import { getReferralLinkById } from '@/lib/referral-store';

interface OrderCreatePayload {
  supplierId: string;
  shippingAddress: ShippingAddress;
  shippingAddressMode: 'same_as_account' | 'custom';
  campaignId?: string;
  referralLinkId?: string;
  items: Array<{
    catalogItemId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
  customer?: {
    id?: string;
  };
}

function isValidShippingAddress(shippingAddress: unknown): shippingAddress is ShippingAddress {
  if (!shippingAddress || typeof shippingAddress !== 'object') return false;
  const address = shippingAddress as Record<string, unknown>;
  return (
    typeof address.recipientName === 'string' &&
    address.recipientName.trim().length >= 3 &&
    typeof address.cep === 'string' &&
    address.cep.trim().length >= 8 &&
    typeof address.street === 'string' &&
    address.street.trim().length >= 3 &&
    typeof address.number === 'string' &&
    address.number.trim().length >= 1 &&
    typeof address.city === 'string' &&
    address.city.trim().length >= 2 &&
    typeof address.state === 'string' &&
    address.state.trim().length >= 2 &&
    typeof address.country === 'string' &&
    address.country.trim().length >= 2
  );
}

function isValidOrderPayload(payload: unknown): payload is OrderCreatePayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  if (typeof body.supplierId !== 'string' || body.supplierId.trim().length < 3) return false;
  if (body.shippingAddressMode !== 'same_as_account' && body.shippingAddressMode !== 'custom') return false;
  if (!isValidShippingAddress(body.shippingAddress)) return false;
  if (!Array.isArray(body.items) || body.items.length === 0) return false;

  return body.items.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    return (
      typeof row.catalogItemId === 'string' &&
      row.catalogItemId.length > 0 &&
      typeof row.variantId === 'string' &&
      row.variantId.length > 0 &&
      typeof row.quantity === 'number' &&
      row.quantity > 0 &&
      typeof row.unitPrice === 'number' &&
      row.unitPrice > 0
    );
  });
}

async function resolveValidatedOrderItems(
  payload: OrderCreatePayload,
  attribution: {
    campaignId?: string;
    campaignProgressivePriceRule?: string;
  }
) {
  const validatedItems: Array<{
    catalogItemId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    priceCompositionVersion?: string;
    movementMarkup?: ReturnType<typeof composeCampaignPrice>['movementMarkup'];
  }> = [];

  for (const item of payload.items) {
    const catalogItem = await getCatalogItem(item.catalogItemId);
    if (!catalogItem) {
      return { ok: false as const, error: 'catalog_item_not_found', detail: item.catalogItemId };
    }
    if (catalogItem.publicationStatus !== 'published') {
      return { ok: false as const, error: 'catalog_item_not_published', detail: item.catalogItemId };
    }
    const variant = catalogItem.variants.find((row) => row.variantId === item.variantId);
    if (!variant) {
      return { ok: false as const, error: 'variant_not_found', detail: item.variantId };
    }
    if (!variant.inStock) {
      return { ok: false as const, error: 'variant_out_of_stock', detail: item.variantId };
    }
    if (attribution.campaignId && !isCatalogItemLinkedToCampaign(attribution.campaignId, item.catalogItemId)) {
      return {
        ok: false as const,
        error: 'catalog_item_not_in_campaign',
        detail: item.catalogItemId,
      };
    }

    const priceComposition = composeCampaignPrice({
      baseUnitPrice: variant.price,
      quantity: item.quantity,
      progressivePriceRule: attribution.campaignProgressivePriceRule,
      minUnitPrice: catalogItem.pricingPolicy?.minPrice,
    });
    if (Number(item.unitPrice.toFixed(2)) !== Number(priceComposition.effectiveUnitPrice.toFixed(2))) {
      return { ok: false as const, error: 'price_mismatch', detail: item.catalogItemId };
    }

    validatedItems.push({
      catalogItemId: item.catalogItemId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: priceComposition.effectiveUnitPrice,
      priceCompositionVersion: attribution.campaignId ? priceComposition.priceCompositionVersion : undefined,
      movementMarkup: attribution.campaignId ? priceComposition.movementMarkup : undefined,
    });
  }

  return { ok: true as const, items: validatedItems };
}

async function resolveAttributionContext(request: Request, body: OrderCreatePayload) {
  const cookieHeader = request.headers.get('cookie');
  const explicitCampaignId = typeof body.campaignId === 'string' && body.campaignId.trim().length > 0 ? body.campaignId.trim() : undefined;
  const explicitReferralLinkId =
    typeof body.referralLinkId === 'string' && body.referralLinkId.trim().length > 0 ? body.referralLinkId.trim() : undefined;
  const cookieCampaignId = extractCookieValue(cookieHeader, 'ruah_campaign_id') ?? undefined;
  const cookieReferralLinkId = extractCookieValue(cookieHeader, 'ruah_referral_link_id') ?? undefined;
  const campaignId = explicitCampaignId ?? cookieCampaignId;
  const referralLinkId = explicitReferralLinkId ?? cookieReferralLinkId;
  const context: {
    campaignId?: string;
    campaignName?: string;
    campaignProgressivePriceRule?: string;
    organizationId?: string;
    communityOwnerId?: string;
    referralLinkId?: string;
    affiliateUserId?: string;
  } = {};

  if (campaignId) {
    const campaign = getCampaign(campaignId);
    if (campaign && campaign.status === 'active') {
      context.campaignId = campaign.campaignId;
      context.campaignName = campaign.name;
      context.campaignProgressivePriceRule = campaign.progressivePriceRule;
      context.organizationId = campaign.organizationId;
      context.communityOwnerId = campaign.createdBy;
    } else if (explicitCampaignId) {
      return { ok: false as const, error: 'campaign_not_active', detail: campaignId };
    }
  }

  if (referralLinkId) {
    const referralLink = getReferralLinkById(referralLinkId);
    if (referralLink && referralLink.status === 'active') {
      context.referralLinkId = referralLink.referralLinkId;
      context.affiliateUserId = referralLink.ownerId;
    } else if (explicitReferralLinkId) {
      return { ok: false as const, error: 'referral_link_not_active', detail: referralLinkId };
    }
  }

  return { ok: true as const, context };
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (actor.actorRole !== 'customer') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidOrderPayload(body)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const customerId = actor.actorId;
  if (body.customer?.id && body.customer.id !== customerId) {
    return NextResponse.json({ error: 'forbidden', detail: 'customer_id_mismatch' }, { status: 403 });
  }
  if (isTermsGateEnabledFor('consumer')) {
    const accepted = await validateTermsAcceptance({ userId: customerId, termType: 'consumer_base' });
    if (!accepted) {
      return NextResponse.json({ error: 'forbidden', detail: 'terms_not_accepted' }, { status: 403 });
    }
  }

  const attribution = await resolveAttributionContext(request, body);
  if (!attribution.ok) {
    return NextResponse.json({ error: attribution.error, detail: attribution.detail }, { status: 409 });
  }

  const validatedItems = await resolveValidatedOrderItems(body, attribution.context);
  if (!validatedItems.ok) {
    return NextResponse.json({ error: validatedItems.error, detail: validatedItems.detail }, { status: 409 });
  }

  const order = await createPlacedOrder({
    customerId,
    supplierId: body.supplierId,
    shippingAddress: body.shippingAddress,
    attribution: attribution.context,
    items: validatedItems.items,
  });

  appendAuditLog({
    actor_id: customerId,
    actor_role: 'customer',
    action: 'order.placed',
    entity_type: 'Order',
    entity_id: order.orderId,
    previous_status: 'draft',
    new_status: order.status,
    reason: `checkout_create_order|supplier:${body.supplierId}|address_mode:${body.shippingAddressMode}`,
  });

  return NextResponse.json({ ok: true, order }, { status: 201 });
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const isOperationalAdmin = canOperateSupport(actor.actorRole) || canManageFinancialOperations(actor.actorRole);
  const canReadAll = actor.actorRole === 'platform_admin' || isOperationalAdmin;
  const canReadOwn = actor.actorRole === 'customer';
  const canReadSupplierScope = actor.actorRole === 'supplier';
  if (!canReadAll && !canReadOwn && !canReadSupplierScope) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedCustomerId = searchParams.get('customerId')?.trim();
  const customerId = canReadOwn ? actor.actorId : requestedCustomerId;
  const orders = await listOrders(customerId ? { customerId } : undefined);
  const visibleOrders = canReadSupplierScope ? orders.filter((order) => canReadOrder(order, actor)) : orders;

  const rows = await Promise.all(
    visibleOrders.map(async (order) => {
      const [payment, production, shipment] = await Promise.all([
        findPaymentByOrderId(order.orderId),
        getProductionJobByOrderId(order.orderId),
        getShipmentByOrderId(order.orderId),
      ]);

      return {
        ...order,
        paymentStatus: payment?.status ?? null,
        productionStatus: production?.status ?? null,
        shipmentStatus: shipment?.status ?? null,
      };
    })
  );

  return NextResponse.json({ ok: true, orders: rows });
}
