const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3200';

const headers = {
  'Content-Type': 'application/json',
  'x-actor-id': 'qa-curator',
  'x-actor-role': 'curator',
};

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const report = [];

  const seed = await post('/api/catalog-items/bootstrap');
  assert(seed.status === 200, `bootstrap expected 200, got ${seed.status}`);
  report.push('P0-CAT-01 bootstrap catalogo publicado');

  const publishFromPublished = await post('/api/catalog-items/1/publish', { reason: 'qa_redundant_publish' });
  assert(publishFromPublished.status === 200, `publish already published expected 200, got ${publishFromPublished.status}`);
  report.push('P0-CAT-02 publish idempotente em item publicado');

  const unpublish = await post('/api/catalog-items/1/unpublish', { reason: 'qa_unpublish' });
  assert(unpublish.status === 200, `unpublish expected 200, got ${unpublish.status}`);
  report.push('P0-CAT-03 unpublish published -> archived');

  const reopen = await post('/api/catalog-items/1/reopen', { reason: 'qa_reopen' });
  assert(reopen.status === 200, `reopen expected 200, got ${reopen.status}`);
  report.push('P0-CAT-04 reopen archived -> draft');

  const publishFromDraft = await post('/api/catalog-items/1/publish', { reason: 'qa_invalid_publish_from_draft' });
  assert(publishFromDraft.status === 409, `publish from draft expected 409, got ${publishFromDraft.status}`);
  report.push('P0-CAT-05 bloqueio draft -> published sem ready');

  const ready = await post('/api/catalog-items/1/ready', { reason: 'qa_ready' });
  assert(ready.status === 200, `ready expected 200, got ${ready.status}`);
  report.push('P0-CAT-06 ready draft -> ready');

  const publish = await post('/api/catalog-items/1/publish', { reason: 'qa_publish' });
  assert(publish.status === 200, `publish from ready expected 200, got ${publish.status}`);
  report.push('P0-CAT-07 publish ready -> published');

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
