import brandColors from '@/data/brand-colors.json';
import productColors from '@/data/product-colors.json';
import printColors from '@/data/print-colors.json';

export type LogoVariant = 'dark' | 'light';
export type ProductColorStatus = 'active' | 'planned';

type BrandColor = {
  name: string;
  displayName: string;
  slug: string;
  cssVar: string;
  hex: string;
  rgb: number[];
  usage: string;
};

type PrintColor = {
  name: string;
  displayName: string;
  slug: string;
  cssVar: string;
  brandToken: string;
  hex: string;
  rgb: number[];
  usage: string;
};

type ProductColor = {
  colorName: string;
  displayName: string;
  colorSlug: string;
  brandToken: string;
  displayHex: string;
  rgb: number[];
  supplierColorName: string;
  supplierColorCode: string;
  supplierValidated: boolean;
  textColor: string;
  textColorSmall: string;
  logoVariant: LogoVariant;
  status: ProductColorStatus;
  phase: 'phase1' | 'phase2';
  allowedPrints: string[];
  recommendedPrint: string;
  mockupFolder: string;
};

export function listBrandColors() {
  return brandColors.colors as BrandColor[];
}

export function listProductColors() {
  return productColors.colors as ProductColor[];
}

export function getProductColorBySlug(colorSlug: string) {
  return listProductColors().find((color) => color.colorSlug === colorSlug) ?? null;
}

export function listActiveProductColorSlugs() {
  return listProductColors()
    .filter((color) => color.status === 'active')
    .map((color) => color.colorSlug);
}

export function listPrintColors() {
  return printColors.colors as PrintColor[];
}

export function resolveLogoVariantFromProductColor(colorSlug: string): LogoVariant {
  return getProductColorBySlug(colorSlug)?.logoVariant ?? 'dark';
}

export function getAllowedPrintsForProductColor(colorSlug: string) {
  return getProductColorBySlug(colorSlug)?.allowedPrints ?? [];
}

export function getRecommendedPrintForProductColor(colorSlug: string) {
  return getProductColorBySlug(colorSlug)?.recommendedPrint ?? null;
}

export function canUsePrintForProductColor(colorSlug: string, printSlug: string) {
  return getAllowedPrintsForProductColor(colorSlug).includes(printSlug);
}

export function buildMockupPath(productSlug: string, colorSlug: string, view: string) {
  const template = (productColors as { mockupPathTemplate?: string }).mockupPathTemplate;
  const safeTemplate = template ?? '/assets/editorial/catalog/{productSlug}/{colorSlug}/mockup-{productSlug}-{colorSlug}-{view}.svg';
  return safeTemplate
    .replaceAll('{productSlug}', productSlug)
    .replaceAll('{colorSlug}', colorSlug)
    .replaceAll('{view}', view);
}
