import fs from 'node:fs';
import path from 'node:path';

interface OpsAlertSlaConfig {
  newHours: number;
  inProgressHours: number;
}

export function readOpsAlertSla(): OpsAlertSlaConfig {
  const file = path.join(process.cwd(), 'config', 'ops-alert-sla.json');
  if (!fs.existsSync(file)) {
    return { newHours: 2, inProgressHours: 8 };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<OpsAlertSlaConfig>;
    return {
      newHours: Number(raw.newHours ?? 2),
      inProgressHours: Number(raw.inProgressHours ?? 8),
    };
  } catch {
    return { newHours: 2, inProgressHours: 8 };
  }
}

export function isOpsAlertOverdue(input: {
  createdAt: string;
  workflowStatus: 'new' | 'in_progress' | 'resolved';
  sla: OpsAlertSlaConfig;
}) {
  if (input.workflowStatus === 'resolved') return false;
  const ageMs = Date.now() - new Date(input.createdAt).getTime();
  const limitHours = input.workflowStatus === 'new' ? input.sla.newHours : input.sla.inProgressHours;
  return ageMs > limitHours * 60 * 60 * 1000;
}
