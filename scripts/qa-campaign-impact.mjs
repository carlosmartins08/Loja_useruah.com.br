const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3210';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(pathname, body, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data };
}

async function get(pathname, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { headers });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data };
}

async function run() {
  const report = [];
  const communityHeaders = { 'x-actor-id': 'qa-community', 'x-actor-role': 'community_manager' };
  const adminHeaders = { 'x-actor-id': 'qa-admin', 'x-actor-role': 'platform_admin' };

  const create = await post(
    '/api/campaigns',
    {
      organizationId: 'ORG-QA-COMMUNITY',
      name: `Campanha QA ${Date.now()}`,
      description: 'Teste de impacto e bloqueio operacional',
      budget: 2500,
      progressivePriceRule: '2-5=5%;6-10=10%',
    },
    communityHeaders
  );
  assert(create.status === 201, `campaign create expected 201, got ${create.status}`);
  const campaignId = create.data?.campaign?.campaignId;
  assert(typeof campaignId === 'string', 'campaignId missing');
  report.push('QA-CAMPAIGN-01 create draft + impact review generated');

  const submit = await post(`/api/campaigns/${campaignId}/submit`, {}, communityHeaders);
  assert(submit.status === 200, `campaign submit expected 200, got ${submit.status}`);
  report.push('QA-CAMPAIGN-02 draft/rejected -> pending_review');

  const blockedApprove = await post(`/api/campaigns/${campaignId}/approve`, {}, adminHeaders);
  assert(blockedApprove.status === 409, `campaign approve while impact pending expected 409, got ${blockedApprove.status}`);
  assert(blockedApprove.data?.detail === 'impact_review_pending', `expected impact_review_pending, got ${String(blockedApprove.data?.detail)}`);
  report.push('QA-CAMPAIGN-03 activation blocked while impact review pending');

  const queue = await get('/api/admin/impact-reviews?status=pending_review', adminHeaders);
  assert(queue.status === 200, `impact queue expected 200, got ${queue.status}`);
  const rows = Array.isArray(queue.data?.reviews) ? queue.data.reviews : [];
  const campaignReview = rows.find((row) => row.entityType === 'Campaign' && row.entityId === campaignId);
  assert(campaignReview?.reviewId, 'campaign impact review not found in admin queue');
  report.push('QA-CAMPAIGN-04 campaign impact review visible in admin queue');

  const approveReview = await post(`/api/admin/impact-reviews/${campaignReview.reviewId}/approve`, { reason: 'qa unblock campaign activation' }, adminHeaders);
  assert(approveReview.status === 200, `impact review approve expected 200, got ${approveReview.status}`);
  report.push('QA-CAMPAIGN-05 impact review approved by platform_admin');

  const approveCampaign = await post(`/api/campaigns/${campaignId}/approve`, {}, adminHeaders);
  assert(approveCampaign.status === 200, `campaign approve after impact review expected 200, got ${approveCampaign.status}`);
  assert(approveCampaign.data?.campaign?.status === 'active', `campaign status expected active, got ${String(approveCampaign.data?.campaign?.status)}`);
  report.push('QA-CAMPAIGN-06 pending_review -> active after review approval');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report, campaignId }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
