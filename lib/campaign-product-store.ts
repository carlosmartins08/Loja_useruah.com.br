import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

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

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToLink(row: MysqlRow): CampaignProductRecord {
  return {
    campaignProductId: String(row.campaign_product_id),
    campaignId: String(row.campaign_id),
    catalogItemId: String(row.catalog_item_id),
    linkedBy: String(row.linked_by),
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
  };
}

export async function listCampaignProducts(campaignId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      'SELECT * FROM campaign_products WHERE campaign_id = ? ORDER BY created_at ASC',
      [campaignId]
    );
    return rows.map(rowToLink);
  }

  return Object.values(readState().links)
    .filter((row) => row.campaignId === campaignId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function countCampaignProducts(campaignId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      'SELECT COUNT(*) AS count FROM campaign_products WHERE campaign_id = ?',
      [campaignId]
    );
    return Number(rows[0]?.count ?? 0);
  }

  return (await listCampaignProducts(campaignId)).length;
}

export async function getCampaignProductLink(campaignId: string, catalogItemId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      'SELECT * FROM campaign_products WHERE campaign_id = ? AND catalog_item_id = ? LIMIT 1',
      [campaignId, catalogItemId]
    );
    return rows[0] ? rowToLink(rows[0]) : null;
  }

  return (await listCampaignProducts(campaignId)).find((row) => row.catalogItemId === catalogItemId) ?? null;
}

export async function isCatalogItemLinkedToCampaign(campaignId: string, catalogItemId: string) {
  return Boolean(await getCampaignProductLink(campaignId, catalogItemId));
}

export async function listCampaignCatalogItemIds(campaignId: string) {
  return (await listCampaignProducts(campaignId)).map((row) => row.catalogItemId);
}

export async function linkCampaignProduct(input: { campaignId: string; catalogItemId: string; linkedBy: string }) {
  const existing = await getCampaignProductLink(input.campaignId, input.catalogItemId);
  if (existing) {
    return { link: existing, reused: true as const };
  }

  const link: CampaignProductRecord = {
    campaignProductId: `CMPROD-${randomUUID()}`,
    campaignId: input.campaignId,
    catalogItemId: input.catalogItemId,
    linkedBy: input.linkedBy,
    createdAt: new Date().toISOString(),
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO campaign_products (
        campaign_product_id, campaign_id, catalog_item_id, linked_by, created_at
      ) VALUES (?, ?, ?, ?, ?)`,
      [link.campaignProductId, link.campaignId, link.catalogItemId, link.linkedBy, toMysqlDatetime(link.createdAt)]
    );
    return { link, reused: false as const };
  }

  const state = readState();
  state.links[link.campaignProductId] = link;
  writeState(state);
  return { link, reused: false as const };
}

export async function unlinkCampaignProduct(input: { campaignId: string; catalogItemId: string }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const existing = await getCampaignProductLink(input.campaignId, input.catalogItemId);
    if (!existing) return { removed: false as const, link: null };
    await mysql.execute<MysqlResult>('DELETE FROM campaign_products WHERE campaign_product_id = ?', [existing.campaignProductId]);
    return { removed: true as const, link: existing };
  }

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
