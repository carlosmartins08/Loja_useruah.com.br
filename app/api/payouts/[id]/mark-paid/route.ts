import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { settlePayoutToPaid } from '@/lib/payout-settlement-service';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await settlePayoutToPaid({
    payoutId: id,
    actorId: actor?.actorId ?? 'unknown',
    actorRole: actor?.actorRole ?? 'unknown',
  });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  if (result.kind === 'precheck_failed') {
    return NextResponse.json(
      { error: result.precheck.error, detail: result.precheck.detail, reconciliation: result.precheck.reconciliation },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true, payout: result.payout, reconciliation: result.reconciliation });
}
