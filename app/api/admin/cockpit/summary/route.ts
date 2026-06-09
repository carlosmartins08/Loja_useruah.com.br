import { handleAdminCockpitSummaryGet } from '@/lib/admin-api/cockpit-summary';

export async function GET(request: Request) {
  return handleAdminCockpitSummaryGet(request);
}
