import { appendAuditLog } from '@/lib/audit-log-store';
import { listCommissionsByIds, updateCommissionStatus } from '@/lib/commission-store';
import { getPayoutById, updatePayoutStatus } from '@/lib/payout-store';
import { reconcilePayoutForSettlement } from '@/lib/payout-reconciliation';

export async function settlePayoutToPaid(input: { payoutId: string; actorId: string; actorRole: string }) {
  const payout = await getPayoutById(input.payoutId);
  if (!payout) return { kind: 'not_found' as const };

  const precheck = await reconcilePayoutForSettlement(payout);
  if (!precheck.ok) return { kind: 'precheck_failed' as const, precheck };

  const commissions = await listCommissionsByIds(payout.commissionIds);
  const result = await updatePayoutStatus({ payoutId: input.payoutId, from: ['approved'], to: 'paid' });
  if (result.kind === 'not_found') return { kind: 'not_found' as const };
  if (result.kind === 'invalid_transition') return { kind: 'invalid_transition' as const };

  for (const row of commissions) {
    await updateCommissionStatus(row.commissionId, 'paid');
  }

  appendAuditLog({
    actor_id: input.actorId,
    actor_role: input.actorRole,
    action: 'payout.paid',
    entity_type: 'Payout',
    entity_id: result.payout.payoutId,
    previous_status: result.previous.status,
    new_status: result.payout.status,
    reason: `manual_payment_mark|commissions:${commissions.length}|commissionTotal:${precheck.commissionTotal.toFixed(2)}`,
  });

  return {
    kind: 'settled' as const,
    payout: result.payout,
    reconciliation: {
      payoutId: result.payout.payoutId,
      commissionCount: commissions.length,
      commissionTotal: precheck.commissionTotal,
      commissionStatusApplied: 'paid' as const,
    },
  };
}
