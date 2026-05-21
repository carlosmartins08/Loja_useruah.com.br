import { NextResponse } from 'next/server';
import { registerTermsAcceptance } from '@/lib/terms-acceptance-store';

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
  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const accepted = await registerTermsAcceptance({
    userId: payload.userId.trim(),
    entityType: payload.entityType,
    entityId: payload.entityId.trim(),
    termType: payload.termType,
    termVersion: payload.termVersion.trim(),
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true, acceptance: accepted }, { status: 201 });
}
