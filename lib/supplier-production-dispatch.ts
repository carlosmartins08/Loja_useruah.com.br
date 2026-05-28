import type { OrderRecord } from '@/lib/order-store';
import type { ProductionJobRecord } from '@/lib/production-store';
import { appendIntegrationLog } from '@/lib/integration-log-store';
import { dimonaCreateOrder, type DimonaCreateOrderPayload } from '@/lib/dimona-client';
import { getSupplierIntegrationMode, isDimonaConfigured } from '@/lib/supplier-provider';
import { getSupplierDispatchByProductionJobId, upsertSupplierDispatch, type SupplierDispatchRecord } from '@/lib/supplier-dispatch-store';

interface DispatchResult {
  ok: boolean;
  blocking: boolean;
  dispatch: SupplierDispatchRecord;
}

function parseJsonMap(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, raw]) => {
      if (typeof raw === 'string' && key.trim().length > 0 && raw.trim().length > 0) {
        acc[key.trim()] = raw.trim();
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function resolveDimonaSkuId(item: OrderRecord['items'][number], skuMap: Record<string, string>) {
  return skuMap[`${item.catalogItemId}:${item.variantId}`] ?? skuMap[item.variantId] ?? '';
}

function toDimonaPayload(order: OrderRecord, supplierId: string): DimonaCreateOrderPayload | null {
  const skuMap = parseJsonMap(process.env.DIMONA_SKU_MAP_JSON);
  const shippingSpeed = process.env.DIMONA_DEFAULT_SHIPPING_SPEED?.toLowerCase() === 'sedex' ? 'sedex' : 'pac';
  const customerEmail = process.env.DIMONA_FALLBACK_CUSTOMER_EMAIL?.trim() || 'checkout@useruah.com.br';
  const webhookUrl = process.env.DIMONA_WEBHOOK_URL?.trim() || undefined;
  const firstAddress = order.items[0]?.shippingAddress;
  if (!firstAddress) return null;

  const items = order.items
    .filter((row) => row.supplierId === supplierId)
    .map((item) => {
      const dimonaSkuId = resolveDimonaSkuId(item, skuMap);
      if (!dimonaSkuId) return null;
      return {
        name: `${item.catalogItemId}-${item.variantId}`,
        sku: item.variantId,
        qty: item.quantity,
        dimona_sku_id: dimonaSkuId,
        designs: [],
      };
    });

  if (items.some((item) => item === null)) return null;
  if (items.length === 0) return null;

  return {
    shipping_speed: shippingSpeed,
    order_id: order.orderId,
    customer_name: firstAddress.recipientName,
    customer_email: customerEmail,
    webhook_url: webhookUrl,
    items: items as DimonaCreateOrderPayload['items'],
    address: {
      street: firstAddress.street,
      number: firstAddress.number,
      city: firstAddress.city,
      state: firstAddress.state,
      zipcode: firstAddress.cep.replace(/\D/g, ''),
      country: firstAddress.country,
    },
  };
}

export async function dispatchProductionToSupplier(input: {
  job: ProductionJobRecord;
  order: OrderRecord;
}): Promise<DispatchResult> {
  const existing = getSupplierDispatchByProductionJobId(input.job.productionJobId);
  if (existing && (existing.status === 'sent' || existing.status === 'skipped')) {
    return { ok: true, blocking: false, dispatch: existing };
  }

  const supplierIds = Array.from(new Set(input.order.items.map((item) => item.supplierId)));
  if (supplierIds.length !== 1) {
    const dispatch = upsertSupplierDispatch({
      productionJobId: input.job.productionJobId,
      orderId: input.order.orderId,
      supplierId: supplierIds.join(','),
      provider: 'manual',
      status: 'failed',
      errorMessage: 'multi_supplier_order_not_supported_for_auto_dispatch',
    });
    return { ok: false, blocking: true, dispatch };
  }

  const supplierId = supplierIds[0];
  const mode = getSupplierIntegrationMode(supplierId);
  if (mode === 'manual') {
    const dispatch = upsertSupplierDispatch({
      productionJobId: input.job.productionJobId,
      orderId: input.order.orderId,
      supplierId,
      provider: 'manual',
      status: 'skipped',
      responsePayload: { reason: 'manual_supplier_flow' },
    });
    return { ok: true, blocking: false, dispatch };
  }

  if (!isDimonaConfigured()) {
    const dispatch = upsertSupplierDispatch({
      productionJobId: input.job.productionJobId,
      orderId: input.order.orderId,
      supplierId,
      provider: 'dimona_api',
      status: 'failed',
      errorMessage: 'dimona_not_configured',
    });
    return { ok: false, blocking: true, dispatch };
  }

  const payload = toDimonaPayload(input.order, supplierId);
  if (!payload) {
    const dispatch = upsertSupplierDispatch({
      productionJobId: input.job.productionJobId,
      orderId: input.order.orderId,
      supplierId,
      provider: 'dimona_api',
      status: 'failed',
      errorMessage: 'dimona_payload_invalid_or_missing_sku_mapping',
    });
    return { ok: false, blocking: true, dispatch };
  }

  const response = await dimonaCreateOrder(payload);
  await appendIntegrationLog({
    provider: 'dimona',
    action: 'production.order.create',
    requestPayload: payload,
    responsePayload: response.payload,
    statusCode: response.status,
    success: response.ok,
    errorMessage: response.ok ? undefined : 'dimona_create_order_failed',
  });

  const providerReference =
    typeof (response.payload as Record<string, unknown>)?.dimona_id === 'string'
      ? ((response.payload as Record<string, unknown>).dimona_id as string)
      : undefined;

  const dispatch = upsertSupplierDispatch({
    productionJobId: input.job.productionJobId,
    orderId: input.order.orderId,
    supplierId,
    provider: 'dimona_api',
    status: response.ok ? 'sent' : 'failed',
    providerReference,
    requestPayload: payload,
    responsePayload: response.payload,
    errorMessage: response.ok ? undefined : 'dimona_create_order_failed',
  });

  return {
    ok: response.ok,
    blocking: !response.ok,
    dispatch,
  };
}

