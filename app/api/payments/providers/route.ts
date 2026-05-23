import { NextResponse } from 'next/server';
import { listPaymentGateways } from '@/lib/payment-gateway-registry';
import { listPaymentConnectorConfigs } from '@/lib/payment-connector-store';

export async function GET() {
  const providers = listPaymentGateways();
  const configs = await listPaymentConnectorConfigs();
  const byProvider = new Map(configs.map((item) => [item.provider, item]));
  const merged = providers.map((provider) => {
    const config = byProvider.get(provider.key);
    if (!config) return provider;
    return {
      ...provider,
      enabled: config.enabled,
    };
  });
  return NextResponse.json({
    ok: true,
    providers: merged,
  });
}
