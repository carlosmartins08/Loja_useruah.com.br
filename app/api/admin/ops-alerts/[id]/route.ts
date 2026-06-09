import { handleAdminOpsAlertPatch } from '@/lib/admin-api/ops-alerts';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleAdminOpsAlertPatch(request, context);
}
