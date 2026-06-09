import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { appendIntegrationLog } from '@/lib/integration-log-store';
import { dimonaPing } from '@/lib/dimona-client';

function canManageIntegration(role: string | null | undefined) {
  return role === 'platform_admin' || role === 'finance_admin' || role === 'support_agent';
}

export async function handleAdminSupplierDimonaTestPost(request: Request) {
  const actor = getActorFromRequest(request);
  if (!canManageIntegration(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const response = await dimonaPing().catch((error: unknown) => ({
    ok: false,
    status: 0,
    payload: { message: error instanceof Error ? error.message : 'unknown_error' },
  }));

  await appendIntegrationLog({
    provider: 'dimona',
    action: 'connectivity.ping',
    requestPayload: null,
    responsePayload: response.payload,
    statusCode: response.status,
    success: response.ok,
    errorMessage: response.ok ? undefined : 'dimona_ping_failed',
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: 'integration_unavailable', detail: response.payload }, { status: 502 });
  }

  return NextResponse.json({ ok: true, detail: response.payload });
}
