import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { isUserRole, normalizeAuthSession } from '@/lib/auth-session';
import { decodeSessionToken, encodeSessionToken } from '@/lib/session-token';

interface ActiveRolePayload {
  activeRole: string;
}

function isValidPayload(payload: unknown): payload is ActiveRolePayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.activeRole === 'string' && row.activeRole.trim().length > 0;
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const nextRole = payload.activeRole.trim();
  if (!isUserRole(nextRole)) {
    return NextResponse.json({ error: 'validation_error', detail: 'invalid_role' }, { status: 422 });
  }

  const store = await cookies();
  const token = store.get('ruah_session')?.value;
  const current = normalizeAuthSession(decodeSessionToken(token));
  if (!current) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!current.roles.includes(nextRole)) {
    return NextResponse.json({ error: 'forbidden', detail: 'role_not_in_session_scope' }, { status: 403 });
  }
  if (current.activeRole === nextRole) {
    return NextResponse.json({ ok: true, session: current, changed: false });
  }

  const updatedSession = {
    ...current,
    activeRole: nextRole,
    userRole: nextRole,
  };

  const response = NextResponse.json({ ok: true, session: updatedSession, changed: true });
  response.cookies.set('ruah_session', encodeSessionToken(updatedSession), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  appendAuditLog({
    actor_id: current.userId,
    actor_role: current.activeRole,
    action: 'auth.active_role_switched',
    entity_type: 'AuthSession',
    entity_id: current.userId,
    previous_status: current.activeRole,
    new_status: nextRole,
    reason: 'user_context_switch',
  });

  return response;
}

