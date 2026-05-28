import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canReadRegistrationQueue } from '@/lib/role-matrix/permission-matrix';
import { listRegistrations } from '@/lib/registration-store';
import type { RegistrationStatus } from '@/lib/role-matrix/registration-matrix';
import type { UserRole } from '@/lib/auth-session';

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

function toCsvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canReadRegistrationQueue(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get('status'));
  const role = parseRole(searchParams.get('role'));
  const quick = searchParams.get('quick');
  const limitRaw = Number(searchParams.get('limit') ?? '500');
  const limit = Number.isFinite(limitRaw) ? Math.min(2000, Math.max(1, Math.round(limitRaw))) : 500;
  let registrations = await listRegistrations({ status, role, limit });

  if (quick === 'critical') {
    const now = Date.now();
    registrations = registrations.filter(
      (row) => row.status === 'incomplete' && now - new Date(row.updatedAt).getTime() >= 24 * 60 * 60 * 1000
    );
  }

  const header = [
    'registration_id',
    'user_id',
    'full_name',
    'email',
    'role',
    'persona',
    'status',
    'last_reminder_at',
    'last_reminder_by',
    'last_action_type',
    'last_action_reason',
    'updated_at',
    'created_at',
  ];

  const lines = [
    header.join(','),
    ...registrations.map((row) =>
      [
        row.registrationId,
        row.userId,
        row.fullName,
        row.email,
        row.role,
        row.persona,
        row.status,
        row.metadata?.lastReminderAt ?? '',
        row.metadata?.lastReminderBy ?? '',
        row.metadata?.lastActionType ?? '',
        row.metadata?.lastActionReason ?? '',
        row.updatedAt,
        row.createdAt,
      ]
        .map(toCsvCell)
        .join(',')
    ),
  ];

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="registrations_queue_${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
