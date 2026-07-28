import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3337';
const qaIdentityPassword = String(process.env.QA_IDENTITY_PASSWORD ?? '');
const QA_USERS = {
  community: { email: 'qa-community-manager@useruah.local', expectedRole: 'community_manager' },
  curator: { email: 'qa-curator@useruah.local', expectedRole: 'curator' },
  admin: { email: 'qa-platform-admin@useruah.local', expectedRole: 'platform_admin' },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function loginQaUser(user) {
  assert(qaIdentityPassword, 'QA_IDENTITY_PASSWORD_REQUIRED');
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: qaIdentityPassword }),
  });
  const data = await response.json().catch(() => null);
  assert(response.status === 200, `${user.expectedRole} login expected 200, got ${response.status}`);
  const match = (response.headers.get('set-cookie') ?? '').match(/ruah_session=([^;]+)/);
  assert(match?.[1], `${user.expectedRole} ruah_session cookie missing after login`);
  assert(data?.session?.activeRole === user.expectedRole, `${user.expectedRole} activeRole mismatch`);
  return { cookie: `ruah_session=${match[1]}` };
}

async function run() {
  const report = [];
  const communitySession = await loginQaUser(QA_USERS.community);
  const curatorSession = await loginQaUser(QA_USERS.curator);
  const adminSession = await loginQaUser(QA_USERS.admin);
  const ownerHeaders = { cookie: communitySession.cookie };
  const foreignHeaders = { 'x-actor-id': 'qa-community-detail-foreign', 'x-actor-role': 'community_manager' };
  const curatorHeaders = { cookie: curatorSession.cookie };
  const adminHeaders = { cookie: adminSession.cookie };

  const seed = await post('/api/catalog-items/bootstrap', {}, curatorHeaders);
  assert(seed.status === 200 || seed.status === 201, `catalog bootstrap expected 200|201, got ${seed.status}`);
  const seeded = await resolveSeededCatalogVariant(baseUrl);
  report.push(`QA-CAMPAIGN-DETAIL-00 catalog item resolved (${seeded.item.catalogItemId})`);

  const create = await post(
    '/api/campaigns',
    {
      organizationId: 'ORG-QA-CAMPAIGN-DETAIL',
      name: `Campanha detalhe ${Date.now()}`,
      description: 'Campanha usada para validar detalhe operacional e ownership.',
      budget: 3200,
      progressivePriceRule: 'baseline',
    },
    ownerHeaders
  );
  assert(create.status === 201, `campaign create expected 201, got ${create.status}`);
  const campaignId = create.data?.campaign?.campaignId;
  assert(typeof campaignId === 'string', 'campaignId missing');

  const linkProduct = await post(`/api/campaigns/${campaignId}/products`, { catalogItemId: seeded.item.catalogItemId }, ownerHeaders);
  assert(linkProduct.status === 201 || linkProduct.status === 200, `campaign product link expected 200|201, got ${linkProduct.status}`);
  report.push('QA-CAMPAIGN-DETAIL-01 owner linked published catalog item');

  const submit = await post(`/api/campaigns/${campaignId}/submit`, {}, ownerHeaders);
  assert(submit.status === 200, `campaign submit expected 200, got ${submit.status}`);

  const queue = await get('/api/admin/impact-reviews?status=pending_review&entityType=Campaign', adminHeaders);
  assert(queue.status === 200, `impact queue expected 200, got ${queue.status}`);
  const pendingRows = Array.isArray(queue.data?.reviews) ? queue.data.reviews : [];
  const review = pendingRows.find((row) => row.entityId === campaignId);
  assert(review?.reviewId, 'campaign impact review not found');

  const approveReview = await post(
    `/api/admin/impact-reviews/${review.reviewId}/approve`,
    { reason: 'qa campaign detail approval' },
    adminHeaders
  );
  assert(approveReview.status === 200, `impact review approve expected 200, got ${approveReview.status}`);
  report.push('QA-CAMPAIGN-DETAIL-02 campaign has submission and approved governance history');

  const ownerDetail = await get(`/api/campaigns/${campaignId}`, ownerHeaders);
  assert(ownerDetail.status === 200, `owner detail expected 200, got ${ownerDetail.status}`);
  assert(ownerDetail.data?.campaign?.campaignId === campaignId, 'owner detail returned wrong campaign');
  assert(Array.isArray(ownerDetail.data?.linkedProducts) && ownerDetail.data.linkedProducts.length > 0, 'linkedProducts should not be empty');
  assert(Array.isArray(ownerDetail.data?.governanceHistory) && ownerDetail.data.governanceHistory[0]?.status === 'approved', 'latest governance should be approved');
  assert(Array.isArray(ownerDetail.data?.timeline), 'timeline missing');
  const timelineTypes = new Set(ownerDetail.data.timeline.map((row) => row.type));
  assert(timelineTypes.has('campaign.created'), 'timeline missing campaign.created');
  assert(timelineTypes.has('campaign.submitted'), 'timeline missing campaign.submitted');
  assert(timelineTypes.has('impact_review_approved'), 'timeline missing impact_review_approved');
  const blockerCodes = new Set((ownerDetail.data?.readiness?.blockers ?? []).map((row) => row.code));
  assert(!blockerCodes.has('NO_LINKED_PRODUCTS'), 'readiness should not include NO_LINKED_PRODUCTS after linking');
  assert(blockerCodes.has('PUBLIC_STOREFRONT_OFFLINE'), 'readiness should reflect storefront offline before final activation');
  report.push('QA-CAMPAIGN-DETAIL-03 owner reads campaign detail with timeline and backend readiness');

  const foreignDetail = await get(`/api/campaigns/${campaignId}`, foreignHeaders);
  assert(foreignDetail.status === 403, `foreign community detail expected 403, got ${foreignDetail.status}`);
  report.push('QA-CAMPAIGN-DETAIL-04 foreign community manager is blocked');

  const curatorDetail = await get(`/api/campaigns/${campaignId}`, curatorHeaders);
  assert(curatorDetail.status === 200, `curator detail expected 200, got ${curatorDetail.status}`);

  const adminDetail = await get(`/api/campaigns/${campaignId}`, adminHeaders);
  assert(adminDetail.status === 200, `platform admin detail expected 200, got ${adminDetail.status}`);
  report.push('QA-CAMPAIGN-DETAIL-05 curator and platform admin can read shared campaign detail contract');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, campaignId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
