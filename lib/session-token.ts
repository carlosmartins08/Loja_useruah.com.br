import { createHmac, timingSafeEqual } from 'crypto';
import type { AuthSession } from '@/lib/auth-session';

interface SessionEnvelope {
  payload: AuthSession;
  sig: string;
}

function getSecret() {
  const configured = process.env.AUTH_SESSION_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SESSION_SECRET is required in production');
  }
  return 'dev-insecure-session-secret-change-me';
}

function signPayload(raw: string) {
  return createHmac('sha256', getSecret()).update(raw).digest('base64url');
}

export function encodeSessionToken(payload: AuthSession) {
  const rawPayload = JSON.stringify(payload);
  const sig = signPayload(rawPayload);
  const envelope: SessionEnvelope = { payload, sig };
  return encodeURIComponent(JSON.stringify(envelope));
}

export function decodeSessionToken(token: string | undefined): AuthSession | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(token)) as Partial<SessionEnvelope>;
    if (!parsed || !parsed.payload || typeof parsed.sig !== 'string') return null;
    const rawPayload = JSON.stringify(parsed.payload);
    const expectedSig = signPayload(rawPayload);
    const valid = timingSafeEqual(Buffer.from(parsed.sig), Buffer.from(expectedSig));
    if (!valid) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}
