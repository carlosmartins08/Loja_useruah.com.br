import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { updateCampaignStatus } from '@/lib/campaign-store';

interface CancelPayload {
  reason: string;
}

function parsePayload(payload: unknown): CancelPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as Record<string, unknown>;
  if (typeof row.reason !== 'string' || !row.reason.trim()) return null;
  return { reason: row.reason.trim() };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (isRbacActive() && actor?.actorRole !== 'platform_admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const { id } = await context.params;
  const result = await updateCampaignStatus({ campaignId: id, from: ['active', 'paused'], to: 'cancelled' });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'campaign.cancelled',
    entity_type: 'Campaign',
    entity_id: result.campaign.campaignId,
    previous_status: result.previous.status,
    new_status: result.campaign.status,
    reason: payload.reason,
  });

  return NextResponse.json({ ok: true, campaign: result.campaign });
}
