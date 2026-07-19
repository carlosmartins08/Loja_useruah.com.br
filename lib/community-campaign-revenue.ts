import { listCommissionsByOwner, reconcileCommissionAvailabilityForOwner } from '@/lib/commission-store';
import { getCampaign, type CampaignStatus } from '@/lib/campaign-store';
import { listOrders } from '@/lib/order-store';

export interface CommunityCampaignRevenueEntry {
  campaignId: string;
  campaignName: string;
  campaignStatus: CampaignStatus | 'unknown';
  orderCount: number;
  commissionCount: number;
  pending: number;
  availableGross: number;
  latestOrderAt: string | null;
}

export interface CommunityCampaignRevenueOrder {
  campaignId: string;
  orderId: string;
  orderItemId: string;
  commissionId: string;
  commissionStatus: string;
  commissionAmount: number;
  orderCreatedAt: string;
  orderPaidAt: string | null;
}

interface CommunityCampaignRevenueResult {
  campaigns: CommunityCampaignRevenueEntry[];
  orders?: CommunityCampaignRevenueOrder[];
}

function parseCommunityCommissionSourceKey(sourceKey: string) {
  const match = sourceKey.match(/^order\.paid:([^:]+):item:([^:]+):community:(.+)$/);
  if (!match) return null;
  return {
    orderId: match[1],
    orderItemId: match[2],
    ownerId: match[3],
  };
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export async function listCommunityCampaignRevenueByOwner(
  ownerId: string,
  options?: { includeOrders?: boolean }
): Promise<CommunityCampaignRevenueResult> {
  await reconcileCommissionAvailabilityForOwner(ownerId);

  const [commissions, orders] = await Promise.all([listCommissionsByOwner(ownerId), listOrders()]);
  const orderById = new Map(orders.map((order) => [order.orderId, order]));
  const campaigns = new Map<
    string,
    CommunityCampaignRevenueEntry & {
      orderIds: Set<string>;
    }
  >();
  const orderRows: CommunityCampaignRevenueOrder[] = [];

  for (const commission of commissions) {
    if (commission.ownerRole !== 'community_manager') continue;

    const parsedSource = parseCommunityCommissionSourceKey(commission.sourceKey);
    if (!parsedSource || parsedSource.ownerId !== ownerId) continue;

    const order = orderById.get(parsedSource.orderId);
    if (!order) continue;

    const orderItem = order.items.find((item) => item.orderItemId === parsedSource.orderItemId);
    if (!orderItem || orderItem.communityOwnerId !== ownerId || !orderItem.campaignId) continue;

    const campaign = await getCampaign(orderItem.campaignId);
    const latestOrderAt = order.paidAt ?? order.createdAt;
    const current =
      campaigns.get(orderItem.campaignId) ??
      {
        campaignId: orderItem.campaignId,
        campaignName: orderItem.campaignName ?? campaign?.name ?? orderItem.campaignId,
        campaignStatus: campaign?.status ?? 'unknown',
        orderCount: 0,
        commissionCount: 0,
        pending: 0,
        availableGross: 0,
        latestOrderAt: null,
        orderIds: new Set<string>(),
      };

    current.campaignName = orderItem.campaignName ?? campaign?.name ?? current.campaignName;
    current.campaignStatus = campaign?.status ?? current.campaignStatus;
    current.commissionCount += 1;

    if (!current.orderIds.has(order.orderId)) {
      current.orderIds.add(order.orderId);
      current.orderCount += 1;
    }

    if (commission.status === 'pending') {
      current.pending = roundCurrency(current.pending + commission.amount);
    }

    if (commission.status === 'available') {
      current.availableGross = roundCurrency(current.availableGross + commission.amount);
    }

    if (!current.latestOrderAt || latestOrderAt > current.latestOrderAt) {
      current.latestOrderAt = latestOrderAt;
    }

    campaigns.set(orderItem.campaignId, current);

    if (options?.includeOrders) {
      orderRows.push({
        campaignId: orderItem.campaignId,
        orderId: order.orderId,
        orderItemId: orderItem.orderItemId,
        commissionId: commission.commissionId,
        commissionStatus: commission.status,
        commissionAmount: roundCurrency(commission.amount),
        orderCreatedAt: order.createdAt,
        orderPaidAt: order.paidAt ?? null,
      });
    }
  }

  const sortedCampaigns = Array.from(campaigns.values())
    .map(({ orderIds: _orderIds, ...row }) => row)
    .sort((left, right) => {
      if (right.availableGross !== left.availableGross) {
        return right.availableGross - left.availableGross;
      }

      return (right.latestOrderAt ?? '').localeCompare(left.latestOrderAt ?? '');
    });

  return {
    campaigns: sortedCampaigns,
    ...(options?.includeOrders
      ? {
          orders: orderRows.sort((left, right) => {
            const rightAt = right.orderPaidAt ?? right.orderCreatedAt;
            const leftAt = left.orderPaidAt ?? left.orderCreatedAt;
            return rightAt.localeCompare(leftAt);
          }),
        }
      : {}),
  };
}
