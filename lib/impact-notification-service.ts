import { renderContentMessageByLayer } from '@/lib/content-messages';
import { appendIntegrationLog } from '@/lib/integration-log-store';

type ImpactNotificationEvent = 'created_pending' | 'created_overdue' | 'rejected' | 'approved';

function messageIdByEvent(event: ImpactNotificationEvent) {
  if (event === 'created_overdue') return 'support_impact_overdue_macro';
  if (event === 'rejected') return 'support_impact_rejected_macro';
  if (event === 'approved') return 'support_impact_pending_macro';
  return 'support_impact_pending_macro';
}

export async function notifyImpactReviewEvent(input: {
  event: ImpactNotificationEvent;
  reviewId: string;
  entityId: string;
  actorId: string;
  actorRole: string;
  dueAt?: string;
  reason?: string;
}) {
  const messageId = messageIdByEvent(input.event);
  const rendered = renderContentMessageByLayer(messageId, { layer: 'base' });
  const headline = rendered?.headline ?? 'Impact review notification';
  const body = rendered?.body ?? 'Impact review event recorded.';

  await appendIntegrationLog({
    provider: 'internal_ops',
    action: `impact_review_notify.${input.event}`,
    requestPayload: {
      reviewId: input.reviewId,
      entityId: input.entityId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      dueAt: input.dueAt ?? null,
      reason: input.reason ?? null,
    },
    responsePayload: {
      messageId,
      headline,
      body,
    },
    statusCode: 200,
    success: true,
  });
}
