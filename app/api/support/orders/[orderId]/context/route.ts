import { NextResponse } from 'next/server';
import { canAccessSupportContext, getActorFromRequest } from '@/lib/access-control';
import { buildOrderOperationalView } from '@/lib/order-operational-view';
import { listImpactReviewsByEntities } from '@/lib/impact-review-store';

export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const actor = getActorFromRequest(request);
  if (!canAccessSupportContext(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { orderId } = await context.params;
  const view = await buildOrderOperationalView(orderId, { includeTickets: true });
  if (!view) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const catalogItemIds = Array.from(new Set(view.order.items.map((item) => item.catalogItemId)));
  const relatedReviews = (await listImpactReviewsByEntities('CatalogItem', catalogItemIds)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const pending = relatedReviews.filter((row) => row.status === 'pending_review');
  const rejected = relatedReviews.filter((row) => row.status === 'rejected');
  const approved = relatedReviews.filter((row) => row.status === 'approved');
  const overduePending = pending.filter((row) => new Date(row.dueAt).getTime() < Date.now());

  return NextResponse.json({
    ok: true,
    order: {
      id: view.order.orderId,
      status: view.order.status,
      customerId: view.order.customerId,
      createdAt: view.order.createdAt,
    },
    payment: view.payment
      ? {
          id: view.payment.paymentId,
          status: view.payment.status,
        }
      : null,
    production: view.production
      ? {
          id: view.production.productionJobId,
          status: view.production.status,
        }
      : null,
    shipment: view.shipment
      ? {
          trackingCode: view.shipment.trackingCode,
          carrier: view.shipment.carrier,
        }
      : null,
    tickets: view.tickets.map((ticket) => ({
      ticketId: ticket.ticketId,
      orderId: ticket.orderId,
      customerId: ticket.customerId,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages,
    })),
    impactReview: {
      hasRisk: pending.length > 0 || rejected.length > 0,
      pendingCount: pending.length,
      overduePendingCount: overduePending.length,
      rejectedCount: rejected.length,
      approvedCount: approved.length,
      reviewsByCatalogItem: catalogItemIds.map((catalogItemId) => {
        const latest = relatedReviews.find((row) => row.entityId === catalogItemId) ?? null;
        return {
          catalogItemId,
          latestReview: latest
            ? {
                reviewId: latest.reviewId,
                status: latest.status,
                dueAt: latest.dueAt,
                priority: latest.priority,
                decisionReason: latest.decisionReason ?? null,
              }
            : null,
        };
      }),
    },
    auditSummary: view.auditSummary,
  });
}
