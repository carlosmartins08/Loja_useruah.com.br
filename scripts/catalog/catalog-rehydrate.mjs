import { assert, assertCatalogSeedIntegrity, postBootstrap, readPersistedCatalog } from '../lib/catalog-seed-helpers.mjs';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3216';

async function run() {
  const report = [];

  const bootstrap = await postBootstrap(baseUrl);
  assert(bootstrap.status === 200, `bootstrap expected 200, got ${bootstrap.status}`);
  assert(Array.isArray(bootstrap.data?.results), 'bootstrap response did not include results');
  report.push(`CAT-REHYDRATE-01 bootstrap executado com ${bootstrap.data.results.length} seeds`);

  const catalog = readPersistedCatalog();
  assertCatalogSeedIntegrity(catalog);
  report.push('CAT-REHYDRATE-02 store persistido alinhado com seeds canônicos');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        baseUrl,
        report,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        baseUrl,
        error: String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
