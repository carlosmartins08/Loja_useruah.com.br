import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { buildSupplierIntelligence } from '@/lib/supplier-intelligence';

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor || (actor.actorRole !== 'platform_admin' && actor.actorRole !== 'finance_admin' && actor.actorRole !== 'support_agent')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplierId')?.trim() || undefined;
  const rows = await buildSupplierIntelligence(supplierId);
  return NextResponse.json({ ok: true, suppliers: rows });
}
