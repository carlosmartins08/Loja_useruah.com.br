import { handleAdminPayoutBatchSettlementMetricsGet } from '@/lib/admin-api/payout-batch-settlement';

export async function GET(request: Request) {
  return handleAdminPayoutBatchSettlementMetricsGet(request);
}
