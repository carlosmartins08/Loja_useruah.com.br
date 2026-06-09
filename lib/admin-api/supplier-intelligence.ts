import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { buildSupplierIntelligence } from '@/lib/supplier-intelligence';

function canReadSupplierIntelligence(role: string | null | undefined) {
  return role === 'platform_admin' || role === 'finance_admin' || role === 'support_agent';
}

export async function handleAdminSupplierIntelligenceGet(request: Request) {
  const actor = getActorFromRequest(request);
  if (!canReadSupplierIntelligence(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplierId')?.trim() || undefined;
  const rows = await buildSupplierIntelligence(supplierId);
  return NextResponse.json({ ok: true, suppliers: rows });
}
