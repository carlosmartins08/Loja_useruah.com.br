import { listCommissionsByIds, reconcileCommissionAvailabilityForOwner } from '@/lib/commission-store';
import type { PayoutRecord } from '@/lib/payout-store';
import type { PayoutReconciliationFailureCode } from '@/lib/payout-reconciliation-codes';

export interface PayoutReconciliationOk {
  ok: true;
  payoutId: string;
  commissionCount: number;
  commissionTotal: number;
}

export interface PayoutReconciliationFail {
  ok: false;
  error: 'ledger_inconsistent' | 'invalid_transition';
  detail: PayoutReconciliationFailureCode;
  reconciliation: Record<string, unknown>;
}

export type PayoutReconciliationResult = PayoutReconciliationOk | PayoutReconciliationFail;

export async function reconcilePayoutForSettlement(payout: PayoutRecord): Promise<PayoutReconciliationResult> {
  await reconcileCommissionAvailabilityForOwner(payout.ownerId);
  const commissions = await listCommissionsByIds(payout.commissionIds);
  if (commissions.length !== payout.commissionIds.length) {
    return {
      ok: false,
      error: 'ledger_inconsistent',
      detail: 'missing_commission_link',
      reconciliation: {
        payoutId: payout.payoutId,
        expectedCommissionIds: payout.commissionIds.length,
        foundCommissionIds: commissions.length,
        action: 'corrigir_vinculos_de_comissao_do_payout',
      },
    };
  }

  const belongsToOwner = commissions.every((row) => row.ownerId === payout.ownerId);
  if (!belongsToOwner) {
    return {
      ok: false,
      error: 'ledger_inconsistent',
      detail: 'commission_owner_mismatch',
      reconciliation: {
        payoutId: payout.payoutId,
        ownerId: payout.ownerId,
        action: 'revisar_owner_das_comissoes_vinculadas',
      },
    };
  }

  const allAvailable = commissions.every((row) => row.status === 'available');
  if (!allAvailable) {
    return {
      ok: false,
      error: 'invalid_transition',
      detail: 'commission_not_available',
      reconciliation: {
        payoutId: payout.payoutId,
        nonAvailableCommissionIds: commissions.filter((row) => row.status !== 'available').map((row) => row.commissionId),
        action: 'reconciliar_comissoes_antes_da_liquidacao',
      },
    };
  }

  const commissionTotal = Number(commissions.reduce((acc, row) => acc + row.amount, 0).toFixed(2));
  const payoutAmount = Number(payout.amount.toFixed(2));
  if (commissionTotal + 0.01 < payoutAmount) {
    return {
      ok: false,
      error: 'ledger_inconsistent',
      detail: 'insufficient_commission_balance',
      reconciliation: {
        payoutId: payout.payoutId,
        payoutAmount,
        commissionTotal,
        delta: Number((payoutAmount - commissionTotal).toFixed(2)),
        action: 'ajustar_valor_do_payout_ou_comissoes_vinculadas',
      },
    };
  }

  return {
    ok: true,
    payoutId: payout.payoutId,
    commissionCount: commissions.length,
    commissionTotal,
  };
}
