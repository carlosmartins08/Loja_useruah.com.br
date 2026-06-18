import { NextResponse } from 'next/server';
import { getPublicCampaignDetail } from '@/lib/campaign-public';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const detail = await getPublicCampaignDetail(id);

  if (detail.state === 'not_found') {
    return NextResponse.json(detail, { status: 404 });
  }

  return NextResponse.json(detail);
}
