import { NextResponse } from 'next/server';
import { getProductionJobById } from '@/lib/production-store';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await getProductionJobById(id);
  if (!job) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, job });
}
