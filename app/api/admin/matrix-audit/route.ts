import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { listRegistrations } from '@/lib/registration-store';
import { evaluateRequiredFieldsCompletion } from '@/lib/role-matrix/registration-matrix';
import { listCatalogItems } from '@/lib/catalog-item-store';

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor || (actor.actorRole !== 'platform_admin' && actor.actorRole !== 'support_agent' && actor.actorRole !== 'finance_admin')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const registrations = await listRegistrations({ limit: 500 });
  const registrationDrift = registrations
    .map((row) => {
      const source = {
        ...row.metadata,
        name: row.fullName,
        email: row.email,
      };
      const completion = evaluateRequiredFieldsCompletion(row.role, source);
      return {
        userId: row.userId,
        role: row.role,
        status: row.status,
        complete: completion.complete,
        missingFields: completion.missing,
      };
    })
    .filter((row) => !row.complete);

  const catalogItems = await listCatalogItems();
  const catalogDrift = catalogItems
    .map((row) => {
      const missing: string[] = [];
      if (!row.pricingPolicy) missing.push('pricingPolicy');
      if (row.pricingPolicy && row.pricingPolicy.promoPriceFloor < row.pricingPolicy.minPrice) missing.push('promoFloorBelowMin');
      if (row.price < (row.pricingPolicy?.minPrice ?? 0)) missing.push('priceBelowMin');
      return { catalogItemId: row.catalogItemId, publicationStatus: row.publicationStatus, missing };
    })
    .filter((row) => row.missing.length > 0);

  return NextResponse.json({
    ok: true,
    summary: {
      registrationInconsistencies: registrationDrift.length,
      catalogInconsistencies: catalogDrift.length,
    },
    registrationDrift,
    catalogDrift,
  });
}
