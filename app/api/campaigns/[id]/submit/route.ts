import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { updateCampaignStatus } from '@/lib/campaign-store';

function canSubmit(actorRole: string | null | undefined) {
  return actorRole === 'community_manager' || actorRole === 'platform_admin';
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canSubmit(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await updateCampaignStatus({ campaignId: id, from: ['draft', 'rejected'], to: 'pending_review' });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'campaign.submitted',
    entity_type: 'Campaign',
    entity_id: result.campaign.campaignId,
    previous_status: result.previous.status,
    new_status: result.campaign.status,
  });

  return NextResponse.json({ ok: true, campaign: result.campaign });
}
