import { createHmac } from 'node:crypto';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';

ensureQaEnvLoaded();

export function withWebhookSignature(body, headers = {}) {
  const rawBody = JSON.stringify(body);
  const declaredProvider = String(headers['x-provider'] ?? headers['X-Provider'] ?? body?.provider ?? '').trim().toLowerCase();

  if (declaredProvider === 'stripe') {
    const stripeSecret = process.env.PAYMENT_STRIPE_WEBHOOK_SECRET?.trim();
    if (!stripeSecret) return headers;
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${rawBody}`;
    const signature = createHmac('sha256', stripeSecret).update(signedPayload).digest('hex');
    return { ...headers, 'stripe-signature': `t=${timestamp},v1=${signature}` };
  }

  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) return headers;
  const signature = createHmac('sha256', secret).update(rawBody).digest('hex');
  return { ...headers, 'x-signature': signature };
}
