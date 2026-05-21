import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { listCommissionsByOwner, reconcileCommissionAvailabilityForOwner } from '@/lib/commission-store';
import { listPayoutsByOwner } from '@/lib/payout-store';

function isFinanceOwnerRole(role: string) {
  return role === 'artist' || role === 'community_manager';
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor || !isFinanceOwnerRole(actor.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await reconcileCommissionAvailabilityForOwner(actor.actorId);
  const commissions = await listCommissionsByOwner(actor.actorId);
  const payouts = await listPayoutsByOwner(actor.actorId);
  const requestedAmount = payouts
    .filter((row) => row.status === 'requested' || row.status === 'approved')
    .reduce((acc, row) => acc + row.amount, 0);
  const pendingAmount = commissions.filter((row) => row.status === 'pending').reduce((acc, row) => acc + row.amount, 0);
  const availableGross = commissions
    .filter((row) => row.status === 'available')
    .reduce((acc, row) => acc + row.amount, 0);
  const availableToWithdraw = Number(Math.max(0, availableGross - requestedAmount).toFixed(2));

  return NextResponse.json({
    ok: true,
    ownerId: actor.actorId,
    ownerRole: actor.actorRole,
    balances: {
      pending: Number(pendingAmount.toFixed(2)),
      availableGross: Number(availableGross.toFixed(2)),
      requested: Number(requestedAmount.toFixed(2)),
      availableToWithdraw,
    },
    commissions,
    payouts,
  });
}
