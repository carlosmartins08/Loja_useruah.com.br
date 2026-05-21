import { NextResponse } from 'next/server';
import { listProductionJobs } from '@/lib/production-store';

export async function GET() {
  return NextResponse.json({ ok: true, jobs: await listProductionJobs() });
}
