import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { updatePayoutStatus } from '@/lib/payout-store';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await updatePayoutStatus({ payoutId: id, from: ['requested'], to: 'under_review' });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'payout.review_started',
    entity_type: 'Payout',
    entity_id: result.payout.payoutId,
    previous_status: result.previous.status,
    new_status: result.payout.status,
    reason: 'manual_review_start',
  });

  return NextResponse.json({ ok: true, payout: result.payout });
}
