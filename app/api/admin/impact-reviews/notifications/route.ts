import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { listIntegrationLogs } from '@/lib/integration-log-store';
import { canApproveImpactReviews } from '@/lib/role-matrix/permission-matrix';

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canApproveImpactReviews(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get('limit') ?? '20');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 20;
  const logs = listIntegrationLogs({ provider: 'internal_ops', actionPrefix: 'impact_review_notify.', limit });
  return NextResponse.json({ ok: true, logs });
}

