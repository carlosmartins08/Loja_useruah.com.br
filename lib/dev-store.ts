import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), '.tmp-store');

function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readStoreFile<T>(name: string, fallback: T): T {
  ensureDir();
  const file = join(DATA_DIR, `${name}.json`);
  if (!existsSync(file)) return fallback;
  try {
    const raw = readFileSync(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStoreFile<T>(name: string, value: T) {
  ensureDir();
  const file = join(DATA_DIR, `${name}.json`);
  writeFileSync(file, JSON.stringify(value), 'utf-8');
}
