import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const violations = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (/\.(ts|tsx|js|mjs|json|md)$/.test(entry.name)) files.push(fullPath);
  }

  return files;
}

function rel(filePath) {
  return path.relative(root, filePath).replaceAll('\\', '/');
}

const packageJson = JSON.parse(readText('package.json'));
if (packageJson.dependencies?.['@google/genai'] || packageJson.devDependencies?.['@google/genai']) {
  violations.push('package.json: @google/genai não deve existir enquanto IA estiver fora do produto.');
}

const forbiddenContentRules = [
  {
    pattern: /NEXT_PUBLIC_GEMINI_API_KEY/g,
    message: 'referência a chave pública de IA no produto',
  },
  {
    pattern: /data-ai-trigger/g,
    message: 'gatilho legado de IA',
  },
  {
    pattern: /\bEstilo AI\b/g,
    message: 'rótulo legado de IA no produto',
  },
  {
    pattern: /\bRuah Lab AI\b/g,
    message: 'bloco legado de IA na experiência',
  },
  {
    pattern: /@google\/genai/g,
    message: 'SDK Gemini reintroduzido no código do produto',
  },
];

const mockupAllowlist = new Set([
  'lib/brand-assets.ts',
  'lib/product-artwork.ts',
  'scripts/generate-editorial-catalog-assets.mjs',
]);

for (const base of ['app', 'components', 'lib']) {
  for (const file of walk(path.join(root, base))) {
    const relativePath = rel(file);
    const content = fs.readFileSync(file, 'utf8');

    for (const rule of forbiddenContentRules) {
      if (rule.pattern.test(content)) {
        violations.push(`${relativePath}: ${rule.message}`);
      }
      rule.pattern.lastIndex = 0;
    }

    if (content.includes('/assets/products/mockups/') && !mockupAllowlist.has(relativePath)) {
      violations.push(`${relativePath}: caminho de mockup placeholder fora da allowlist.`);
    }
  }
}

if (violations.length > 0) {
  console.error('Falha no QA de guardrails de produto:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('QA de guardrails de produto: OK');
