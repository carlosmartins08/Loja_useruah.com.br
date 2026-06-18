import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getCampaign } from '@/lib/campaign-store';

export async function GET(request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await context.params;
  const origin = new URL(request.url).origin;
  const campaign = getCampaign(campaignId);
  const fallbackUrl = new URL('/shop', origin);
  const storefrontUrl = new URL(`/shop?campaignId=${encodeURIComponent(campaignId)}`, origin);

  if (!campaign || campaign.status !== 'active') {
    appendAuditLog({
      actor_id: 'public-visitor',
      actor_role: 'public',
      action: 'campaign.storefront_unavailable',
      entity_type: 'Campaign',
      entity_id: campaignId,
      reason: `status:${campaign?.status ?? 'not_found'}|target:/shop`,
    });

    const response = NextResponse.redirect(fallbackUrl, { status: 307 });
    response.cookies.set('ruah_campaign_id', '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });
    return response;
  }

  appendAuditLog({
    actor_id: 'public-visitor',
    actor_role: 'public',
    action: 'campaign.storefront_opened',
    entity_type: 'Campaign',
    entity_id: campaign.campaignId,
    reason: `target:${storefrontUrl.pathname}${storefrontUrl.search}`,
  });

  appendAuditLog({
    actor_id: 'public-visitor',
    actor_role: 'public',
    action: 'campaign.context_redirected',
    entity_type: 'Campaign',
    entity_id: campaign.campaignId,
    reason: `source:/c/${campaign.campaignId}/shop|target:${storefrontUrl.pathname}${storefrontUrl.search}`,
  });

  const response = NextResponse.redirect(storefrontUrl, { status: 307 });
  response.cookies.set('ruah_campaign_id', campaign.campaignId, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
