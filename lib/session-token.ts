import { createHmac, timingSafeEqual } from 'crypto';
import type { AuthSession } from '@/lib/auth-session';

interface SessionEnvelope {
  payload: AuthSession;
  sig: string;
}

// Contract for ruah_session:
// - Canonical token format at the application boundary:
//   encodeURIComponent(JSON.stringify({ payload, sig })).
// - When this token is written through Next's cookies API, the HTTP Set-Cookie
//   header may escape the token one extra time on the wire.
// - Readers accept the canonical token plus legacy over-escaped variants only to
//   avoid breaking active sessions during rollout.
// - New writers must always emit the canonical token through encodeSessionToken;
//   no module should manually add extra encoding layers.

function parseSessionEnvelope(raw: string): SessionEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SessionEnvelope>;
    if (!parsed || !parsed.payload || typeof parsed.sig !== 'string') return null;
    return parsed as SessionEnvelope;
  } catch {
    return null;
  }
}

function decodeCandidates(token: string) {
  const candidates = [token];
  let current = token;
  for (let index = 0; index < 3; index += 1) {
    try {
      const next = decodeURIComponent(current);
      if (!next || next === current) break;
      candidates.push(next);
      current = next;
    } catch {
      break;
    }
  }
  return candidates;
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

export function extractCookieValue(cookieHeader: string | undefined | null, cookieName: string) {
  return cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(`${cookieName}=`.length);
}

export function decodeSessionToken(token: string | undefined): AuthSession | null {
  if (!token) return null;
  for (const candidate of decodeCandidates(token)) {
    const envelope = parseSessionEnvelope(candidate);
    if (!envelope) continue;
    const rawPayload = JSON.stringify(envelope.payload);
    const expectedSig = signPayload(rawPayload);
    try {
      const valid = timingSafeEqual(Buffer.from(envelope.sig), Buffer.from(expectedSig));
      if (!valid) continue;
      return envelope.payload;
    } catch {
      continue;
    }
  }
  return null;
}
