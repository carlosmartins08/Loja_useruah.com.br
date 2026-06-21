import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageAffiliateLinksActor, getActorFromRequest, isActorRole, isRbacActive } from '@/lib/access-control';
import { getReferralLinkById, updateReferralLinkStatus } from '@/lib/referral-store';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!canManageAffiliateLinksActor(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const link = getReferralLinkById(id);
  if (!link) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!isActorRole(actor, 'platform_admin') && actor?.actorId !== link.ownerId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = updateReferralLinkStatus({ referralLinkId: id, from: ['paused'], to: 'active' });
  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (result.kind === 'invalid_transition') {
    return NextResponse.json({ error: 'invalid_transition', status: result.link.status }, { status: 409 });
  }
  if (result.kind === 'unchanged') {
    return NextResponse.json({ ok: true, link: result.link, reused: true });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'referral_link_activated',
    entity_type: 'ReferralLink',
    entity_id: result.link.referralLinkId,
    previous_status: result.previous.status,
    new_status: result.link.status,
    reason: `slug:${result.link.slug}`,
  });

  return NextResponse.json({ ok: true, link: result.link });
}
