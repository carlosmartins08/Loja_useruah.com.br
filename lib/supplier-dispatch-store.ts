import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

export type SupplierDispatchStatus = 'skipped' | 'sent' | 'failed';

export interface SupplierDispatchRecord {
  dispatchId: string;
  productionJobId: string;
  orderId: string;
  supplierId: string;
  provider: 'manual' | 'dimona_api';
  status: SupplierDispatchStatus;
  providerReference?: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupplierDispatchState {
  byProductionJobId: Record<string, SupplierDispatchRecord>;
}

function readState(): SupplierDispatchState {
  return readStoreFile<SupplierDispatchState>('supplier-dispatch', { byProductionJobId: {} });
}

function writeState(value: SupplierDispatchState) {
  writeStoreFile('supplier-dispatch', value);
}

export function getSupplierDispatchByProductionJobId(productionJobId: string) {
  const state = readState();
  return state.byProductionJobId[productionJobId] ?? null;
}

export function upsertSupplierDispatch(
  input: Omit<SupplierDispatchRecord, 'dispatchId' | 'createdAt' | 'updatedAt'> & {
    dispatchId?: string;
  }
) {
  const state = readState();
  const existing = state.byProductionJobId[input.productionJobId];
  const now = new Date().toISOString();

  const next: SupplierDispatchRecord = {
    dispatchId: input.dispatchId?.trim() || existing?.dispatchId || `SUPDISP-${randomUUID()}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...input,
  };

  state.byProductionJobId[input.productionJobId] = next;
  writeState(state);
  return next;
}

