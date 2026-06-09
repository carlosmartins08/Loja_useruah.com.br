import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { listPaymentGateways } from '@/lib/payment-gateway-registry';
import {
  getPaymentConnectorConfigPlain,
  getPaymentConnectorPreference,
  listPaymentConnectorConfigs,
  rollbackDefaultPaymentConnector,
  setDefaultPaymentConnector,
  upsertPaymentConnectorConfig,
} from '@/lib/payment-connector-store';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getProviderRequirement, validateProviderSettings } from '@/lib/payment-provider-requirements';
import { runPaymentConnectorTest } from '@/lib/payment-connector-tester';
import type { PaymentProviderKey } from '@/lib/payments';
import { canManagePaymentConnectors } from '@/lib/role-matrix/permission-matrix';

interface UpsertPayload {
  provider: PaymentProviderKey;
  enabled: boolean;
  settings: Record<string, string>;
}

interface ActionPayload {
  action: 'set_default' | 'rollback_default';
  provider?: PaymentProviderKey;
}

interface TestPayload {
  provider: PaymentProviderKey;
  settings?: Record<string, string>;
}

function isValidPayload(payload: unknown): payload is UpsertPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.provider === 'string' && typeof row.enabled === 'boolean' && !!row.settings && typeof row.settings === 'object';
}

function isValidActionPayload(payload: unknown): payload is ActionPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  const action = row.action;
  if (action !== 'set_default' && action !== 'rollback_default') return false;
  if (action === 'set_default') return typeof row.provider === 'string' && row.provider.trim().length > 0;
  return true;
}

function isValidTestPayload(payload: unknown): payload is TestPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.provider === 'string' && row.provider.trim().length > 0;
}

function ensureAdmin(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManagePaymentConnectors(actor?.actorRole)) {
    return null;
  }
  return actor;
}

export async function handleAdminPaymentConnectorsGet(request: Request) {
  const actor = ensureAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const [registry, configs, preference] = await Promise.all([listPaymentGateways(), listPaymentConnectorConfigs(), getPaymentConnectorPreference()]);
  const requirements = registry
    .map((gateway) => [gateway.key, getProviderRequirement(gateway.key as PaymentProviderKey)] as const)
    .filter(([, requirement]) => requirement !== null);

  return NextResponse.json({ ok: true, registry, configs, requirements: Object.fromEntries(requirements), preference });
}

export async function handleAdminPaymentConnectorsPost(request: Request) {
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

  if (payload.enabled) {
    const validation = validateProviderSettings(payload.provider, payload.settings);
    if (!validation.ok) {
      return NextResponse.json({ error: 'validation_error', detail: 'missing_required_settings', missing: validation.missing }, { status: 422 });
    }

    const test = await runPaymentConnectorTest(payload.provider, payload.settings);
    if (!test.ok) {
      return NextResponse.json({ error: 'validation_error', detail: 'connection_test_failed', message: test.message, statusCode: test.statusCode }, { status: 422 });
    }
  }

  await upsertPaymentConnectorConfig({
    provider: payload.provider,
    enabled: payload.enabled,
    settings: payload.settings,
    updatedBy: actor.actorId,
  });

  if (payload.enabled) {
    const preference = await getPaymentConnectorPreference();
    if (!preference.defaultProvider) {
      await setDefaultPaymentConnector(payload.provider, actor.actorId);
    }
  }

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

export async function handleAdminPaymentConnectorsPatch(request: Request) {
  const actor = ensureAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const payload = await request.json().catch(() => null);
  if (!isValidActionPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  if (payload.action === 'set_default') {
    const result = await setDefaultPaymentConnector(payload.provider as PaymentProviderKey, actor.actorId);
    if (!result.ok) {
      return NextResponse.json({ error: 'validation_error', detail: result.reason }, { status: 422 });
    }
    appendAuditLog({
      actor_id: actor.actorId,
      actor_role: actor.actorRole,
      action: 'payment_connector_default_set',
      entity_type: 'PaymentConnector',
      entity_id: payload.provider as PaymentProviderKey,
      previous_status: result.previousDefault ?? 'none',
      new_status: 'default',
      reason: 'admin_self_service',
    });
    return NextResponse.json({ ok: true, defaultProvider: payload.provider, previousDefaultProvider: result.previousDefault ?? null });
  }

  const rolled = await rollbackDefaultPaymentConnector(actor.actorId);
  if (!rolled.ok) {
    return NextResponse.json({ error: 'validation_error', detail: rolled.reason }, { status: 422 });
  }
  appendAuditLog({
    actor_id: actor.actorId,
    actor_role: actor.actorRole,
    action: 'payment_connector_default_rollback',
    entity_type: 'PaymentConnector',
    entity_id: rolled.provider,
    previous_status: 'default',
    new_status: 'default',
    reason: 'admin_self_service',
  });
  return NextResponse.json({ ok: true, defaultProvider: rolled.provider });
}

export async function handleAdminPaymentConnectorsTestPost(request: Request) {
  const actor = ensureAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const payload = await request.json().catch(() => null);
  if (!isValidTestPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const suppliedSettings = payload.settings && typeof payload.settings === 'object' ? payload.settings : null;
  const config = suppliedSettings ? null : await getPaymentConnectorConfigPlain(payload.provider);
  if (!config && !suppliedSettings) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const effectiveSettings = suppliedSettings ?? config?.settings ?? {};
  const validation = validateProviderSettings(payload.provider, effectiveSettings);
  if (!validation.ok) {
    return NextResponse.json({
      ok: false,
      provider: payload.provider,
      statusCode: 422,
      message: 'missing_required_settings',
      detail: validation.missing.join(', '),
    });
  }

  const result = await runPaymentConnectorTest(payload.provider, effectiveSettings);

  appendAuditLog({
    actor_id: actor.actorId,
    actor_role: actor.actorRole,
    action: 'payment_connector_test',
    entity_type: 'PaymentConnector',
    entity_id: payload.provider,
    previous_status: config ? (config.enabled ? 'enabled' : 'disabled') : 'unsaved',
    new_status: result.ok ? 'test_ok' : 'test_failed',
    reason: result.message,
  });

  return NextResponse.json(result);
}
