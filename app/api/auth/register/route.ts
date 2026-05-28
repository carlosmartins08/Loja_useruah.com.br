import { NextResponse } from 'next/server';
import { encodeSessionToken } from '@/lib/session-token';
import { isUserRole, type AuthSession, type UserRole } from '@/lib/auth-session';
import { registerLocalUser } from '@/lib/auth-local-users';
import { registerTermsAcceptance } from '@/lib/terms-acceptance-store';
import { upsertRegistration, type RegistrationPersona } from '@/lib/registration-store';
import {
  evaluateRegistrationCompleteness,
  PERSONA_ROLE,
  PERSONA_TERM,
  normalizeTermVersion,
  resolveRegistrationStatus,
} from '@/lib/registration-flow';
import { appendAuditLog } from '@/lib/audit-log-store';

interface RegisterPayload {
  persona: RegistrationPersona;
  fullName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  draft: Record<string, unknown>;
}

function isValidPayload(payload: unknown): payload is RegisterPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  if (body.persona !== 'ALMA' && body.persona !== 'FAROL' && body.persona !== 'SOPRO') return false;
  if (typeof body.fullName !== 'string' || body.fullName.trim().length < 3) return false;
  if (typeof body.email !== 'string' || body.email.trim().length < 5) return false;
  if (typeof body.password !== 'string' || body.password.length < 6) return false;
  if (typeof body.termsAccepted !== 'boolean') return false;
  return typeof body.draft === 'object' && body.draft !== null;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const personaRole = PERSONA_ROLE[payload.persona];
  if (!isUserRole(personaRole)) return NextResponse.json({ error: 'invalid_role' }, { status: 422 });

  const status = resolveRegistrationStatus(payload);
  const completeness = evaluateRegistrationCompleteness(payload);
  const normalizedEmail = payload.email.trim().toLowerCase();
  const registration = registerLocalUser({
    email: normalizedEmail,
    password: payload.password,
    userName: payload.fullName.trim(),
    userRole: personaRole,
  });
  if (!registration.created) {
    return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
  }
  const user = registration.user;

  await upsertRegistration({
    userId: user.userId,
    role: personaRole,
    persona: payload.persona,
    status,
    fullName: payload.fullName.trim(),
    email: normalizedEmail,
    metadata: {
      ...payload.draft,
      matrixMissingFields: completeness.missing,
      matrixComplete: completeness.complete,
    },
  });

  appendAuditLog({
    actor_id: user.userId,
    actor_role: personaRole,
    action: 'auth.registration.created',
    entity_type: 'registration',
    entity_id: user.userId,
    previous_status: 'none',
    new_status: status,
    reason: `persona_${payload.persona.toLowerCase()}`,
  });

  if (payload.termsAccepted) {
    const termType = PERSONA_TERM[payload.persona];
    await registerTermsAcceptance({
      userId: user.userId,
      entityType: payload.persona === 'ALMA' ? 'consumer' : payload.persona === 'FAROL' ? 'industry' : 'artist',
      entityId: user.userId,
      termType,
      termVersion: normalizeTermVersion(termType),
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });
  }

  const session: AuthSession = {
    userId: user.userId,
    userName: user.userName,
    userEmail: normalizedEmail,
    userRole: personaRole,
    roles: [personaRole],
    activeRole: personaRole,
  };

  const response = NextResponse.json(
    { ok: true, status, session, matrix: { complete: completeness.complete, missingFields: completeness.missing } },
    { status: 201 }
  );
  response.cookies.set('ruah_session', encodeSessionToken(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
