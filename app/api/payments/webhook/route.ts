import { NextResponse } from 'next/server';
import { applyWebhookEvent, PaymentFlowError, verifyWebhookSignature } from '@/lib/payment-service';
import { appendIntegrationLog } from '@/lib/integration-log-store';
import { markProviderWebhookEventProcessed, registerProviderWebhookEvent } from '@/lib/provider-webhook-event-store';

interface WebhookPayload {
  eventId?: string;
  providerReference: string;
  event: 'payment.approved' | 'payment.failed' | 'payment.pending';
  provider?: string;
}

function inferProviderName(request: Request, body: WebhookPayload) {
  const fromHeader = request.headers.get('x-provider')?.trim().toLowerCase();
  if (fromHeader) return fromHeader;
  if (typeof body.provider === 'string' && body.provider.trim()) return body.provider.trim().toLowerCase();
  const ref = body.providerReference?.toLowerCase() ?? '';
  const known = ['inter', 'infinitepay', 'mercadopago', 'pagarme', 'cielo', 'stripe', 'gateway_real', 'gateway_sandbox', 'sandbox'];
  const byPrefix = known.find((item) => ref.startsWith(`${item}_`));
  if (byPrefix) return byPrefix;
  return process.env.PAYMENT_PROVIDER?.toLowerCase() ?? 'sandbox';
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
    const providerName = inferProviderName(request, body);
    const eventRegistration = await registerProviderWebhookEvent({
      provider: providerName,
      eventType: body.event,
      providerEventId: eventId,
      providerReference: body.providerReference,
      payload: body,
    });
    if (!eventRegistration.created && eventRegistration.event?.processed) {
      return NextResponse.json({ ok: true, status: 'already_processed' });
    }

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
      await markProviderWebhookEventProcessed({
        provider: providerName,
        providerEventId: eventId,
        processed: true,
      });
      return NextResponse.json({ ok: true, status: 'already_processed' });
    }
    if (result.kind === 'not_found') {
      await markProviderWebhookEventProcessed({
        provider: providerName,
        providerEventId: eventId,
        processed: false,
        errorMessage: 'payment_not_found',
      });
      return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
    }

    await markProviderWebhookEventProcessed({
      provider: providerName,
      providerEventId: eventId,
      processed: true,
    });
    await appendIntegrationLog({
      provider: providerName,
      action: 'webhook_payment',
      requestPayload: body,
      responsePayload: { status: 'processed' },
      statusCode: 200,
      success: true,
    });

    return NextResponse.json({ ok: true, payment: result.payment });
  } catch (error) {
    const providerName = inferProviderName(request, body);
    const eventId = body.eventId || idempotencyKey || '';
    await markProviderWebhookEventProcessed({
      provider: providerName,
      providerEventId: eventId,
      processed: false,
      errorMessage: error instanceof Error ? error.message : 'internal_error',
    });
    await appendIntegrationLog({
      provider: providerName,
      action: 'webhook_payment',
      requestPayload: body,
      responsePayload: null,
      statusCode: error instanceof PaymentFlowError ? error.status : 500,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'internal_error',
    });
    if (error instanceof PaymentFlowError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
