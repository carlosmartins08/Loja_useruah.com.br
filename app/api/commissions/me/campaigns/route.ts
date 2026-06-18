import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { listCommunityCampaignRevenueByOwner } from '@/lib/community-campaign-revenue';

function resolveOwnerId(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return { actor, error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  }

  if (actor.actorRole === 'community_manager') {
    return { actor, ownerId: actor.actorId, error: null };
  }

  if (actor.actorRole === 'platform_admin') {
    const ownerId = new URL(request.url).searchParams.get('ownerId')?.trim();
    if (!ownerId) {
      return {
        actor,
        error: NextResponse.json({ error: 'validation_error', detail: 'owner_id_required_for_platform_admin' }, { status: 422 }),
      };
    }

    return { actor, ownerId, error: null };
  }

  return { actor, error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
}

export async function GET(request: Request) {
  const resolved = resolveOwnerId(request);
  if (resolved.error) {
    return resolved.error;
  }

  const includeOrders = new URL(request.url).searchParams.get('includeOrders') === 'true';
  const breakdown = await listCommunityCampaignRevenueByOwner(resolved.ownerId, { includeOrders });

  return NextResponse.json({
    ok: true,
    ownerId: resolved.ownerId,
    ownerRole: 'community_manager',
    campaigns: breakdown.campaigns,
    ...(includeOrders ? { orders: breakdown.orders ?? [] } : {}),
  });
}
