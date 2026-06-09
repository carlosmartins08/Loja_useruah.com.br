import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentPath = path.join(root, 'data', 'content-messages.json');

const limits = {
  headlineShort: 60,
  headlineBlock: 90,
  bodyShort: 140,
  bodyLong: 280,
  button: 24,
};

function fail(message) {
  console.error(message);
}

function run() {
  const raw = fs.readFileSync(contentPath, 'utf8');
  const parsed = JSON.parse(raw);
  const messages = Array.isArray(parsed.messages) ? parsed.messages : [];

  const failures = [];
  const ids = messages.map((m) => m.id);
  if (new Set(ids).size !== ids.length) failures.push('duplicate_message_id');

  for (const msg of messages) {
    if (!msg.id || !msg.tipo || !msg.nivel || !msg.rota || !msg.persona || !msg.headline || !msg.body) {
      failures.push(`missing_required_fields:${msg.id ?? 'unknown'}`);
      continue;
    }
    if (String(msg.headline).length > limits.headlineBlock) failures.push(`headline_too_long:${msg.id}`);
    if (msg.headlineContextual && String(msg.headlineContextual).length > limits.headlineBlock) failures.push(`headline_contextual_too_long:${msg.id}`);
    if (msg.headlineRuah && String(msg.headlineRuah).length > limits.headlineBlock) failures.push(`headline_ruah_too_long:${msg.id}`);
    if (String(msg.body).length > limits.bodyLong) failures.push(`body_too_long:${msg.id}`);
    if (msg.bodyContextual && String(msg.bodyContextual).length > limits.bodyLong) failures.push(`body_contextual_too_long:${msg.id}`);
    if (msg.bodyRuah && String(msg.bodyRuah).length > limits.bodyLong) failures.push(`body_ruah_too_long:${msg.id}`);
    if (msg.ctaPrimary && String(msg.ctaPrimary).length > limits.button) failures.push(`cta_primary_too_long:${msg.id}`);
    if (msg.ctaSecondary && String(msg.ctaSecondary).length > limits.button) failures.push(`cta_secondary_too_long:${msg.id}`);
    if (Array.isArray(msg.variables) && msg.variables.length > 0 && !msg.fallbackBody) {
      failures.push(`missing_fallback_body:${msg.id}`);
    }
  }

  if (failures.length > 0) {
    console.error(
      JSON.stringify(
        {
          status: 'FAIL',
          failures,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        summary: { messages: messages.length },
        limits,
      },
      null,
      2
    )
  );
}

run();
