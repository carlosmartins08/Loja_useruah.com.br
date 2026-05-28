import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { listImpactReviews } from '@/lib/impact-review-store';
import { canApproveImpactReviews } from '@/lib/role-matrix/permission-matrix';

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canApproveImpactReviews(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusInput = searchParams.get('status');
  const status =
    statusInput === 'pending_review' || statusInput === 'approved' || statusInput === 'rejected' ? statusInput : undefined;
  const onlyOverdue = searchParams.get('onlyOverdue') === 'true';
  const reviews = listImpactReviews({ status, onlyOverdue });
  return NextResponse.json({ ok: true, reviews });
}
