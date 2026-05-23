import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { listPaymentGateways } from '@/lib/payment-gateway-registry';
import { listPaymentConnectorConfigs, upsertPaymentConnectorConfig } from '@/lib/payment-connector-store';
import { appendAuditLog } from '@/lib/audit-log-store';
import type { PaymentProviderKey } from '@/lib/payments';

interface UpsertPayload {
  provider: PaymentProviderKey;
  enabled: boolean;
  settings: Record<string, string>;
}

function isValidPayload(payload: unknown): payload is UpsertPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.provider === 'string' && typeof row.enabled === 'boolean' && !!row.settings && typeof row.settings === 'object';
}

function ensureAdmin(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && actor?.actorRole !== 'platform_admin') {
    return null;
  }
  return actor;
}

export async function GET(request: Request) {
  const actor = ensureAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const [registry, configs] = await Promise.all([listPaymentGateways(), listPaymentConnectorConfigs()]);
  return NextResponse.json({ ok: true, registry, configs });
}

export async function POST(request: Request) {
  const actor = ensureAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const exists = listPaymentGateways().some((gateway) => gateway.key === payload.provider);
  if (!exists) {
    return NextResponse.json({ error: 'validation_error', detail: 'provider_not_supported' }, { status: 422 });
  }

  await upsertPaymentConnectorConfig({
    provider: payload.provider,
    enabled: payload.enabled,
    settings: payload.settings,
    updatedBy: actor.actorId,
  });

  appendAuditLog({
    actor_id: actor.actorId,
    actor_role: actor.actorRole,
    action: 'payment_connector_config_upsert',
    entity_type: 'PaymentConnector',
    entity_id: payload.provider,
    previous_status: 'unknown',
    new_status: payload.enabled ? 'enabled' : 'disabled',
    reason: 'admin_self_service',
  });

  return NextResponse.json({ ok: true });
}
