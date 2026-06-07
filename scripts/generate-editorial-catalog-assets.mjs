import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';

const root = process.cwd();
const mockupRoot = join(root, 'public', 'assets', 'products', 'mockups');
const outputRoot = join(root, 'public', 'assets', 'editorial', 'catalog');

const FAMILY_LABELS = {
  'camiseta-regular': 'Camiseta regular',
  'moletom-unissex': 'Moletom unissex',
  ecobag: 'Ecobag autoral',
  bone: 'Boné estruturado',
};

const COLOR_LABELS = {
  offwhite: 'Off white',
  preto: 'Preto Ruah',
  areia: 'Areia serena',
};

const VIEW_LABELS = {
  front: 'Frente',
  back: 'Costas',
  side: 'Lateral',
  'left-3q': 'Ângulo esquerdo',
  'right-3q': 'Ângulo direito',
  'detail-gola': 'Gola',
  'detail-manga': 'Acabamento',
  'detail-tecido': 'Tecido',
};

const PALETTES = {
  offwhite: {
    background: '#f8f3e8',
    surface: '#fffdf8',
    accent: '#c5a059',
    text: '#201d18',
    silhouette: '#d8d1c5',
  },
  areia: {
    background: '#efe3d0',
    surface: '#f9f3ea',
    accent: '#c5a059',
    text: '#2a251e',
    silhouette: '#d3c3ae',
  },
  preto: {
    background: '#17191c',
    surface: '#2a2d30',
    accent: '#c5a059',
    text: '#f3efe8',
    silhouette: '#73777d',
  },
  default: {
    background: '#f3efe8',
    surface: '#fffdf8',
    accent: '#c5a059',
    text: '#201d18',
    silhouette: '#d8d1c5',
  },
};

function listPngFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listPngFiles(fullPath));
      continue;
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === '.png') {
      files.push(fullPath);
    }
  }

  return files;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function parseMockupPath(filePath) {
  const relPath = relative(mockupRoot, filePath).replaceAll('\\', '/');
  const [familySlug = '', colorSlug = '', fileName = ''] = relPath.split('/');
  const stem = fileName.replace(/\.png$/i, '');
  const prefix = `mockup-${familySlug}-${colorSlug}-`;
  const viewSlug = stem.startsWith(prefix) ? stem.slice(prefix.length) : 'front';
  const [toneSlug = 'default'] = colorSlug.split('-');

  return {
    relPath,
    familySlug,
    colorSlug,
    fileName,
    viewSlug,
    toneSlug,
    familyLabel: FAMILY_LABELS[familySlug] ?? 'Produto editorial',
    colorLabel: COLOR_LABELS[toneSlug] ?? 'Paleta curada',
    viewLabel: VIEW_LABELS[viewSlug] ?? 'Visual',
    palette: PALETTES[toneSlug] ?? PALETTES.default,
  };
}

function silhouettePath(familySlug) {
  if (familySlug === 'camiseta-regular') {
    return '<path d="M87 42h66l24 22-18 31-17-10v112H98V85L81 95 63 64l24-22Z" fill="currentColor" />';
  }

  if (familySlug === 'moletom-unissex') {
    return '<path d="M84 42h72l28 26-17 35-18-11v104H91V92l-18 11-17-35 28-26Z" fill="currentColor" /><rect x="101" y="181" width="38" height="18" rx="8" fill="rgba(23,25,28,0.10)" />';
  }

  if (familySlug === 'ecobag') {
    return '<path d="M78 70h84l11 124H67L78 70Z" fill="currentColor" /><path d="M95 74c0-18 11-30 25-30s25 12 25 30" fill="none" stroke="rgba(23,25,28,0.24)" stroke-width="8" stroke-linecap="round" />';
  }

  if (familySlug === 'bone') {
    return '<path d="M70 120c0-31 23-54 53-54 28 0 49 18 56 44l-109 10Z" fill="currentColor" /><path d="M70 120c20 5 58 7 104-3 6-1 11 4 10 10-2 9-10 16-19 18-50 13-90 8-108-4-7-5-6-16 1-19 3-1 7-2 12-2Z" fill="rgba(23,25,28,0.18)" />';
  }

  return '<rect x="52" y="52" width="136" height="136" rx="30" fill="currentColor" />';
}

function buildSvg(meta) {
  const title = escapeXml(meta.familyLabel);
  const color = escapeXml(meta.colorLabel);
  const view = escapeXml(meta.viewLabel);
  const palette = meta.palette;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${title} em ${color}, vista ${view}.</desc>
  <defs>
    <radialGradient id="glow" cx="50%" cy="34%" r="62%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.26" />
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="wash" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.background}" />
      <stop offset="52%" stop-color="${palette.surface}" />
      <stop offset="100%" stop-color="${palette.background}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" rx="96" fill="url(#wash)" />
  <rect x="72" y="72" width="1056" height="1056" rx="80" fill="none" stroke="${palette.accent}" stroke-opacity="0.16" />
  <circle cx="600" cy="430" r="320" fill="url(#glow)" />
  <g transform="translate(0 18)">
    <g transform="translate(420 280) scale(1.5)" style="color:${palette.silhouette}">
      ${silhouettePath(meta.familySlug)}
    </g>
  </g>
  <g fill="${palette.text}">
    <text x="138" y="172" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="700" letter-spacing="9" text-transform="uppercase" opacity="0.54">${escapeXml(meta.familyLabel.toUpperCase())}</text>
    <text x="962" y="172" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="5" text-anchor="end" opacity="0.42">${view}</text>
    <text x="600" y="656" font-family="Georgia, 'Times New Roman', serif" font-size="84" font-style="italic" font-weight="700" text-anchor="middle">${title}</text>
    <text x="600" y="720" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="7" text-anchor="middle" opacity="0.4">${escapeXml(meta.colorLabel.toUpperCase())}</text>
    <text x="138" y="1084" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="6" opacity="0.36">${color}</text>
    <text x="1060" y="1084" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="6" text-anchor="end" opacity="0.36">UseRuah</text>
  </g>
</svg>
`;
}

const files = listPngFiles(mockupRoot);
let written = 0;

for (const file of files) {
  const meta = parseMockupPath(file);
  const outputPath = join(outputRoot, meta.familySlug, meta.colorSlug, meta.fileName.replace(/\.png$/i, '.svg'));
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, buildSvg(meta), 'utf8');
  written += 1;
}

console.log(JSON.stringify({ status: 'PASS', generated: written, outputRoot }, null, 2));
