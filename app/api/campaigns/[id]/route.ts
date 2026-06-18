import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canReadCampaign } from '@/lib/campaign-access';
import { getCampaign } from '@/lib/campaign-store';
import { getCampaignOperationalDetail } from '@/lib/campaign-operational-detail';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const campaign = getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (isRbacActive() && !canReadCampaign(campaign, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const detail = await getCampaignOperationalDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...detail });
}
