import { NextResponse } from 'next/server';
import { authenticateLocalUser } from '@/lib/auth-local-users';
import { encodeSessionToken } from '@/lib/session-token';

interface LoginPayload {
  email: string;
  password: string;
}

function isValidPayload(payload: unknown): payload is LoginPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  return (
    typeof body.email === 'string' &&
    body.email.trim().length > 3 &&
    typeof body.password === 'string' &&
    body.password.length >= 4
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const session = authenticateLocalUser(payload.email, payload.password);
  if (!session) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, session });
  response.cookies.set('ruah_session', encodeSessionToken(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
