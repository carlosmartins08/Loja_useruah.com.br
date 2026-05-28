import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { appendIntegrationLog } from '@/lib/integration-log-store';
import { settlePayoutToPaid } from '@/lib/payout-settlement-service';
import type { PayoutReconciliationFailureCode } from '@/lib/payout-reconciliation-codes';
import { getPayoutFailurePlaybook } from '@/lib/payout-reconciliation-playbook';

interface BatchPayload {
  payoutIds: string[];
}

function parsePayload(payload: unknown): BatchPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as Record<string, unknown>;
  if (!Array.isArray(row.payoutIds)) return null;
  const payoutIds = row.payoutIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0).map((id) => id.trim());
  if (payoutIds.length === 0) return null;
  return { payoutIds: Array.from(new Set(payoutIds)) };
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const results: Array<{
    payoutId: string;
    ok: boolean;
    detail: string;
    failureCode?: PayoutReconciliationFailureCode | 'not_found' | 'invalid_transition';
    playbookAction?: string;
    playbookOwner?: string;
    playbookSeverity?: string;
    reconciliation?: Record<string, unknown>;
  }> = [];
  for (const payoutId of payload.payoutIds) {
    const settled = await settlePayoutToPaid({
      payoutId,
      actorId: actor?.actorId ?? 'unknown',
      actorRole: actor?.actorRole ?? 'unknown',
    });
    if (settled.kind === 'settled') {
      results.push({ payoutId, ok: true, detail: 'paid', reconciliation: settled.reconciliation as unknown as Record<string, unknown> });
    } else if (settled.kind === 'precheck_failed') {
      const pb = getPayoutFailurePlaybook(settled.precheck.detail);
      results.push({
        payoutId,
        ok: false,
        detail: settled.precheck.detail,
        failureCode: settled.precheck.detail,
        playbookAction: pb?.action,
        playbookOwner: pb?.owner,
        playbookSeverity: pb?.severity,
        reconciliation: settled.precheck.reconciliation,
      });
    } else {
      const pb = getPayoutFailurePlaybook(settled.kind);
      results.push({
        payoutId,
        ok: false,
        detail: settled.kind,
        failureCode: settled.kind,
        playbookAction: pb?.action,
        playbookOwner: pb?.owner,
        playbookSeverity: pb?.severity,
      });
    }
  }

  const successCount = results.filter((row) => row.ok).length;
  const failCount = results.length - successCount;
  await appendIntegrationLog({
    provider: 'internal_ops',
    action: 'payout_batch_settlement.executed',
    requestPayload: { payoutIds: payload.payoutIds, actorId: actor?.actorId ?? 'unknown', actorRole: actor?.actorRole ?? 'unknown' },
    responsePayload: { successCount, failCount, results },
    statusCode: 200,
    success: failCount === 0,
    errorMessage: failCount > 0 ? `partial_failure:${failCount}` : undefined,
  });

  return NextResponse.json({ ok: true, summary: { total: results.length, successCount, failCount }, results });
}
