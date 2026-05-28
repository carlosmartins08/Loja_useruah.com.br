import fs from 'node:fs';
import path from 'node:path';

interface ThresholdConfig {
  window: 'weekly';
  defaultMaxCount: number;
  codes: Record<string, number>;
}

export function readPayoutFailureThresholds(): ThresholdConfig {
  const file = path.join(process.cwd(), 'config', 'payout-failure-thresholds.json');
  if (!fs.existsSync(file)) {
    return { window: 'weekly', defaultMaxCount: 5, codes: {} };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<ThresholdConfig>;
    return {
      window: 'weekly',
      defaultMaxCount: Number(raw.defaultMaxCount ?? 5),
      codes: raw.codes ?? {},
    };
  } catch {
    return { window: 'weekly', defaultMaxCount: 5, codes: {} };
  }
}
