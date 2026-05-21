import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { getProviderRecipient, upsertProviderRecipient } from '@/lib/provider-recipient-store';

interface UpsertRecipientPayload {
  provider: string;
  entityType: 'platform' | 'supplier' | 'artist';
  entityId: string;
  providerRecipientId: string;
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  document?: string;
  bankAccountReference?: string;
}

function isValidPayload(payload: unknown): payload is UpsertRecipientPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  const entityTypeOk = row.entityType === 'platform' || row.entityType === 'supplier' || row.entityType === 'artist';
  const statusOk = row.status === 'pending' || row.status === 'approved' || row.status === 'rejected' || row.status === 'incomplete';
  return (
    typeof row.provider === 'string' &&
    row.provider.trim().length > 0 &&
    entityTypeOk &&
    typeof row.entityId === 'string' &&
    row.entityId.trim().length > 0 &&
    typeof row.providerRecipientId === 'string' &&
    row.providerRecipientId.trim().length > 0 &&
    statusOk
  );
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && actor?.actorRole !== 'platform_admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  if (!provider || !entityType || !entityId) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }
  if (entityType !== 'platform' && entityType !== 'supplier' && entityType !== 'artist') {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const record = await getProviderRecipient({
    provider,
    entityType,
    entityId,
  });
  if (!record) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, recipient: record });
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

  const record = await upsertProviderRecipient({
    provider: payload.provider.trim(),
    entityType: payload.entityType,
    entityId: payload.entityId.trim(),
    providerRecipientId: payload.providerRecipientId.trim(),
    status: payload.status,
    document: payload.document?.trim() || undefined,
    bankAccountReference: payload.bankAccountReference?.trim() || undefined,
  });
  return NextResponse.json({ ok: true, recipient: record });
}
