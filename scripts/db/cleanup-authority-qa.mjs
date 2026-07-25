import mysql from 'mysql2/promise';

function resolveQaDatabaseUrl() {
  const qaDatabaseUrl = String(process.env.QA_DATABASE_URL ?? '').trim();
  if (!qaDatabaseUrl) throw new Error('QA_DATABASE_URL_REQUIRED');

  let parsed;
  try {
    parsed = new URL(qaDatabaseUrl);
  } catch {
    throw new Error('QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  if (parsed.protocol !== 'mysql:' && parsed.protocol !== 'mysql2:') {
    throw new Error('QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!database || !/(qa|test|disposable|ephemeral)/i.test(database)) {
    throw new Error('QA_DATABASE_URL_MUST_TARGET_QA_DATABASE');
  }

  const inheritedDatabaseUrl = String(process.env.DATABASE_URL ?? '').trim();
  if (inheritedDatabaseUrl) {
    try {
      if (new URL(inheritedDatabaseUrl).toString() === parsed.toString()) {
        throw new Error('QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL') {
        throw error;
      }
      if (inheritedDatabaseUrl === qaDatabaseUrl) {
        throw new Error('QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL');
      }
    }
  }

  return { qaDatabaseUrl, parsed };
}

function parseMysqlUrl(parsed) {
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

const { qaDatabaseUrl, parsed: qaDatabase } = resolveQaDatabaseUrl();
process.env.DATABASE_URL = qaDatabaseUrl;
const db = await mysql.createConnection(parseMysqlUrl(qaDatabase));
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
