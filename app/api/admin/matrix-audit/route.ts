import { handleAdminMatrixAuditGet } from '@/lib/admin-api/matrix-audit';

export async function GET(request: Request) {
  return handleAdminMatrixAuditGet(request);
}
