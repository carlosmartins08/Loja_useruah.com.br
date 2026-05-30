import { NextResponse } from 'next/server';
import { registerTermsAcceptance } from '@/lib/terms-acceptance-store';
import { getActorFromRequest } from '@/lib/access-control';

interface AcceptTermsPayload {
  userId: string;
  entityType: 'industry' | 'artist' | 'consumer';
  entityId: string;
  termType: 'industry_base' | 'artist_base' | 'consumer_base';
  termVersion: string;
}

function isValidPayload(payload: unknown): payload is AcceptTermsPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  const entityTypeValid = body.entityType === 'industry' || body.entityType === 'artist' || body.entityType === 'consumer';
  const termTypeValid = body.termType === 'industry_base' || body.termType === 'artist_base' || body.termType === 'consumer_base';
  return (
    typeof body.userId === 'string' &&
    body.userId.trim().length > 0 &&
    entityTypeValid &&
    typeof body.entityId === 'string' &&
    body.entityId.trim().length > 0 &&
    termTypeValid &&
    typeof body.termVersion === 'string' &&
    body.termVersion.trim().length > 0
  );
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }
  if (payload.userId.trim() !== actor.actorId || payload.entityId.trim() !== actor.actorId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const accepted = await registerTermsAcceptance({
    userId: actor.actorId,
    entityType: payload.entityType,
    entityId: actor.actorId,
    termType: payload.termType,
    termVersion: payload.termVersion.trim(),
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true, acceptance: accepted }, { status: 201 });
}
