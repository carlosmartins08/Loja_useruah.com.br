import { NextResponse } from 'next/server';
import { getProductionJobByOrderId } from '@/lib/production-store';

export async function GET(_: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const job = await getProductionJobByOrderId(orderId);
  if (!job) {
    return NextResponse.json({ ok: true, job: null });
  }
  return NextResponse.json({ ok: true, job });
}
