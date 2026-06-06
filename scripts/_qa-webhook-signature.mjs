import { createHmac } from 'node:crypto';
import { ensureQaEnvLoaded } from './_qa-env.mjs';

ensureQaEnvLoaded();

export function withWebhookSignature(body, headers = {}) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) return headers;
  const rawBody = JSON.stringify(body);
  const signature = createHmac('sha256', secret).update(rawBody).digest('hex');
  return { ...headers, 'x-signature': signature };
}
