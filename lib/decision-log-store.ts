import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

export interface DecisionLogRecord {
  id: string;
  elevation_id: string;
  decision: 'approved' | 'rejected';
  decided_by: string;
  decided_role: string;
  rationale: string;
  created_at: string;
}

function readState() {
  return readStoreFile<DecisionLogRecord[]>('decision-logs', []);
}

function writeState(value: DecisionLogRecord[]) {
  writeStoreFile('decision-logs', value);
}

export function appendDecisionLog(input: Omit<DecisionLogRecord, 'id' | 'created_at'>) {
  const next: DecisionLogRecord = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
  };
  const state = readState();
  state.push(next);
  writeState(state);
  return next;
}

