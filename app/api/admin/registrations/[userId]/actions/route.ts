import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageRegistrationStatus, canSendRegistrationReminder } from '@/lib/role-matrix/permission-matrix';
import { getRegistrationByUserId, patchRegistrationMetadata, setRegistrationStatus } from '@/lib/registration-store';
import { evaluateRequiredFieldsCompletion, type RegistrationStatus } from '@/lib/role-matrix/registration-matrix';

interface ActionPayload {
  action: 'send_reminder' | 'set_status';
  reason: string;
  status?: RegistrationStatus;
}

function isAllowedStatus(value: unknown): value is RegistrationStatus {
  return (
    value === 'empty' ||
    value === 'draft' ||
    value === 'incomplete' ||
    value === 'pending_review' ||
    value === 'approved' ||
    value === 'active' ||
    value === 'paused' ||
    value === 'blocked'
  );
}

function isValidPayload(payload: unknown): payload is ActionPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  if (body.action !== 'send_reminder' && body.action !== 'set_status') return false;
  if (typeof body.reason !== 'string' || body.reason.trim().length < 5) return false;
  if (body.action === 'set_status' && !isAllowedStatus(body.status)) return false;
  return true;
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const actor = getActorFromRequest(request);
  if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const { userId } = await context.params;
  if (!userId || userId.trim().length === 0) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  if (payload.action === 'send_reminder') {
    if (isRbacActive() && !canSendRegistrationReminder(actor.actorRole)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const result = await patchRegistrationMetadata({
      userId,
      patch: {
        lastReminderAt: new Date().toISOString(),
        lastReminderReason: payload.reason.trim(),
        lastReminderBy: actor.actorId,
        lastActionAt: new Date().toISOString(),
        lastActionBy: actor.actorId,
        lastActionType: 'send_reminder',
        lastActionReason: payload.reason.trim(),
      },
    });
    if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
    appendAuditLog({
      actor_id: actor.actorId,
      actor_role: actor.actorRole,
      action: 'auth.registration.reminder_sent',
      entity_type: 'registration',
      entity_id: userId,
      previous_status: result.previous.status,
      new_status: result.registration.status,
      reason: payload.reason.trim(),
    });
    return NextResponse.json({ ok: true, registration: result.registration });
  }

  if (isRbacActive() && !canManageRegistrationStatus(actor.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (payload.action === 'set_status' && (payload.status === 'approved' || payload.status === 'active')) {
    const registration = await getRegistrationByUserId(userId);
    if (!registration) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const source = {
      ...registration.metadata,
      name: registration.fullName,
      email: registration.email,
      termsAccepted: registration.metadata.termsAccepted ?? true,
    };
    const completion = evaluateRequiredFieldsCompletion(registration.role, source);
    if (!completion.complete) {
      return NextResponse.json(
        { error: 'validation_error', detail: 'registration_matrix_incomplete', missingFields: completion.missing },
        { status: 422 }
      );
    }
  }
  const result = await setRegistrationStatus({ userId, status: payload.status! });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const patched = await patchRegistrationMetadata({
    userId,
    patch: {
      lastActionAt: new Date().toISOString(),
      lastActionBy: actor.actorId,
      lastActionType: 'set_status',
      lastActionReason: payload.reason.trim(),
    },
  });
  if (patched.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  appendAuditLog({
    actor_id: actor.actorId,
    actor_role: actor.actorRole,
    action: 'auth.registration.status_changed',
    entity_type: 'registration',
    entity_id: userId,
    previous_status: result.previous.status,
    new_status: result.registration.status,
    reason: payload.reason.trim(),
  });
  return NextResponse.json({ ok: true, registration: patched.registration });
}
