import { NextResponse } from 'next/server';
import { getCampaign } from '@/lib/campaign-store';

export async function GET(request: Request, context: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await context.params;
  const origin = new URL(request.url).origin;
  const campaign = getCampaign(campaignId);
  const inactiveRedirectUrl = new URL('/shop', origin);
  const activeRedirectUrl = new URL(`/shop?campaignId=${encodeURIComponent(campaignId)}`, origin);
  const response = NextResponse.redirect(inactiveRedirectUrl, { status: 307 });
  if (!campaign || campaign.status !== 'active') {
    response.cookies.set('ruah_campaign_id', '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });
    return response;
  }

  response.headers.set('location', activeRedirectUrl.toString());
  response.cookies.set('ruah_campaign_id', campaign.campaignId, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
