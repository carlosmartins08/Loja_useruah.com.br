import { handleAdminPayoutsGet } from '@/lib/admin-api/payouts';

export async function GET(request: Request) {
  return handleAdminPayoutsGet(request);
}
