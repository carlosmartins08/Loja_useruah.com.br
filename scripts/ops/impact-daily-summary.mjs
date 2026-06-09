#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

const impactState = readJson(path.join(root, '.tmp-store', 'impact-reviews.json'), { reviews: {} });
const integrationState = readJson(path.join(root, '.tmp-store', 'integration-logs.json'), { logs: [] });

const allReviews = Object.values(impactState.reviews ?? {});
const now = Date.now();
const pending = allReviews.filter((row) => row.status === 'pending_review');
const approved = allReviews.filter((row) => row.status === 'approved');
const rejected = allReviews.filter((row) => row.status === 'rejected');
const overdue = pending.filter((row) => new Date(row.dueAt).getTime() < now);
const highPriorityPending = pending.filter((row) => row.priority === 'high');

const notifications = (integrationState.logs ?? []).filter(
  (row) => row.provider === 'internal_ops' && String(row.action || '').startsWith('impact_review_notify.')
);

const recentReviews = allReviews
  .slice()
  .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  .slice(0, 10);
const recentNotifications = notifications
  .slice()
  .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  .slice(0, 10);

const dateIso = new Date().toISOString();
const report = `# Impact Review Daily Summary

Generated at: ${dateIso}

## KPI Snapshot
- Pending reviews: ${pending.length}
- Overdue pending (SLA 2h): ${overdue.length}
- High-priority pending: ${highPriorityPending.length}
- Approved reviews: ${approved.length}
- Rejected reviews: ${rejected.length}
- Internal notifications sent: ${notifications.length}

## Operational Risk
- Overall status: ${overdue.length > 0 ? 'AT_RISK' : pending.length > 0 ? 'ATTENTION' : 'STABLE'}
- Escalation trigger: ${overdue.length > 0 ? 'YES' : 'NO'}

## Recent Reviews (Top 10)
${recentReviews.length === 0 ? '- none' : recentReviews.map((row) => `- ${row.reviewId} | ${row.status} | item=${row.entityId} | priority=${row.priority} | dueAt=${row.dueAt}`).join('\n')}

## Recent Notifications (Top 10)
${recentNotifications.length === 0 ? '- none' : recentNotifications.map((row) => `- ${row.createdAt} | ${row.action} | id=${row.id}`).join('\n')}
`;

const outDir = path.join(root, 'docs', 'ops');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'IMPACT_REVIEW_DAILY_SUMMARY.md');
fs.writeFileSync(outPath, report, 'utf8');

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      output: 'docs/ops/IMPACT_REVIEW_DAILY_SUMMARY.md',
      kpi: {
        pending: pending.length,
        overdue: overdue.length,
        highPriorityPending: highPriorityPending.length,
        approved: approved.length,
        rejected: rejected.length,
        notifications: notifications.length,
      },
    },
    null,
    2
  )
);

