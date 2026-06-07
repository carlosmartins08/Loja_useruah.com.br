export type ProductArtworkKind = 'shirt' | 'sweatshirt' | 'tote' | 'cap' | 'generic';

interface ProductArtworkDescriptor {
  kind: ProductArtworkKind;
  familyLabel: string;
  toneLabel: string;
  angleLabel: string;
}

interface ProductArtworkParts {
  familySlug: string;
  colorSlug: string;
  fileName: string;
  viewSlug: string;
}

const PRODUCT_FAMILY_MAP: Record<string, { kind: ProductArtworkKind; label: string }> = {
  'camiseta-regular': { kind: 'shirt', label: 'Camiseta regular' },
  'moletom-unissex': { kind: 'sweatshirt', label: 'Moletom unissex' },
  ecobag: { kind: 'tote', label: 'Ecobag autoral' },
  bone: { kind: 'cap', label: 'Boné estruturado' },
};

const COLOR_LABEL_MAP: Record<string, string> = {
  offwhite: 'Off white',
  preto: 'Preto Ruah',
  areia: 'Areia serena',
};

const VIEW_LABEL_MAP: Record<string, string> = {
  front: 'Frente',
  back: 'Costas',
  side: 'Lateral',
  'left-3q': 'Ângulo esquerdo',
  'right-3q': 'Ângulo direito',
  'detail-gola': 'Gola',
  'detail-manga': 'Acabamento',
  'detail-tecido': 'Tecido',
};

export function isProductMockupPlaceholder(src: string) {
  return typeof src === 'string' && src.startsWith('/assets/products/mockups/');
}

function parseProductArtworkParts(src: string): ProductArtworkParts | null {
  if (!isProductMockupPlaceholder(src)) return null;

  if (!isProductMockupPlaceholder(src)) {
    return null;
  }

  const parts = src.split('/').filter(Boolean);
  const mockupIndex = parts.indexOf('mockups');
  const familySlug = parts[mockupIndex + 1] ?? '';
  const colorSlug = parts[mockupIndex + 2] ?? '';
  const fileName = parts[mockupIndex + 3] ?? '';
  const fileStem = fileName.replace(/\.png$/i, '');
  const prefix = `mockup-${familySlug}-${colorSlug}-`;
  const viewSlug = fileStem.startsWith(prefix) ? fileStem.slice(prefix.length) : '';

  return {
    familySlug,
    colorSlug,
    fileName,
    viewSlug,
  };
}

export function toEditorialCatalogAssetPath(src: string) {
  const parsed = parseProductArtworkParts(src);
  if (!parsed) return src;

  const fileName = parsed.fileName.replace(/\.png$/i, '.svg');
  return `/assets/editorial/catalog/${parsed.familySlug}/${parsed.colorSlug}/${fileName}`;
}

export function describeProductArtwork(src: string): ProductArtworkDescriptor {
  const parsed = parseProductArtworkParts(src);

  if (!parsed) {
    return {
      kind: 'generic',
      familyLabel: 'Produto editorial',
      toneLabel: 'Curadoria UseRuah',
      angleLabel: 'Visual',
    };
  }

  const productFamily = PRODUCT_FAMILY_MAP[parsed.familySlug] ?? {
    kind: 'generic' as const,
    label: 'Produto editorial',
  };
  const [toneSlug = ''] = parsed.colorSlug.split('-');

  return {
    kind: productFamily.kind,
    familyLabel: productFamily.label,
    toneLabel: COLOR_LABEL_MAP[toneSlug] ?? 'Paleta curada',
    angleLabel: VIEW_LABEL_MAP[parsed.viewSlug] ?? 'Visual',
  };
}
