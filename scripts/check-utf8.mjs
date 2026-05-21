import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set(['node_modules', '.next', '.git', '.tmp-store', 'dist', 'build', 'coverage']);
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.yml',
  '.yaml',
  '.xml',
  '.txt',
  '.sql',
]);

function isTextFile(filePath) {
  const name = basename(filePath);
  if (name === '.env') return true;
  return TEXT_EXTENSIONS.has(extname(filePath).toLowerCase());
}

function collectFiles(dir, out) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) collectFiles(fullPath, out);
      continue;
    }
    if (entry.isFile() && isTextFile(fullPath)) out.push(fullPath);
  }
}

function isValidUtf8(buffer) {
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  return decoded.length >= 0;
}

const files = [];
collectFiles(ROOT, files);

const invalid = [];
for (const file of files) {
  try {
    const bytes = readFileSync(file);
    isValidUtf8(bytes);
  } catch (error) {
    invalid.push({ file, error: error instanceof Error ? error.message : String(error) });
  }
}

console.log(`UTF8 check scanned: ${files.length} files`);
if (invalid.length === 0) {
  console.log('UTF8 check: PASS');
  process.exit(0);
}

console.error(`UTF8 check: FAIL (${invalid.length} invalid files)`);
for (const row of invalid) {
  console.error(`- ${row.file}`);
}
process.exit(1);
