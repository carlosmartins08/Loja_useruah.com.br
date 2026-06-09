import { handleAdminSupplierDimonaTestPost } from '@/lib/admin-api/supplier-integrations';

export async function POST(request: Request) {
  return handleAdminSupplierDimonaTestPost(request);
}
