import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/auth-session';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { listRegistrationsPage } from '@/lib/registration-store';
import type { RegistrationStatus } from '@/lib/role-matrix/registration-matrix';
import { canReadRegistrationQueue } from '@/lib/role-matrix/permission-matrix';

function parseStatus(raw: string | null): RegistrationStatus | undefined {
  if (!raw) return undefined;
  if (
    raw === 'empty' ||
    raw === 'draft' ||
    raw === 'incomplete' ||
    raw === 'pending_review' ||
    raw === 'approved' ||
    raw === 'active' ||
    raw === 'paused' ||
    raw === 'blocked'
  ) {
    return raw;
  }
  return undefined;
}

function parseRole(raw: string | null): UserRole | undefined {
  if (!raw) return undefined;
  if (
    raw === 'customer' ||
    raw === 'supplier' ||
    raw === 'platform_admin' ||
    raw === 'support_agent' ||
    raw === 'production_operator' ||
    raw === 'finance_admin' ||
    raw === 'artist' ||
    raw === 'community_manager'
  ) {
    return raw;
  }
  return undefined;
}

export async function handleAdminRegistrationsGet(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canReadRegistrationQueue(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get('status'));
  const role = parseRole(searchParams.get('role'));
  const limitRaw = Number(searchParams.get('limit') ?? '80');
  const offsetRaw = Number(searchParams.get('offset') ?? '0');
  const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(1, Math.round(limitRaw))) : 80;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.round(offsetRaw)) : 0;
  const page = await listRegistrationsPage({ status, role, limit, offset });

  return NextResponse.json({
    ok: true,
    registrations: page.rows,
    pagination: {
      total: page.total,
      limit: page.limit,
      offset: page.offset,
      hasNext: page.offset + page.limit < page.total,
      hasPrev: page.offset > 0,
    },
  });
}
