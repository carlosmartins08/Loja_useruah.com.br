import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { updatePayoutStatus } from '@/lib/payout-store';
import { ElevationError, requireElevationIfNeeded } from '@/lib/privilege-elevation-service';

interface RejectPayload {
  reason: string;
}

function isValidPayload(payload: unknown): payload is RejectPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.reason === 'string' && row.reason.trim().length > 0;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const { id } = await context.params;
  try {
    requireElevationIfNeeded({
      request,
      action: 'payout.rejected',
      requiredRole: 'finance_admin',
      entityType: 'Payout',
      entityId: id,
      scope: 'finance:payout:reject',
    });
  } catch (error) {
    if (error instanceof ElevationError) {
      return NextResponse.json({ error: error.code, detail: error.detail }, { status: error.status });
    }
    throw error;
  }
  const result = await updatePayoutStatus({ payoutId: id, from: ['under_review', 'requested'], to: 'rejected' });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'payout.rejected',
    entity_type: 'Payout',
    entity_id: result.payout.payoutId,
    previous_status: result.previous.status,
    new_status: result.payout.status,
    reason: payload.reason.trim(),
  });

  return NextResponse.json({ ok: true, payout: result.payout });
}
