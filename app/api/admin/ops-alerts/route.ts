import { handleAdminOpsAlertsGet } from '@/lib/admin-api/ops-alerts';

export async function GET(request: Request) {
  return handleAdminOpsAlertsGet(request);
}
