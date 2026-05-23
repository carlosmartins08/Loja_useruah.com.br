import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isUserRole, type AuthSession } from '@/lib/auth-session';
import { decodeSessionToken } from '@/lib/session-token';

function parseSession(raw: string | undefined): AuthSession | null {
  const parsed = decodeSessionToken(raw);
  if (!parsed) return null;
  if (
    typeof parsed.userId !== 'string' ||
    typeof parsed.userName !== 'string' ||
    typeof parsed.userEmail !== 'string' ||
    !isUserRole(parsed.userRole)
  ) {
    return null;
  }
  return parsed;
}

export async function GET() {
  const store = await cookies();
  const session = parseSession(store.get('ruah_session')?.value);
  if (!session) {
    return NextResponse.json({ ok: true, authenticated: false, session: null });
  }
  return NextResponse.json({ ok: true, authenticated: true, session });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('ruah_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
