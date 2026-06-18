import { NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (isRbacActive() && actor.actorRole !== 'platform_admin' && !canManageFinancialOperations(actor.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType')?.trim();
  const entityId = searchParams.get('entityId')?.trim();
  const actorRole = searchParams.get('actorRole')?.trim();
  const actions = searchParams
    .get('actions')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const since = searchParams.get('since')?.trim();
  const limit = Number(searchParams.get('limit') ?? 0);

  let logs = listAuditLogs();
  if (entityType) logs = logs.filter((row) => row.entity_type === entityType);
  if (entityId) logs = logs.filter((row) => row.entity_id === entityId);
  if (actorRole) logs = logs.filter((row) => row.actor_role === actorRole);
  if (actions && actions.length > 0) logs = logs.filter((row) => actions.includes(row.action));
  if (since) logs = logs.filter((row) => row.created_at >= since);
  if (Number.isFinite(limit) && limit > 0) logs = logs.slice(-limit);

  return NextResponse.json({ ok: true, logs });
}
