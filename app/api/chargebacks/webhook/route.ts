import { NextResponse } from 'next/server';
import { PaymentExceptionError, processChargeback } from '@/lib/payment-exception-service';

interface ChargebackWebhookPayload {
  eventId?: string;
  providerReference: string;
  reason?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ChargebackWebhookPayload | null;
  const idempotencyKey = request.headers.get('x-idempotency-key');
  const eventId = body?.eventId ?? idempotencyKey ?? '';

  if (!body || !body.providerReference || !eventId) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  try {
    const result = await processChargeback({
      eventId,
      providerReference: body.providerReference,
      reason: body.reason,
    });
    return NextResponse.json({ ok: true, payment: result.payment, status: result.alreadyProcessed ? 'already_processed' : 'processed' });
  } catch (error) {
    if (error instanceof PaymentExceptionError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
