import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { listPayouts, type PayoutStatus } from '@/lib/payout-store';

function parseStatus(input: string | null): PayoutStatus | undefined {
  if (!input) return undefined;
  if (input === 'requested' || input === 'under_review' || input === 'approved' || input === 'paid' || input === 'rejected') return input;
  return undefined;
}

export async function handleAdminPayoutsGet(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get('status'));
  const payouts = await listPayouts();
  const filtered = status ? payouts.filter((row) => row.status === status) : payouts;
  return NextResponse.json({ ok: true, payouts: filtered });
}
