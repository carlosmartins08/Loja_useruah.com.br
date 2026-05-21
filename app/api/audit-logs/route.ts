import { NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/audit-log-store';

export async function GET() {
  return NextResponse.json({ ok: true, logs: listAuditLogs() });
}
