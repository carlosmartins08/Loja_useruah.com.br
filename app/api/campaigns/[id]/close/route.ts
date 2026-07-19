import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canMutateOwnedCampaign } from '@/lib/campaign-access';
import { getCampaign, updateCampaignStatus } from '@/lib/campaign-store';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const campaign = await getCampaign(id);
  if (!campaign) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (isRbacActive() && !canMutateOwnedCampaign(campaign, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await updateCampaignStatus({ campaignId: id, from: ['active', 'paused'], to: 'closed' });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  if (result.kind !== 'updated') return NextResponse.json({ error: 'not_found' }, { status: 404 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'campaign.closed',
    entity_type: 'Campaign',
    entity_id: result.campaign.campaignId,
    previous_status: result.previous.status,
    new_status: result.campaign.status,
  });

  return NextResponse.json({ ok: true, campaign: result.campaign });
}
