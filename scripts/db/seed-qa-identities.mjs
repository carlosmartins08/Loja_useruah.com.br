import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import mysql from 'mysql2/promise';

const scrypt = promisify(scryptCallback);
const QA_IDENTITY_PASSWORD = String(process.env.QA_IDENTITY_PASSWORD ?? '');
const QA_IDENTITIES = [
  { email: 'qa-artist@useruah.local', userName: 'QA Artist', userRole: 'artist' },
  { email: 'qa-community-manager@useruah.local', userName: 'QA Community Manager', userRole: 'community_manager' },
  { email: 'qa-foreign-community-manager@useruah.local', userName: 'QA Foreign Community Manager', userRole: 'community_manager' },
  { email: 'qa-curator@useruah.local', userName: 'QA Curator', userRole: 'curator' },
  { email: 'qa-platform-admin@useruah.local', userName: 'QA Platform Admin', userRole: 'platform_admin' },
];

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
      if (error instanceof Error && error.message === 'QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL') throw error;
      if (inheritedDatabaseUrl === qaDatabaseUrl) throw new Error('QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL');
    }
  }

  return { database, url: qaDatabaseUrl };
}

async function passwordHash(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

function nowMysql() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

async function run() {
  const { database, url } = resolveQaDatabaseUrl();
  if (!QA_IDENTITY_PASSWORD) throw new Error('QA_IDENTITY_PASSWORD_REQUIRED');

  const connection = await mysql.createConnection(url);
  try {
    for (const identity of QA_IDENTITIES) {
      const hash = await passwordHash(QA_IDENTITY_PASSWORD);
      const timestamp = nowMysql();
      const userId = `usr:${identity.email}`;
      await connection.execute(
        `INSERT INTO users (user_id, email, password_hash, user_name, user_role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
         ON DUPLICATE KEY UPDATE
           user_id = VALUES(user_id), password_hash = VALUES(password_hash), user_name = VALUES(user_name),
           user_role = VALUES(user_role), status = 'active', updated_at = VALUES(updated_at)`,
        [userId, identity.email, hash, identity.userName, identity.userRole, timestamp, timestamp]
      );
    }

    console.log(
      JSON.stringify(
        {
          status: 'PASS',
          database,
          identities: QA_IDENTITIES.map(({ email, userName, userRole }) => ({ email, userId: `usr:${email}`, userName, userRole })),
        },
        null,
        2
      )
    );
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', error: String(error) }, null, 2));
  process.exitCode = 1;
});
