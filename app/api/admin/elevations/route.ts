import { handleAdminElevationsGet } from '@/lib/admin-api/elevations';

export async function GET(request: Request) {
  return handleAdminElevationsGet(request);
}
