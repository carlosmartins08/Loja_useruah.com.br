import brandColors from '@/data/brand-colors.json';
import productColors from '@/data/product-colors.json';
import printColors from '@/data/print-colors.json';

export type LogoVariant = 'dark' | 'light';

type ProductColor = {
  colorName: string;
  colorSlug: string;
  displayHex: string;
  supplierColorName: string;
  supplierColorCode: string;
  textColor: string;
  logoVariant: LogoVariant;
  status: 'active' | 'planned';
};

export function listBrandColors() {
  return brandColors.colors;
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
  return printColors.colors;
}

export function resolveLogoVariantFromProductColor(colorSlug: string): LogoVariant {
  return getProductColorBySlug(colorSlug)?.logoVariant ?? 'dark';
}
