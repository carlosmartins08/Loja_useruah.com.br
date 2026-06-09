import { handleAdminRegistrationsGet } from '@/lib/admin-api/registrations';

export async function GET(request: Request) {
  return handleAdminRegistrationsGet(request);
}
