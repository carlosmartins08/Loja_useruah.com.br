export const CAMPAIGN_PRICE_COMPOSITION_VERSION = 'phase2-campaign-pricing-v1' as const;

export interface CampaignPricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  discountPct: number;
  label: string;
}

export interface MovementMarkupSnapshot {
  type: 'campaign_progressive_pricing';
  rule: string;
  tierLabel: string;
  direction: 'discount';
  requestedDiscountPct: number;
  appliedDiscountPct: number;
  perUnitAmount: number;
  totalAmount: number;
  minPriceApplied: boolean;
}

export interface CampaignPriceComposition {
  priceCompositionVersion: typeof CAMPAIGN_PRICE_COMPOSITION_VERSION;
  quantity: number;
  rule: string;
  tierLabel: string;
  baseUnitPrice: number;
  effectiveUnitPrice: number;
  perUnitDelta: number;
  totalDelta: number;
  requestedDiscountPct: number;
  appliedDiscountPct: number;
  minPriceApplied: boolean;
  movementMarkup: MovementMarkupSnapshot | null;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function clampPct(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function parsePct(raw: string) {
  const normalized = raw.trim().replace('%', '');
  if (!normalized) return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return clampPct(value / 100);
}

function parseRange(raw: string) {
  const normalized = raw.trim();
  if (!normalized) return null;

  const openEnded = normalized.match(/^(\d+)\+$/);
  if (openEnded) {
    return {
      minQuantity: Number(openEnded[1]),
      maxQuantity: null,
    };
  }

  const closed = normalized.match(/^(\d+)-(\d+)$/);
  if (closed) {
    const minQuantity = Number(closed[1]);
    const maxQuantity = Number(closed[2]);
    if (maxQuantity < minQuantity) return null;
    return { minQuantity, maxQuantity };
  }

  const exact = normalized.match(/^(\d+)$/);
  if (exact) {
    const quantity = Number(exact[1]);
    return { minQuantity: quantity, maxQuantity: quantity };
  }

  return null;
}

export function parseProgressivePriceRule(rule: string | undefined): CampaignPricingTier[] {
  const normalizedRule = rule?.trim();
  if (!normalizedRule || normalizedRule.toLowerCase() === 'baseline') return [];

  return normalizedRule
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const [rawRange, rawPct] = entry.split('=');
      if (!rawRange || !rawPct) return [];
      const range = parseRange(rawRange);
      const discountPct = parsePct(rawPct);
      if (!range || discountPct <= 0) return [];
      return [
        {
          minQuantity: range.minQuantity,
          maxQuantity: range.maxQuantity,
          discountPct,
          label: entry,
        },
      ];
    })
    .sort((left, right) => left.minQuantity - right.minQuantity);
}

function pickTier(quantity: number, tiers: CampaignPricingTier[]) {
  return tiers.reduce<CampaignPricingTier | null>((selected, tier) => {
    const matchesMin = quantity >= tier.minQuantity;
    const matchesMax = tier.maxQuantity === null || quantity <= tier.maxQuantity;
    if (!matchesMin || !matchesMax) return selected;
    if (!selected) return tier;
    return tier.minQuantity >= selected.minQuantity ? tier : selected;
  }, null);
}

export function composeCampaignPrice(input: {
  baseUnitPrice: number;
  quantity: number;
  progressivePriceRule?: string;
  minUnitPrice?: number;
}): CampaignPriceComposition {
  const baseUnitPrice = round2(input.baseUnitPrice);
  const quantity = Math.max(1, Math.floor(input.quantity));
  const tiers = parseProgressivePriceRule(input.progressivePriceRule);
  const matchedTier = pickTier(quantity, tiers);
  const requestedDiscountPct = matchedTier?.discountPct ?? 0;
  const discountedUnitPrice = round2(baseUnitPrice * (1 - requestedDiscountPct));
  const minUnitPrice =
    typeof input.minUnitPrice === 'number' && Number.isFinite(input.minUnitPrice) && input.minUnitPrice > 0
      ? round2(input.minUnitPrice)
      : undefined;
  const effectiveUnitPrice =
    typeof minUnitPrice === 'number' ? Math.max(discountedUnitPrice, minUnitPrice) : discountedUnitPrice;
  const roundedEffectiveUnitPrice = round2(effectiveUnitPrice);
  const perUnitDelta = round2(baseUnitPrice - roundedEffectiveUnitPrice);
  const totalDelta = round2(perUnitDelta * quantity);
  const appliedDiscountPct = baseUnitPrice > 0 ? round2((perUnitDelta / baseUnitPrice) * 100) / 100 : 0;
  const minPriceApplied = typeof minUnitPrice === 'number' && roundedEffectiveUnitPrice === minUnitPrice && requestedDiscountPct > 0;

  return {
    priceCompositionVersion: CAMPAIGN_PRICE_COMPOSITION_VERSION,
    quantity,
    rule: input.progressivePriceRule?.trim() || 'baseline',
    tierLabel: matchedTier?.label ?? 'baseline',
    baseUnitPrice,
    effectiveUnitPrice: roundedEffectiveUnitPrice,
    perUnitDelta,
    totalDelta,
    requestedDiscountPct,
    appliedDiscountPct,
    minPriceApplied,
    movementMarkup:
      perUnitDelta > 0
        ? {
            type: 'campaign_progressive_pricing',
            rule: input.progressivePriceRule?.trim() || 'baseline',
            tierLabel: matchedTier?.label ?? 'baseline',
            direction: 'discount',
            requestedDiscountPct,
            appliedDiscountPct,
            perUnitAmount: perUnitDelta,
            totalAmount: totalDelta,
            minPriceApplied,
          }
        : null,
  };
}
