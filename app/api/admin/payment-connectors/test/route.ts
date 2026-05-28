import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { getPaymentConnectorConfigPlain } from '@/lib/payment-connector-store';
import { appendAuditLog } from '@/lib/audit-log-store';
import { validateProviderSettings } from '@/lib/payment-provider-requirements';
import { runPaymentConnectorTest } from '@/lib/payment-connector-tester';
import type { PaymentProviderKey } from '@/lib/payments';
import { canManagePaymentConnectors } from '@/lib/role-matrix/permission-matrix';

interface TestPayload {
  provider: PaymentProviderKey;
  settings?: Record<string, string>;
}

function isValidPayload(payload: unknown): payload is TestPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.provider === 'string' && row.provider.trim().length > 0;
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManagePaymentConnectors(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const suppliedSettings = payload.settings && typeof payload.settings === 'object' ? payload.settings : null;
  const config = suppliedSettings ? null : await getPaymentConnectorConfigPlain(payload.provider);
  if (!config && !suppliedSettings) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const effectiveSettings = suppliedSettings ?? config?.settings ?? {};
  const validation = validateProviderSettings(payload.provider, effectiveSettings);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, provider: payload.provider, statusCode: 422, message: 'missing_required_settings', detail: validation.missing.join(', ') });
  }

  const result = await runPaymentConnectorTest(payload.provider, effectiveSettings);

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'payment_connector_test',
    entity_type: 'PaymentConnector',
    entity_id: payload.provider,
    previous_status: config ? (config.enabled ? 'enabled' : 'disabled') : 'unsaved',
    new_status: result.ok ? 'test_ok' : 'test_failed',
    reason: result.message,
  });

  return NextResponse.json(result);
}
