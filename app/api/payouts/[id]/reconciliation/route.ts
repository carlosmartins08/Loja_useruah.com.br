import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { getPayoutById } from '@/lib/payout-store';
import { reconcilePayoutForSettlement } from '@/lib/payout-reconciliation';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const payout = await getPayoutById(id);
  if (!payout) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const precheck = await reconcilePayoutForSettlement(payout);
  if (!precheck.ok) {
    return NextResponse.json({ ok: false, payout, error: precheck.error, detail: precheck.detail, reconciliation: precheck.reconciliation }, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    payout,
    reconciliation: {
      payoutId: precheck.payoutId,
      commissionCount: precheck.commissionCount,
      commissionTotal: precheck.commissionTotal,
      action: 'pronto_para_liquidacao',
    },
  });
}
