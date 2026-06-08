import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const QA_CATALOG_HEADERS = {
  'Content-Type': 'application/json',
  'x-actor-id': 'qa-curator',
  'x-actor-role': 'curator',
};

export const EXPECTED_SEEDS = [
  { id: '1', name: 'Camiseta Oração', category: 'Autoral', segment: 'Customizada', tag: 'Oração' },
  { id: '2', name: 'Moletom Presença', category: 'Campanhas', segment: 'Customizada', tag: 'Presença' },
  { id: '3', name: 'Ecobag Reino', category: 'Acessórios', segment: 'Customizada', tag: 'Reino' },
  { id: '4', name: 'Boné Presença', category: 'Acessórios', segment: 'Customizada', tag: 'Presença' },
  { id: '5', name: 'Camiseta Serena', category: 'Autoral', segment: 'Base', tag: 'Serena' },
  { id: '6', name: 'Ecobag Presença', category: 'Acessórios', segment: 'Base', tag: 'Presença' },
];

const STORE_PATH = join(process.cwd(), '.tmp-store', 'catalog-items.json');

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function postBootstrap(baseUrl) {
  const response = await fetch(`${baseUrl}/api/catalog-items/bootstrap`, {
    method: 'POST',
    headers: QA_CATALOG_HEADERS,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data };
}

export async function getPublicCatalog(baseUrl) {
  const response = await fetch(`${baseUrl}/api/catalog-items`);
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data };
}

export async function resolveSeededCatalogVariant(baseUrl, catalogItemId = '1') {
  const catalog = await getPublicCatalog(baseUrl);
  assert(catalog.status === 200, `catalog expected 200, got ${catalog.status}`);
  const seededItem = Array.isArray(catalog.data?.items)
    ? catalog.data.items.find((item) => item?.catalogItemId === catalogItemId)
    : null;
  assert(seededItem, `seeded catalog item missing: ${catalogItemId}`);
  const seededVariant = Array.isArray(seededItem?.variants) ? seededItem.variants[0] : null;
  assert(seededVariant?.variantId, `seeded variant missing for catalog item ${catalogItemId}`);
  assert(typeof seededVariant?.price === 'number', `seeded variant price missing for catalog item ${catalogItemId}`);
  return { item: seededItem, variant: seededVariant };
}

export function readPersistedCatalog() {
  assert(existsSync(STORE_PATH), `persisted catalog not found at ${STORE_PATH}`);
  return JSON.parse(readFileSync(STORE_PATH, 'utf-8'));
}

function collectMediaSources(record) {
  return [
    record.image,
    ...Object.values(record.colorImages ?? {}),
    ...(record.detailImages ?? []).map((item) => item?.src),
    ...(record.modelMockups ?? []).map((item) => item?.src),
    ...(record.variants ?? []).map((item) => item?.image),
  ].filter(Boolean);
}

function isAssetPath(value) {
  return (
    typeof value === 'string' &&
    value.startsWith('/assets/') &&
    !value.includes('picsum.photos') &&
    !value.includes('/assets/products/mockups/')
  );
}

function assetExists(value) {
  return typeof value === 'string' && existsSync(join(process.cwd(), 'public', value.slice(1)));
}

export function assertCatalogSeedIntegrity(catalog) {
  for (const expected of EXPECTED_SEEDS) {
    const record = catalog[expected.id];
    assert(record, `missing persisted catalog seed ${expected.id}`);
    assert(record.name === expected.name, `seed ${expected.id} has unexpected name: ${record.name}`);
    assert(record.category === expected.category, `seed ${expected.id} has unexpected category: ${record.category}`);
    assert(record.segment === expected.segment, `seed ${expected.id} has unexpected segment: ${record.segment}`);
    assert(Array.isArray(record.tags) && record.tags.includes(expected.tag), `seed ${expected.id} is missing tag ${expected.tag}`);
    assert(Array.isArray(record.detailImages) && record.detailImages.length > 0, `seed ${expected.id} has no detail images`);
    assert(Array.isArray(record.modelMockups) && record.modelMockups.length > 0, `seed ${expected.id} has no model mockups`);
    assert(Array.isArray(record.variants) && record.variants.length > 0, `seed ${expected.id} has no variants`);

    for (const source of collectMediaSources(record)) {
      assert(isAssetPath(source), `seed ${expected.id} has contaminated media source: ${source}`);
      assert(assetExists(source), `seed ${expected.id} references missing asset: ${source}`);
    }
  }
}

export function assertPublicCatalogIntegrity(items) {
  assert(Array.isArray(items), 'public catalog response does not contain an items array');
  for (const expected of EXPECTED_SEEDS) {
    const item = items.find((entry) => entry.catalogItemId === expected.id);
    assert(item, `public catalog is missing seed ${expected.id}`);
    assert(item.name === expected.name, `public catalog seed ${expected.id} has unexpected name: ${item.name}`);
    assert(item.category === expected.category, `public catalog seed ${expected.id} has unexpected category: ${item.category}`);
    assert(item.segment === expected.segment, `public catalog seed ${expected.id} has unexpected segment: ${item.segment}`);
    assert(Array.isArray(item.tags) && item.tags.includes(expected.tag), `public catalog seed ${expected.id} is missing tag ${expected.tag}`);
    assert(isAssetPath(item.image), `public catalog seed ${expected.id} has contaminated image: ${item.image}`);
    assert(assetExists(item.image), `public catalog seed ${expected.id} references missing image: ${item.image}`);
    for (const source of Object.values(item.colorImages ?? {})) {
      assert(isAssetPath(source), `public catalog seed ${expected.id} has contaminated color image: ${source}`);
      assert(assetExists(source), `public catalog seed ${expected.id} references missing color image: ${source}`);
    }
  }
}
