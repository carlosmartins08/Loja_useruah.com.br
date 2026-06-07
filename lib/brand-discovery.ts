import { BRAND_PRODUCT_SEEDS, type BrandProductSeed } from '@/lib/brand-assets';

export interface BrandDiscoveryResult {
  id: string;
  name: string;
  category: string;
  reason: string;
}

export interface BrandGuideRecommendation {
  productId: string;
  productName: string;
  technicalReason: string;
  layoutTip: string;
}

const SPACE_WEIGHTS: Record<string, string[]> = {
  residential: ['5', '1', '6'],
  office: ['1', '4', '2'],
  gallery: ['3', '4', '1'],
  hospitality: ['2', '3', '6'],
};

const MOOD_WEIGHTS: Record<string, string[]> = {
  cozy: ['5', '1', '3'],
  neutral: ['1', '6', '4'],
  technical: ['4', '2', '6'],
  dynamic: ['3', '2', '1'],
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getSeedTerms(seed: BrandProductSeed) {
  return [
    seed.name,
    seed.category,
    seed.catalogCategory,
    seed.segment,
    seed.shortReason,
    seed.stylingTip,
    seed.promptDescriptor,
    ...seed.tags,
    ...Object.keys(seed.colorImages),
  ]
    .map(normalizeText)
    .filter(Boolean);
}

function scoreSeedForQuery(seed: BrandProductSeed, query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const terms = getSeedTerms(seed);

  return tokens.reduce((score, token) => {
    const exactInName = normalizeText(seed.name).includes(token) ? 4 : 0;
    const exactInTag = seed.tags.some((tag) => normalizeText(tag).includes(token)) ? 3 : 0;
    const termHits = terms.reduce((hits, term) => hits + (term.includes(token) ? 1 : 0), 0);
    return score + exactInName + exactInTag + termHits;
  }, 0);
}

function sortByWeightedIds(seeds: BrandProductSeed[], ids: string[]) {
  const weighted = new Map<string, number>();
  ids.forEach((id, index) => {
    weighted.set(id, Math.max(0, 6 - index * 2));
  });

  return seeds
    .map((seed) => ({ seed, score: weighted.get(seed.id) ?? 0 }))
    .sort((left, right) => right.score - left.score);
}

export function searchBrandProducts(query: string, limit = 4): BrandDiscoveryResult[] {
  const scored = BRAND_PRODUCT_SEEDS
    .map((seed) => ({ seed, score: scoreSeedForQuery(seed, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  if (scored.length === 0) {
    return BRAND_PRODUCT_SEEDS.slice(0, limit).map((seed) => ({
      id: seed.id,
      name: seed.name,
      category: seed.category,
      reason: seed.shortReason,
    }));
  }

  return scored.map(({ seed }) => ({
    id: seed.id,
    name: seed.name,
    category: seed.category,
    reason: seed.shortReason,
  }));
}

export function recommendBrandProductFromSelections(data: Record<string, string>): BrandGuideRecommendation {
  const ranked = BRAND_PRODUCT_SEEDS.map((seed) => ({ seed, score: 0 }));

  for (const { seed } of ranked) {
    const spaceWeight = sortByWeightedIds([seed], SPACE_WEIGHTS[data.space] ?? []).at(0)?.score ?? 0;
    const moodWeight = sortByWeightedIds([seed], MOOD_WEIGHTS[data.mood] ?? []).at(0)?.score ?? 0;
    const categoryBias = data.space === 'hospitality' && seed.catalogCategory === 'Campanhas' ? 2 : 0;
    const accessoryBias = data.mood === 'dynamic' && seed.catalogCategory === 'Acessórios' ? 1 : 0;
    const total = spaceWeight + moodWeight + categoryBias + accessoryBias;
    const entry = ranked.find((item) => item.seed.id === seed.id);
    if (entry) entry.score = total;
  }

  const winner = ranked.sort((left, right) => right.score - left.score)[0]?.seed ?? BRAND_PRODUCT_SEEDS[0];

  return {
    productId: winner.id,
    productName: winner.name,
    technicalReason: winner.shortReason,
    layoutTip: winner.stylingTip,
  };
}
