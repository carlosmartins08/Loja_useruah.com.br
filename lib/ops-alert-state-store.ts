import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

export type OpsAlertWorkflowStatus = 'new' | 'in_progress' | 'resolved';

export interface OpsAlertState {
  alertId: string;
  workflowStatus: OpsAlertWorkflowStatus;
  owner: string;
  note?: string;
  updatedAt: string;
  updatedBy: string;
}

interface OpsAlertStateData {
  states: Record<string, OpsAlertState>;
}

function readState() {
  return readStoreFile<OpsAlertStateData>('ops-alert-states', { states: {} });
}

function writeState(value: OpsAlertStateData) {
  writeStoreFile('ops-alert-states', value);
}

export function getOpsAlertState(alertId: string) {
  return readState().states[alertId] ?? null;
}

export function listOpsAlertStates() {
  return readState().states;
}

export function upsertOpsAlertState(input: {
  alertId: string;
  workflowStatus: OpsAlertWorkflowStatus;
  owner: string;
  note?: string;
  updatedBy: string;
}) {
  const state = readState();
  const row: OpsAlertState = {
    alertId: input.alertId,
    workflowStatus: input.workflowStatus,
    owner: input.owner.trim(),
    note: input.note?.trim() || undefined,
    updatedAt: new Date().toISOString(),
    updatedBy: input.updatedBy,
  };
  state.states[input.alertId] = row;
  writeState(state);
  return row;
}
