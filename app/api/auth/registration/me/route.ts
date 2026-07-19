import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decodeSessionToken } from '@/lib/session-token';
import { normalizeAuthSession } from '@/lib/auth-session';
import { getRegistrationByUserId, type RegistrationPersona, upsertRegistration } from '@/lib/registration-store';
import { hasAcceptedTerms, registerTermsAcceptance } from '@/lib/terms-acceptance-store';
import { normalizeTermVersion, PERSONA_ROLE, PERSONA_TERM, resolveRegistrationStatus } from '@/lib/registration-flow';
import { appendAuditLog } from '@/lib/audit-log-store';
import { isEmailRegistered } from '@/lib/user-identity-store';

interface RegistrationUpdatePayload {
  persona: RegistrationPersona;
  fullName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  draft: Record<string, unknown>;
}

function isValidPayload(payload: unknown): payload is RegistrationUpdatePayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  if (body.persona !== 'ALMA' && body.persona !== 'FAROL' && body.persona !== 'SOPRO') return false;
  if (typeof body.fullName !== 'string' || body.fullName.trim().length < 3) return false;
  if (typeof body.email !== 'string' || body.email.trim().length < 5) return false;
  if (typeof body.password !== 'string' || body.password.length < 6) return false;
  if (typeof body.termsAccepted !== 'boolean') return false;
  return typeof body.draft === 'object' && body.draft !== null;
}

function mapEntityType(persona: RegistrationPersona): 'consumer' | 'industry' | 'artist' {
  if (persona === 'ALMA') return 'consumer';
  if (persona === 'FAROL') return 'industry';
  return 'artist';
}

export async function GET() {
  const store = await cookies();
  const rawToken = store.get('ruah_session')?.value;
  const session = normalizeAuthSession(decodeSessionToken(rawToken));
  if (!session) {
    return NextResponse.json({ ok: true, authenticated: false, registration: null });
  }

  const registration = await getRegistrationByUserId(session.userId);
  return NextResponse.json({
    ok: true,
    authenticated: true,
    registration: registration
      ? {
          registrationId: registration.registrationId,
          role: registration.role,
          persona: registration.persona,
          status: registration.status,
          fullName: registration.fullName,
          email: registration.email,
          metadata: registration.metadata,
          createdAt: registration.createdAt,
          updatedAt: registration.updatedAt,
        }
      : null,
  });
}

export async function PATCH(request: Request) {
  const store = await cookies();
  const rawToken = store.get('ruah_session')?.value;
  const session = normalizeAuthSession(decodeSessionToken(rawToken));
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const role = PERSONA_ROLE[payload.persona];
  if (session.activeRole !== role) {
    return NextResponse.json({ error: 'forbidden_role_context' }, { status: 403 });
  }

  const status = resolveRegistrationStatus(payload);
  const normalizedEmail = payload.email.trim().toLowerCase();
  if (normalizedEmail !== session.userEmail.toLowerCase() && (await isEmailRegistered(normalizedEmail))) {
    return NextResponse.json({ error: 'email_already_exists' }, { status: 409 });
  }
  const previous = await getRegistrationByUserId(session.userId);
  const registration = await upsertRegistration({
    userId: session.userId,
    role,
    persona: payload.persona,
    status,
    fullName: payload.fullName.trim(),
    email: normalizedEmail,
    metadata: payload.draft,
  });

  if (payload.termsAccepted) {
    const termType = PERSONA_TERM[payload.persona];
    const termVersion = normalizeTermVersion(termType);
    const alreadyAccepted = await hasAcceptedTerms({
      userId: session.userId,
      termType,
      termVersion,
    });
    if (!alreadyAccepted) {
      await registerTermsAcceptance({
        userId: session.userId,
        entityType: mapEntityType(payload.persona),
        entityId: session.userId,
        termType,
        termVersion,
        ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    }
  }

  if (!previous || previous.status !== registration.status) {
    appendAuditLog({
      actor_id: session.userId,
      actor_role: session.activeRole,
      action: 'auth.registration.updated',
      entity_type: 'registration',
      entity_id: session.userId,
      previous_status: previous?.status ?? 'none',
      new_status: registration.status,
      reason: `persona_${payload.persona.toLowerCase()}`,
    });
  }

  return NextResponse.json({
    ok: true,
    registration: {
      registrationId: registration.registrationId,
      role: registration.role,
      persona: registration.persona,
      status: registration.status,
      updatedAt: registration.updatedAt,
    },
  });
}
