import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { getPaymentConnectorConfigPlain } from '@/lib/payment-connector-store';
import { appendAuditLog } from '@/lib/audit-log-store';
import { runPaymentConnectorTest } from '@/lib/payment-connector-tester';
import type { PaymentProviderKey } from '@/lib/payments';

interface TestPayload {
  provider: PaymentProviderKey;
}

function isValidPayload(payload: unknown): payload is TestPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.provider === 'string' && row.provider.trim().length > 0;
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && actor?.actorRole !== 'platform_admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const config = await getPaymentConnectorConfigPlain(payload.provider);
  if (!config) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const result = await runPaymentConnectorTest(payload.provider, config.settings);

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'payment_connector_test',
    entity_type: 'PaymentConnector',
    entity_id: payload.provider,
    previous_status: config.enabled ? 'enabled' : 'disabled',
    new_status: result.ok ? 'test_ok' : 'test_failed',
    reason: result.message,
  });

  return NextResponse.json(result);
}
