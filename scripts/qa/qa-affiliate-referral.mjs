const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3329';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function req(method, pathname, body, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    redirect: options.redirect ?? 'follow',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  return {
    status: response.status,
    data,
    location: response.headers.get('location'),
  };
}

async function run() {
  const suffix = Date.now();
  const report = [];
  const affiliateId = `qa-affiliate-${suffix}`;
  const linkLabel = `Link QA ${suffix}`;
  const slug = `qa-aff-${suffix}`;
  const orderId = `ORDER-QA-AFF-${suffix}`;
  const targetPath = `/shop?ref=qa-aff-${suffix}`;

  const affiliateHeaders = { 'x-actor-id': affiliateId, 'x-actor-role': 'affiliate' };
  const customerHeaders = { 'x-actor-id': `qa-customer-${suffix}`, 'x-actor-role': 'customer' };
  const adminHeaders = { 'x-actor-id': `qa-admin-${suffix}`, 'x-actor-role': 'platform_admin' };

  const anonymousList = await req('GET', '/api/affiliate/links');
  assert(anonymousList.status === 401, `anonymous affiliate links expected 401, got ${anonymousList.status}`);
  report.push('AFF-01 affiliate links require authenticated session');

  const customerList = await req('GET', '/api/affiliate/links', undefined, { headers: customerHeaders });
  assert(customerList.status === 403, `customer affiliate links expected 403, got ${customerList.status}`);
  report.push('AFF-02 non-affiliate role cannot read affiliate workspace');

  const createLink = await req(
    'POST',
    '/api/affiliate/links',
    {
      label: linkLabel,
      channel: 'instagram',
      targetPath,
      slug,
    },
    { headers: affiliateHeaders }
  );
  assert(createLink.status === 201, `affiliate create link expected 201, got ${createLink.status}`);
  const referralLinkId = createLink.data?.link?.referralLinkId;
  assert(typeof referralLinkId === 'string', 'referralLinkId missing');
  report.push('AFF-03 affiliate creates real referral link');

  const ownLinksAfterCreate = await req('GET', '/api/affiliate/links', undefined, { headers: affiliateHeaders });
  assert(ownLinksAfterCreate.status === 200, `affiliate own links expected 200, got ${ownLinksAfterCreate.status}`);
  const createdLink = Array.isArray(ownLinksAfterCreate.data?.links)
    ? ownLinksAfterCreate.data.links.find((item) => item.referralLinkId === referralLinkId)
    : null;
  assert(createdLink, 'created referral link missing from owner list');
  assert(createdLink.clickCount === 0, `created link clickCount expected 0, got ${createdLink.clickCount}`);
  assert(createdLink.conversionCount === 0, `created link conversionCount expected 0, got ${createdLink.conversionCount}`);
  report.push('AFF-04 owner reads newly created link with zeroed performance');

  const publicRedirect = await req('GET', `/af/${slug}`, undefined, { redirect: 'manual' });
  assert(publicRedirect.status === 307, `public referral redirect expected 307, got ${publicRedirect.status}`);
  assert(publicRedirect.location === `${baseUrl}${targetPath}`, `public redirect target mismatch: ${publicRedirect.location}`);
  report.push('AFF-05 public slug redirects to target path and records click');

  const ownLinksAfterClick = await req('GET', '/api/affiliate/links', undefined, { headers: affiliateHeaders });
  const clickedLink = Array.isArray(ownLinksAfterClick.data?.links)
    ? ownLinksAfterClick.data.links.find((item) => item.referralLinkId === referralLinkId)
    : null;
  assert(clickedLink, 'clicked referral link missing from owner list');
  assert(clickedLink.clickCount === 1, `clicked link clickCount expected 1, got ${clickedLink.clickCount}`);
  report.push('AFF-06 owner sees persisted click after public redirect');

  const affiliateConversion = await req(
    'POST',
    `/api/affiliate/links/${referralLinkId}/conversions`,
    { orderId, revenueAmount: 199.9 },
    { headers: affiliateHeaders }
  );
  assert(affiliateConversion.status === 403, `affiliate conversion record expected 403, got ${affiliateConversion.status}`);
  report.push('AFF-07 affiliate cannot self-record conversion');

  const adminConversion = await req(
    'POST',
    `/api/affiliate/links/${referralLinkId}/conversions`,
    { orderId, revenueAmount: 199.9 },
    { headers: adminHeaders }
  );
  assert(adminConversion.status === 201, `admin conversion record expected 201, got ${adminConversion.status}`);
  assert(adminConversion.data?.event?.orderId === orderId, 'conversion orderId mismatch');
  report.push('AFF-08 platform admin records conversion');

  const duplicateAdminConversion = await req(
    'POST',
    `/api/affiliate/links/${referralLinkId}/conversions`,
    { orderId, revenueAmount: 199.9 },
    { headers: adminHeaders }
  );
  assert(duplicateAdminConversion.status === 200, `duplicate conversion expected 200, got ${duplicateAdminConversion.status}`);
  assert(duplicateAdminConversion.data?.reused === true, 'duplicate conversion should reuse existing event');
  report.push('AFF-09 conversion write is idempotent by link and order');

  const adminReadOwner = await req(
    'GET',
    `/api/affiliate/links?ownerId=${encodeURIComponent(affiliateId)}`,
    undefined,
    { headers: adminHeaders }
  );
  assert(adminReadOwner.status === 200, `admin ownerId read expected 200, got ${adminReadOwner.status}`);
  report.push('AFF-10 platform admin can inspect affiliate owner scope');

  const ownLinksAfterConversion = await req('GET', '/api/affiliate/links', undefined, { headers: affiliateHeaders });
  const convertedLink = Array.isArray(ownLinksAfterConversion.data?.links)
    ? ownLinksAfterConversion.data.links.find((item) => item.referralLinkId === referralLinkId)
    : null;
  assert(convertedLink, 'converted referral link missing from owner list');
  assert(convertedLink.conversionCount === 1, `converted link conversionCount expected 1, got ${convertedLink.conversionCount}`);
  assert(convertedLink.revenueAmount === 199.9, `converted link revenue expected 199.9, got ${convertedLink.revenueAmount}`);
  assert(convertedLink.conversionRate === 100, `converted link conversionRate expected 100, got ${convertedLink.conversionRate}`);
  report.push('AFF-11 owner sees conversion, revenue and conversion rate from persisted runtime events');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, referralLinkId, slug, orderId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
