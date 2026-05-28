export const PAYOUT_RECONCILIATION_FAILURE_CODES = [
  'missing_commission_link',
  'commission_owner_mismatch',
  'commission_not_available',
  'insufficient_commission_balance',
] as const;

export type PayoutReconciliationFailureCode = (typeof PAYOUT_RECONCILIATION_FAILURE_CODES)[number];

export function isPayoutReconciliationFailureCode(value: string): value is PayoutReconciliationFailureCode {
  return (PAYOUT_RECONCILIATION_FAILURE_CODES as readonly string[]).includes(value);
}
