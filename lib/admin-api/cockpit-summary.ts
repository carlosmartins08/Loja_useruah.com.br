import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { listOrders } from '@/lib/order-store';
import { listProductionJobs } from '@/lib/production-store';
import { listTickets } from '@/lib/ticket-store';
import { listCampaigns } from '@/lib/campaign-store';
import { listImpactReviews } from '@/lib/impact-review-store';
import { listPayouts } from '@/lib/payout-store';
import { listRefunds } from '@/lib/refund-store';
import { listChargebackEvents } from '@/lib/chargeback-store';
import { listRegistrations } from '@/lib/registration-store';

function isAdminActor(role: string | null | undefined) {
  return role === 'platform_admin' || role === 'finance_admin';
}

export async function handleAdminCockpitSummaryGet(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !isAdminActor(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const [orders, productionJobs, tickets, campaigns, payouts, refunds, chargebacks, registrations] = await Promise.all([
    listOrders(),
    listProductionJobs(),
    listTickets(),
    listCampaigns(),
    listPayouts(),
    listRefunds(),
    listChargebackEvents(),
    listRegistrations({ limit: 500 }),
  ]);

  const [pendingImpacts, overdueImpacts] = await Promise.all([
    listImpactReviews({ status: 'pending_review' }),
    listImpactReviews({ status: 'pending_review', onlyOverdue: true }),
  ]);

  const gmv = orders.reduce((acc, row) => acc + row.totalAmount, 0);
  const paidOrders = orders.filter(
    (row) =>
      row.status === 'paid' ||
      row.status === 'in_production' ||
      row.status === 'shipped' ||
      row.status === 'delivered' ||
      row.status === 'closed',
  );
  const shippedOrders = orders.filter((row) => row.status === 'shipped' || row.status === 'delivered' || row.status === 'closed');
  const delayedProduction = productionJobs.filter((row) => {
    if (row.status === 'shipped' || row.status === 'cancelled') return false;
    const ageMs = Date.now() - Date.parse(row.updatedAt);
    return Number.isFinite(ageMs) && ageMs > 1000 * 60 * 60 * 24 * 2;
  });
  const criticalTickets = tickets.filter((row) => row.status === 'open').length;
  const activeCampaigns = campaigns.filter((row) => row.status === 'active').length;
  const campaignsAtRisk = campaigns.filter((row) => row.status === 'pending_review' || row.status === 'paused').length;
  const pendingPayouts = payouts.filter((row) => row.status === 'requested' || row.status === 'under_review').length;
  const supplierAlerts = registrations.filter((row) => row.role === 'supplier' && row.status !== 'active').length;

  const checkoutConversion = orders.length === 0 ? 0 : Number(((paidOrders.length / orders.length) * 100).toFixed(1));

  return NextResponse.json({
    ok: true,
    summary: {
      gmv,
      paidOrders: paidOrders.length,
      shippedOrders: shippedOrders.length,
      delayedOrders: delayedProduction.length,
      activeCampaigns,
      campaignsAtRisk,
      impactedProducts: pendingImpacts.filter((row) => row.entityType === 'CatalogItem').length,
      supplierAlerts,
      pendingPayouts,
      criticalTickets,
      pendingImpactAlerts: pendingImpacts.length,
      overdueImpactAlerts: overdueImpacts.length,
      checkoutConversionPct: checkoutConversion,
      refunds: refunds.length,
      chargebacks: chargebacks.length,
    },
  });
}
