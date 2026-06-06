import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function ensureQaEnvLoaded() {
  const file = join(process.cwd(), '.env');
  if (!existsSync(file)) return;
  const raw = readFileSync(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(process.env, key) && String(process.env[key] ?? '').trim() !== '') {
      continue;
    }
    process.env[key] = trimmed.slice(idx + 1).trim();
  }
}
