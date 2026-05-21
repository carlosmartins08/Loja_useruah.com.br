import { NextResponse } from 'next/server';
import { applyWebhookEvent, PaymentFlowError, verifyWebhookSignature } from '@/lib/payment-service';

interface WebhookPayload {
  eventId?: string;
  providerReference: string;
  event: 'payment.approved' | 'payment.failed' | 'payment.pending';
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');
  const idempotencyKey = request.headers.get('x-idempotency-key');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid_webhook_signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as WebhookPayload;

  if (!body || !body.providerReference || !body.event || (!body.eventId && !idempotencyKey)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  try {
    const eventId = body.eventId || idempotencyKey || '';
    const maxRetriesRaw = Number(process.env.PAYMENT_WEBHOOK_MAX_RETRIES ?? '2');
    const maxRetries = Number.isFinite(maxRetriesRaw) && maxRetriesRaw > 0 ? Math.floor(maxRetriesRaw) : 2;
    let attempt = 0;
    let result: Awaited<ReturnType<typeof applyWebhookEvent>> | null = null;

    while (attempt < maxRetries) {
      attempt += 1;
      try {
        result = await applyWebhookEvent({
          providerReference: body.providerReference,
          event: body.event,
          eventId,
        });
        break;
      } catch (error) {
        const isFinalAttempt = attempt >= maxRetries;
        const isKnownFlowError = error instanceof PaymentFlowError;
        if (isKnownFlowError || isFinalAttempt) {
          throw error;
        }
      }
    }

    if (!result) {
      return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }

    if (result.kind === 'already_processed') {
      return NextResponse.json({ ok: true, status: 'already_processed' });
    }
    if (result.kind === 'not_found') {
      return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, payment: result.payment });
  } catch (error) {
    if (error instanceof PaymentFlowError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
