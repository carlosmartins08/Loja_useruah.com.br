import { ensureQaEnvLoaded } from './_qa-env.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from './catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3311';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractCookieValue(cookieHeader, cookieName = 'ruah_session') {
  return cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(`${cookieName}=`.length);
}

function buildCookieHeader(cookieValue, cookieName = 'ruah_session') {
  return `${cookieName}=${cookieValue}`;
}

function countDecodeLayers(cookieValue, maxDepth = 4) {
  let current = cookieValue;
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    if (typeof current === 'string' && current.startsWith('{')) {
      return depth;
    }
    try {
      const next = decodeURIComponent(current);
      if (!next || next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return null;
}

async function post(pathname, body, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data, headers: response.headers };
}

async function get(pathname, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { headers });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data, headers: response.headers };
}

async function registerCustomer() {
  const response = await post('/api/auth/register', {
    persona: 'ALMA',
    fullName: `QA Cookie ${Date.now()}`,
    email: `qa-cookie-${Date.now()}@useruah.com.br`,
    password: 'qaCookie123',
    termsAccepted: true,
    draft: {
      cpf: '12345678901',
      phone: '11999999999',
    },
  });
  const cookie = response.headers.get('set-cookie')?.split(';')[0] ?? null;
  return { ...response, cookie };
}

function buildOrderPayload(customerId, seeded) {
  return {
    supplierId: 'supplier-default',
    shippingAddressMode: 'same_as_account',
    shippingAddress: {
      recipientName: 'QA Customer',
      cep: '01000-000',
      street: 'Rua QA',
      number: '100',
      city: 'Sao Paulo',
      state: 'SP',
      country: 'BR',
    },
    items: [
      {
        catalogItemId: seeded.item.catalogItemId,
        variantId: seeded.variant.variantId,
        quantity: 1,
        unitPrice: seeded.variant.price,
      },
    ],
    customer: { id: customerId },
  };
}

async function run() {
  const report = [];

  const seed = await postBootstrap(baseUrl);
  assert(seed.status === 200, `bootstrap expected 200, got ${seed.status}`);
  report.push('AUTH-01 bootstrap catalog ready');

  const seeded = await resolveSeededCatalogVariant(baseUrl);
  report.push(`AUTH-02 catalog item resolved (${seeded.variant.variantId})`);

  const customer = await registerCustomer();
  assert(customer.status === 201, `register expected 201, got ${customer.status}`);
  assert(typeof customer.cookie === 'string' && customer.cookie.length > 0, 'customer cookie missing');
  const customerId = customer.data?.session?.userId;
  assert(typeof customerId === 'string' && customerId.length > 0, 'customer session userId missing');
  report.push('AUTH-03 customer session created');

  const canonicalCookieValue = extractCookieValue(customer.cookie);
  assert(typeof canonicalCookieValue === 'string' && canonicalCookieValue.length > 0, 'canonical cookie value missing');
  const canonicalDepth = countDecodeLayers(canonicalCookieValue);
  assert(canonicalDepth !== null && canonicalDepth >= 1 && canonicalDepth <= 2, `unexpected canonical cookie decode depth: ${String(canonicalDepth)}`);
  report.push(`AUTH-03B canonical cookie format emitted (decode depth ${canonicalDepth})`);

  const session = await get('/api/auth/session', { cookie: customer.cookie });
  assert(session.status === 200, `auth session expected 200, got ${session.status}`);
  assert(session.data?.authenticated === true, 'auth session not authenticated');
  assert(session.data?.session?.userId === customerId, 'auth session returned mismatched user');
  report.push('AUTH-04 auth/session recognizes customer cookie');

  const legacyCookie = buildCookieHeader(encodeURIComponent(canonicalCookieValue));
  const legacyDepth = countDecodeLayers(encodeURIComponent(canonicalCookieValue));
  assert(legacyDepth !== null && legacyDepth > canonicalDepth, `legacy cookie should require more decoding than canonical: canonical=${String(canonicalDepth)} legacy=${String(legacyDepth)}`);
  const legacySession = await get('/api/auth/session', { cookie: legacyCookie });
  assert(legacySession.status === 200, `legacy auth session expected 200, got ${legacySession.status}`);
  assert(legacySession.data?.authenticated === true, 'legacy auth session not authenticated');
  assert(legacySession.data?.session?.userId === customerId, 'legacy auth session returned mismatched user');
  report.push('AUTH-04B legacy double-encoded cookie still accepted');

  const orderWithCookie = await post('/api/orders', buildOrderPayload(customerId, seeded), { cookie: customer.cookie });
  assert(orderWithCookie.status === 201, `order with cookie expected 201, got ${orderWithCookie.status}`);
  report.push('AUTH-05 orders accepts same customer session cookie');

  const orderWithLegacyCookie = await post('/api/orders', buildOrderPayload(customerId, seeded), { cookie: legacyCookie });
  assert(orderWithLegacyCookie.status === 201, `order with legacy cookie expected 201, got ${orderWithLegacyCookie.status}`);
  report.push('AUTH-05B orders accepts legacy double-encoded cookie');

  const orderAnonymous = await post('/api/orders', buildOrderPayload(customerId, seeded));
  assert(orderAnonymous.status === 401, `order anonymous expected 401, got ${orderAnonymous.status}`);
  report.push('AUTH-06 anonymous order blocked with 401');

  const malformedSession = await get('/api/auth/session', { cookie: buildCookieHeader('not-a-valid-session-token') });
  assert(malformedSession.status === 200, `malformed auth session expected 200, got ${malformedSession.status}`);
  assert(malformedSession.data?.authenticated === false, 'malformed auth session should be anonymous');
  const orderMalformed = await post('/api/orders', buildOrderPayload(customerId, seeded), {
    cookie: buildCookieHeader('not-a-valid-session-token'),
  });
  assert(orderMalformed.status === 401, `order malformed cookie expected 401, got ${orderMalformed.status}`);
  report.push('AUTH-06B malformed cookie treated as anonymous');

  const wrongRole = await post('/api/auth/register', {
    persona: 'FAROL',
    fullName: `QA Wrong Role ${Date.now()}`,
    email: `qa-wrong-role-${Date.now()}@useruah.com.br`,
    password: 'qaWrongRole123',
    termsAccepted: true,
    draft: {
      organizationName: 'QA Wrong Role Org',
      responsibleName: 'QA Wrong Role Lead',
      termsAccepted: true,
      whatsapp: '11999999999',
    },
  });
  assert(wrongRole.status === 201, `wrong role register expected 201, got ${wrongRole.status}`);
  const wrongRoleCookie = wrongRole.headers.get('set-cookie')?.split(';')[0] ?? null;
  assert(typeof wrongRoleCookie === 'string' && wrongRoleCookie.length > 0, 'wrong role cookie missing');
  const orderWrongRole = await post('/api/orders', buildOrderPayload(customerId, seeded), { cookie: wrongRoleCookie });
  assert(orderWrongRole.status === 403, `order wrong role expected 403, got ${orderWrongRole.status}`);
  report.push('AUTH-07 non-customer session blocked with 403');

  report.push('AUTH-08 session expiry not applicable (no expiry claim in session payload)');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
