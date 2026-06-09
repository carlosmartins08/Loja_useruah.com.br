import { handleAdminSupplierIntelligenceGet } from '@/lib/admin-api/supplier-intelligence';

export async function GET(request: Request) {
  return handleAdminSupplierIntelligenceGet(request);
}
