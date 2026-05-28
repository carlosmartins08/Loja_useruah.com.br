import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { listIntegrationLogs } from '@/lib/integration-log-store';

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get('limit') ?? '20');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 20;
  const successParam = searchParams.get('success');
  const success =
    successParam === 'true' ? true : successParam === 'false' ? false : undefined;
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  let logs = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'payout_batch_settlement.executed',
    success,
    limit: 500,
  });

  if (dateFrom) {
    const fromTs = new Date(dateFrom).getTime();
    if (!Number.isNaN(fromTs)) {
      logs = logs.filter((row) => new Date(row.createdAt).getTime() >= fromTs);
    }
  }
  if (dateTo) {
    const toTs = new Date(dateTo).getTime();
    if (!Number.isNaN(toTs)) {
      logs = logs.filter((row) => new Date(row.createdAt).getTime() <= toTs);
    }
  }

  logs = logs.slice(0, limit);
  return NextResponse.json({ ok: true, logs });
}
