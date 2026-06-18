import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

export type CampaignStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'closed' | 'rejected' | 'cancelled';

export interface CampaignRecord {
  campaignId: string;
  organizationId: string;
  name: string;
  description: string;
  budget: number;
  progressivePriceRule: string;
  startsAt?: string;
  endsAt?: string;
  status: CampaignStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignState {
  campaigns: Record<string, CampaignRecord>;
}

function readState() {
  return readStoreFile<CampaignState>('campaigns', { campaigns: {} });
}

function writeState(state: CampaignState) {
  writeStoreFile('campaigns', state);
}

export async function listCampaigns(filters?: { status?: CampaignStatus; organizationId?: string; createdBy?: string }) {
  return Object.values(readState().campaigns).filter((row) => {
    if (filters?.status && row.status !== filters.status) return false;
    if (filters?.organizationId && row.organizationId !== filters.organizationId) return false;
    if (filters?.createdBy && row.createdBy !== filters.createdBy) return false;
    return true;
  });
}

export function getCampaign(campaignId: string) {
  return readState().campaigns[campaignId] ?? null;
}

export async function createCampaign(input: {
  organizationId: string;
  name: string;
  description: string;
  budget: number;
  progressivePriceRule: string;
  startsAt?: string;
  endsAt?: string;
  createdBy: string;
}) {
  const state = readState();
  const now = new Date().toISOString();
  const campaign: CampaignRecord = {
    campaignId: `CMP-${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    description: input.description,
    budget: input.budget,
    progressivePriceRule: input.progressivePriceRule,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: 'draft',
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  state.campaigns[campaign.campaignId] = campaign;
  writeState(state);
  return campaign;
}

export async function updateCampaignStatus(input: { campaignId: string; from: CampaignStatus[]; to: CampaignStatus }) {
  const state = readState();
  const current = state.campaigns[input.campaignId];
  if (!current) return { kind: 'not_found' as const };
  if (!input.from.includes(current.status)) return { kind: 'invalid_transition' as const, campaign: current };

  const updated: CampaignRecord = {
    ...current,
    status: input.to,
    updatedAt: new Date().toISOString(),
  };
  state.campaigns[input.campaignId] = updated;
  writeState(state);
  return { kind: 'updated' as const, previous: current, campaign: updated };
}
