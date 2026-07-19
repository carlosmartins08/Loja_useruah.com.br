import { existsSync, readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

function envValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = '.env';
  if (!existsSync(envPath)) return undefined;
  const line = readFileSync(envPath, 'utf8').split(/\r?\n/).find((entry) => new RegExp(`^${name}\\s*=`).test(entry));
  return line?.replace(new RegExp(`^${name}\\s*=\\s*`), '').trim().replace(/^['"]|['"]$/g, '');
}

function parseMysqlUrl(raw) {
  if (!raw || !raw.startsWith('mysql://')) throw new Error('DATABASE_URL_mysql_required');
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

const db = await mysql.createConnection(parseMysqlUrl(envValue('DATABASE_URL')));
try {
  await db.beginTransaction();
  const [referralEvents] = await db.execute(
    'DELETE FROM referral_events WHERE referral_link_id IN (SELECT referral_link_id FROM referral_links WHERE owner_id LIKE ?)',
    ['qa-affiliate-authority-%'],
  );
  const [referralLinks] = await db.execute('DELETE FROM referral_links WHERE owner_id LIKE ?', ['qa-affiliate-authority-%']);
  const [campaignProducts] = await db.execute(
    'DELETE FROM campaign_products WHERE campaign_id IN (SELECT campaign_id FROM campaigns WHERE organization_id LIKE ?)',
    ['ORG-QA-CAMPAIGN-AUTHORITY-%'],
  );
  const [campaigns] = await db.execute('DELETE FROM campaigns WHERE organization_id LIKE ?', ['ORG-QA-CAMPAIGN-AUTHORITY-%']);
  await db.commit();
  console.log(
    JSON.stringify({
      status: 'PASS',
      deleted: {
        referralEvents: referralEvents.affectedRows,
        referralLinks: referralLinks.affectedRows,
        campaignProducts: campaignProducts.affectedRows,
        campaigns: campaigns.affectedRows,
      },
    }),
  );
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
