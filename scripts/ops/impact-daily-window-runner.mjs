#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const schedulePath = path.join(root, 'config', 'ops-impact-schedule.json');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function normalizeHm(value) {
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isInteger(h) || !Number.isInteger(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${pad2(h)}:${pad2(min)}`;
}

if (!fs.existsSync(schedulePath)) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'schedule_file_not_found', schedulePath }, null, 2));
  process.exit(1);
}

const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
const fallbackRunTimes = Array.isArray(schedule.runTimes) ? schedule.runTimes.map(normalizeHm).filter(Boolean) : [];
const ownerSelected = (process.env.OPS_IMPACT_OWNER || schedule.owner || '').trim();
const ownerWindows = schedule.ownerRunTimes && typeof schedule.ownerRunTimes === 'object' ? schedule.ownerRunTimes : {};
const ownerRunTimes = Array.isArray(ownerWindows[ownerSelected]) ? ownerWindows[ownerSelected].map(normalizeHm).filter(Boolean) : [];
const runTimes = ownerRunTimes.length > 0 ? ownerRunTimes : fallbackRunTimes;
if (runTimes.length === 0) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'invalid_run_times', schedulePath }, null, 2));
  process.exit(1);
}

const forcedNow = normalizeHm(process.env.OPS_IMPACT_NOW ?? '');
const now = forcedNow ?? `${pad2(new Date().getHours())}:${pad2(new Date().getMinutes())}`;
const shouldRun = runTimes.includes(now) || process.env.OPS_IMPACT_FORCE === 'true';

if (!shouldRun) {
  console.log(
    JSON.stringify(
      {
        status: 'SKIP',
        reason: 'outside_configured_window',
        ownerSelected,
        now,
        configuredRunTimes: runTimes,
      },
      null,
      2
    )
  );
  process.exit(0);
}

execSync('node scripts/ops/impact-daily-summary.mjs', { stdio: 'inherit' });
