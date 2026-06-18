import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getReferralLinkBySlug, recordReferralClick } from '@/lib/referral-store';

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const origin = new URL(request.url).origin;
  const link = getReferralLinkBySlug(slug);
  if (!link || link.status !== 'active') {
    const response = NextResponse.redirect(new URL('/shop', origin), { status: 307 });
    response.cookies.set('ruah_referral_link_id', '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });
    return response;
  }

  const click = recordReferralClick({ referralLinkId: link.referralLinkId });
  if (click.kind === 'created') {
    appendAuditLog({
      actor_id: 'public-visitor',
      actor_role: 'public',
      action: 'referral_click_recorded',
      entity_type: 'ReferralLink',
      entity_id: link.referralLinkId,
      reason: `slug:${slug}|target:${link.targetPath}`,
    });
  }

  const response = NextResponse.redirect(new URL(link.targetPath, origin), { status: 307 });
  response.cookies.set('ruah_referral_link_id', link.referralLinkId, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
