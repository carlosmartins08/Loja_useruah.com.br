import { handleAdminRegistrationsExportGet } from '@/lib/admin-api/registrations-export';

export async function GET(request: Request) {
  return handleAdminRegistrationsExportGet(request);
}
