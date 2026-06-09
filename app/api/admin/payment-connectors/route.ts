import {
  handleAdminPaymentConnectorsGet,
  handleAdminPaymentConnectorsPatch,
  handleAdminPaymentConnectorsPost,
} from '@/lib/admin-api/payment-connectors';

export async function GET(request: Request) {
  return handleAdminPaymentConnectorsGet(request);
}

export async function POST(request: Request) {
  return handleAdminPaymentConnectorsPost(request);
}

export async function PATCH(request: Request) {
  return handleAdminPaymentConnectorsPatch(request);
}
