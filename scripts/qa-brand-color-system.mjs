import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function hasDuplicate(values) {
  return new Set(values).size !== values.length;
}

function isHex(value) {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

function run() {
  const brand = readJson('data/brand-colors.json');
  const product = readJson('data/product-colors.json');
  const print = readJson('data/print-colors.json');
  const failures = [];
  const warnings = [];

  const logoFiles = [
    'public/brand/SVG/logo-wordmark-dark.svg',
    'public/brand/SVG/logo-wordmark-light.svg',
    'public/brand/SVG/logo-mark-dark.svg',
    'public/brand/SVG/logo-mark-light.svg',
  ];
  for (const file of logoFiles) {
    if (!fs.existsSync(path.join(root, file))) failures.push(`missing_logo_file:${file}`);
  }

  const brandSlugs = brand.colors.map((item) => item.slug);
  if (hasDuplicate(brandSlugs)) failures.push('brand_colors_duplicate_slug');
  for (const item of brand.colors) {
    if (!isHex(item.hex)) failures.push(`brand_color_invalid_hex:${item.slug}`);
    if (!item.cssVar || !String(item.cssVar).startsWith('--ur-color-')) failures.push(`brand_color_invalid_css_var:${item.slug}`);
    if (!Array.isArray(item.rgb) || item.rgb.length !== 3) failures.push(`brand_color_invalid_rgb:${item.slug}`);
  }

  const productSlugs = product.colors.map((item) => item.colorSlug);
  if (hasDuplicate(productSlugs)) failures.push('product_colors_duplicate_slug');
  for (const item of product.colors) {
    if (!isHex(item.displayHex)) failures.push(`product_color_invalid_display_hex:${item.colorSlug}`);
    if (!isHex(item.textColor)) failures.push(`product_color_invalid_text_hex:${item.colorSlug}`);
    if (!isHex(item.textColorSmall)) failures.push(`product_color_invalid_text_small_hex:${item.colorSlug}`);
    if (!item.supplierColorCode || !item.supplierColorCode.trim()) failures.push(`product_color_missing_supplier_code:${item.colorSlug}`);
    if (item.logoVariant !== 'dark' && item.logoVariant !== 'light') failures.push(`product_color_invalid_logo_variant:${item.colorSlug}`);
    if (!item.brandToken || !brandSlugs.includes(item.brandToken)) failures.push(`product_color_invalid_brand_token:${item.colorSlug}`);
    if (item.supplierValidated !== true && item.supplierValidated !== false) failures.push(`product_color_invalid_supplier_validated:${item.colorSlug}`);
    if (!Array.isArray(item.allowedPrints) || item.allowedPrints.length === 0) failures.push(`product_color_missing_allowed_prints:${item.colorSlug}`);
    if (!item.recommendedPrint || !item.allowedPrints.includes(item.recommendedPrint)) failures.push(`product_color_invalid_recommended_print:${item.colorSlug}`);
    if (!item.mockupFolder || item.mockupFolder !== item.colorSlug) warnings.push(`product_color_mockup_folder_mismatch:${item.colorSlug}`);
  }

  const printSlugs = print.colors.map((item) => item.slug);
  if (hasDuplicate(printSlugs)) failures.push('print_colors_duplicate_slug');
  for (const item of print.colors) {
    if (!isHex(item.hex)) failures.push(`print_color_invalid_hex:${item.slug}`);
    if (!item.cssVar || !String(item.cssVar).startsWith('--ur-print-')) failures.push(`print_color_invalid_css_var:${item.slug}`);
    if (!item.brandToken || !brandSlugs.includes(item.brandToken)) failures.push(`print_color_invalid_brand_token:${item.slug}`);
    if (!Array.isArray(item.rgb) || item.rgb.length !== 3) failures.push(`print_color_invalid_rgb:${item.slug}`);
  }

  for (const item of product.colors) {
    for (const printSlug of item.allowedPrints ?? []) {
      if (!printSlugs.includes(printSlug)) {
        failures.push(`product_color_unknown_allowed_print:${item.colorSlug}:${printSlug}`);
      }
    }
  }

  const mockupPathTemplate = product.mockupPathTemplate;
  if (!mockupPathTemplate || typeof mockupPathTemplate !== 'string') {
    failures.push('mockup_path_template_missing');
  } else {
    const hasTokens =
      mockupPathTemplate.includes('{productSlug}') &&
      mockupPathTemplate.includes('{colorSlug}') &&
      mockupPathTemplate.includes('{view}');
    if (!hasTokens) failures.push('mockup_path_template_missing_tokens');
  }

  const mockupRoot = path.join(root, 'public/assets/products/mockups');
  if (!fs.existsSync(mockupRoot)) {
    warnings.push('mockup_root_missing:public/assets/products/mockups');
  }

  if (failures.length > 0) {
    console.error(
      JSON.stringify(
        {
          status: 'FAIL',
          failures,
          warnings,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        summary: {
          brandColors: brand.colors.length,
          productColors: product.colors.length,
          printColors: print.colors.length,
        },
        warnings,
      },
      null,
      2
    )
  );
}

run();
