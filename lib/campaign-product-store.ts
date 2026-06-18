import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

export interface CampaignProductRecord {
  campaignProductId: string;
  campaignId: string;
  catalogItemId: string;
  linkedBy: string;
  createdAt: string;
}

interface CampaignProductState {
  links: Record<string, CampaignProductRecord>;
}

function readState() {
  return readStoreFile<CampaignProductState>('campaign-products', { links: {} });
}

function writeState(state: CampaignProductState) {
  writeStoreFile('campaign-products', state);
}

export function listCampaignProducts(campaignId: string) {
  return Object.values(readState().links)
    .filter((row) => row.campaignId === campaignId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function countCampaignProducts(campaignId: string) {
  return listCampaignProducts(campaignId).length;
}

export function getCampaignProductLink(campaignId: string, catalogItemId: string) {
  return listCampaignProducts(campaignId).find((row) => row.catalogItemId === catalogItemId) ?? null;
}

export function isCatalogItemLinkedToCampaign(campaignId: string, catalogItemId: string) {
  return Boolean(getCampaignProductLink(campaignId, catalogItemId));
}

export function listCampaignCatalogItemIds(campaignId: string) {
  return listCampaignProducts(campaignId).map((row) => row.catalogItemId);
}

export function linkCampaignProduct(input: { campaignId: string; catalogItemId: string; linkedBy: string }) {
  const existing = getCampaignProductLink(input.campaignId, input.catalogItemId);
  if (existing) {
    return { link: existing, reused: true as const };
  }

  const state = readState();
  const link: CampaignProductRecord = {
    campaignProductId: `CMPROD-${randomUUID()}`,
    campaignId: input.campaignId,
    catalogItemId: input.catalogItemId,
    linkedBy: input.linkedBy,
    createdAt: new Date().toISOString(),
  };
  state.links[link.campaignProductId] = link;
  writeState(state);
  return { link, reused: false as const };
}

export function unlinkCampaignProduct(input: { campaignId: string; catalogItemId: string }) {
  const state = readState();
  const existing = Object.values(state.links).find(
    (row) => row.campaignId === input.campaignId && row.catalogItemId === input.catalogItemId
  );
  if (!existing) {
    return { removed: false as const, link: null };
  }

  delete state.links[existing.campaignProductId];
  writeState(state);
  return { removed: true as const, link: existing };
}
