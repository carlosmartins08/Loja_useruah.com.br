import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import type { ElevationStatus } from '@/lib/privilege-elevation-store';
import { expireStalePrivilegeElevations, listPrivilegeElevations } from '@/lib/privilege-elevation-store';

export async function handleAdminElevationsGet(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canManageFinancialOperations(actor.actorRole) && actor.actorRole !== 'platform_admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  expireStalePrivilegeElevations();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'requested';
  const allowed: ElevationStatus[] = ['requested', 'approved', 'rejected', 'expired', 'used'];
  const rows = allowed.includes(status as ElevationStatus)
    ? listPrivilegeElevations({ status: status as ElevationStatus })
    : listPrivilegeElevations();
  return NextResponse.json({ ok: true, elevations: rows });
}
