import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

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

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToCampaign(row: MysqlRow): CampaignRecord {
  return {
    campaignId: String(row.campaign_id),
    organizationId: String(row.organization_id),
    name: String(row.name),
    description: String(row.description),
    budget: Number(row.budget),
    progressivePriceRule: String(row.progressive_price_rule),
    startsAt: mysqlDatetimeToIso(row.starts_at),
    endsAt: mysqlDatetimeToIso(row.ends_at),
    status: row.status as CampaignStatus,
    createdBy: String(row.created_by),
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function listCampaigns(filters?: { status?: CampaignStatus; organizationId?: string; createdBy?: string }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const conditions: string[] = [];
    const params: string[] = [];
    if (filters?.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters?.organizationId) {
      conditions.push('organization_id = ?');
      params.push(filters.organizationId);
    }
    if (filters?.createdBy) {
      conditions.push('created_by = ?');
      params.push(filters.createdBy);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM campaigns ${whereClause} ORDER BY created_at DESC`, params);
    return rows.map(rowToCampaign);
  }

  return Object.values(readState().campaigns).filter((row) => {
    if (filters?.status && row.status !== filters.status) return false;
    if (filters?.organizationId && row.organizationId !== filters.organizationId) return false;
    if (filters?.createdBy && row.createdBy !== filters.createdBy) return false;
    return true;
  });
}

export async function getCampaign(campaignId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>('SELECT * FROM campaigns WHERE campaign_id = ?', [campaignId]);
    return rows[0] ? rowToCampaign(rows[0]) : null;
  }

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

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO campaigns (
        campaign_id, organization_id, name, description, budget, progressive_price_rule,
        starts_at, ends_at, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaign.campaignId,
        campaign.organizationId,
        campaign.name,
        campaign.description,
        campaign.budget,
        campaign.progressivePriceRule,
        campaign.startsAt ? toMysqlDatetime(campaign.startsAt) : null,
        campaign.endsAt ? toMysqlDatetime(campaign.endsAt) : null,
        campaign.status,
        campaign.createdBy,
        toMysqlDatetime(campaign.createdAt),
        toMysqlDatetime(campaign.updatedAt),
      ]
    );
    return campaign;
  }

  const state = readState();
  state.campaigns[campaign.campaignId] = campaign;
  writeState(state);
  return campaign;
}

export async function updateCampaignStatus(input: { campaignId: string; from: CampaignStatus[]; to: CampaignStatus }) {
  const current = await getCampaign(input.campaignId);
  if (!current) return { kind: 'not_found' as const };
  if (!input.from.includes(current.status)) return { kind: 'invalid_transition' as const, campaign: current };

  const updated: CampaignRecord = {
    ...current,
    status: input.to,
    updatedAt: new Date().toISOString(),
  };
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>('UPDATE campaigns SET status = ?, updated_at = ? WHERE campaign_id = ?', [
      updated.status,
      toMysqlDatetime(updated.updatedAt),
      updated.campaignId,
    ]);
  } else {
    const state = readState();
    state.campaigns[input.campaignId] = updated;
    writeState(state);
  }
  return { kind: 'updated' as const, previous: current, campaign: updated };
}
