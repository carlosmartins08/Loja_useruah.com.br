import {
  assert,
  assertCatalogSeedIntegrity,
  assertPublicCatalogIntegrity,
  getPublicCatalog,
  postBootstrap,
  readPersistedCatalog,
} from './catalog-seed-helpers.mjs';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3217';

async function run() {
  const report = [];

  const bootstrap = await postBootstrap(baseUrl);
  assert(bootstrap.status === 200, `bootstrap expected 200, got ${bootstrap.status}`);
  report.push('P0-CAT-PERSIST-01 bootstrap de catálogo executado');

  const publicCatalog = await getPublicCatalog(baseUrl);
  assert(publicCatalog.status === 200, `public catalog expected 200, got ${publicCatalog.status}`);
  assertPublicCatalogIntegrity(publicCatalog.data?.items);
  report.push('P0-CAT-PERSIST-02 API pública sem nomes legados nem mídia contaminada');

  const persistedCatalog = readPersistedCatalog();
  assertCatalogSeedIntegrity(persistedCatalog);
  report.push('P0-CAT-PERSIST-03 store persistido sem picsum e alinhado aos seeds canônicos');

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
