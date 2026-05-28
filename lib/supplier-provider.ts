export type SupplierIntegrationMode = 'manual' | 'dimona_api';

const DIMONA_MODE: SupplierIntegrationMode = 'dimona_api';

function parseJsonMap(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, raw]) => {
      if (typeof raw === 'string') {
        acc[key.trim()] = raw.trim();
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function parseCsvSet(value: string | undefined) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  );
}

export function getSupplierIntegrationMode(supplierId: string): SupplierIntegrationMode {
  const normalized = supplierId.trim();
  const map = parseJsonMap(process.env.SUPPLIER_PROVIDER_MAP_JSON);
  const mapped = map[normalized];
  if (mapped === DIMONA_MODE) return DIMONA_MODE;

  const dimonaIds = parseCsvSet(process.env.DIMONA_SUPPLIER_IDS);
  if (dimonaIds.has(normalized)) return DIMONA_MODE;

  return 'manual';
}

export function isDimonaConfigured() {
  return typeof process.env.DIMONA_API_KEY === 'string' && process.env.DIMONA_API_KEY.trim().length > 0;
}

