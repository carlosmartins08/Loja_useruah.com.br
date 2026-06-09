import { handleAdminPaymentConnectorsTestPost } from '@/lib/admin-api/payment-connectors';

export async function POST(request: Request) {
  return handleAdminPaymentConnectorsTestPost(request);
}
