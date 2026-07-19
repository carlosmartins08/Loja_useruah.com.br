import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageAffiliateLinksActor, canReadAffiliateWorkspaceActor, getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { createReferralLink, listReferralLinksByOwner } from '@/lib/referral-store';

interface CreateReferralLinkPayload {
  label: string;
  channel: string;
  targetPath: string;
  slug?: string;
  ownerId?: string;
}

function isValidCreatePayload(payload: unknown): payload is CreateReferralLinkPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  return (
    typeof body.label === 'string' &&
    body.label.trim().length > 0 &&
    typeof body.channel === 'string' &&
    body.channel.trim().length > 0 &&
    typeof body.targetPath === 'string' &&
    body.targetPath.startsWith('/') &&
    (body.slug === undefined || typeof body.slug === 'string') &&
    (body.ownerId === undefined || typeof body.ownerId === 'string')
  );
}

function summarize(links: Awaited<ReturnType<typeof listReferralLinksByOwner>>) {
  const clicks = links.reduce((acc, row) => acc + row.clickCount, 0);
  const conversions = links.reduce((acc, row) => acc + row.conversionCount, 0);
  const revenueAmount = Number(links.reduce((acc, row) => acc + row.revenueAmount, 0).toFixed(2));
  const conversionRate = clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(1)) : 0;
  return {
    totalLinks: links.length,
    clicks,
    conversions,
    conversionRate,
    revenueAmount,
  };
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!canReadAffiliateWorkspaceActor(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedOwnerId = searchParams.get('ownerId') ?? undefined;
  const ownerId = actor?.actorRole === 'platform_admin' && requestedOwnerId ? requestedOwnerId : actor?.actorId;
  if (!ownerId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const links = await listReferralLinksByOwner(ownerId);
  return NextResponse.json({ ok: true, ownerId, summary: summarize(links), links });
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!canManageAffiliateLinksActor(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidCreatePayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const ownerId = actor?.actorRole === 'platform_admin' && payload.ownerId?.trim() ? payload.ownerId.trim() : actor?.actorId;
  if (!ownerId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const link = await createReferralLink({
    ownerId,
    label: payload.label,
    channel: payload.channel,
    targetPath: payload.targetPath,
    slug: payload.slug,
  });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'referral_link_created',
    entity_type: 'ReferralLink',
    entity_id: link.referralLinkId,
    new_status: link.status,
    reason: `slug:${link.slug}|target:${link.targetPath}`,
  });

  return NextResponse.json({ ok: true, link }, { status: 201 });
}
