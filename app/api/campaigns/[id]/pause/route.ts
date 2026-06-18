import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canModerateCampaigns } from '@/lib/role-matrix/permission-matrix';
import { updateCampaignStatus } from '@/lib/campaign-store';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (isRbacActive() && !canModerateCampaigns(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await updateCampaignStatus({ campaignId: id, from: ['active'], to: 'paused' });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'campaign.paused',
    entity_type: 'Campaign',
    entity_id: result.campaign.campaignId,
    previous_status: result.previous.status,
    new_status: result.campaign.status,
  });

  return NextResponse.json({ ok: true, campaign: result.campaign });
}
