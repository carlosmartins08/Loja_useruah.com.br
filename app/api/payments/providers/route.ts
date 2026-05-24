import { NextResponse } from 'next/server';
import { listPaymentGateways } from '@/lib/payment-gateway-registry';
import { getPaymentConnectorPreference, listPaymentConnectorConfigs } from '@/lib/payment-connector-store';

export async function GET() {
  const providers = listPaymentGateways();
  const [configs, preference] = await Promise.all([listPaymentConnectorConfigs(), getPaymentConnectorPreference()]);
  const byProvider = new Map(configs.map((item) => [item.provider, item]));
  const merged = providers.map((provider) => {
    const config = byProvider.get(provider.key);
    if (!config) return provider;
    return {
      ...provider,
      enabled: config.enabled,
      isDefault: config.isDefault,
    };
  });
  const hasEnabled = merged.some((provider) => provider.enabled);
  return NextResponse.json({
    ok: true,
    providers: hasEnabled ? merged : merged.map((provider) => ({ ...provider, enabled: provider.key === 'sandbox' })),
    defaultProvider: preference.defaultProvider,
  });
}
