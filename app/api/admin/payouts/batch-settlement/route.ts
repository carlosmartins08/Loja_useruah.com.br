import { handleAdminPayoutBatchSettlementPost } from '@/lib/admin-api/payout-batch-settlement';

export async function POST(request: Request) {
  return handleAdminPayoutBatchSettlementPost(request);
}
