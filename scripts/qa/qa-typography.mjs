import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function run() {
  const tokens = readJson('data/typography-tokens.json');
  const system = readJson('data/typography-system.json');
  const failures = [];
  const warnings = [];

  const families = tokens.families ?? {};
  const roles = tokens.roles ?? {};

  for (const [key, family] of Object.entries(families)) {
    if (!family.fontFamily || typeof family.fontFamily !== 'string') {
      failures.push(`missing_font_family:${key}`);
    }
  }

  for (const [roleKey, role] of Object.entries(roles)) {
    const familyKey = role.family;
    if (!families[familyKey]) failures.push(`role_unknown_family:${roleKey}:${familyKey}`);
    if (typeof role.weight !== 'number') failures.push(`role_missing_weight:${roleKey}`);
    if (!role.size) failures.push(`role_missing_size:${roleKey}`);
    if (typeof role.lineHeight !== 'number') failures.push(`role_missing_line_height:${roleKey}`);
    if (roleKey === 'body') {
      if (role.lineHeight < Number(tokens.constraints?.minBodyLineHeight ?? 1.5)) {
        failures.push('body_line_height_below_minimum');
      }
      if (role.size !== '1rem') {
        warnings.push('body_size_is_not_1rem_review_mobile_legibility');
      }
    }
  }

  if (!system.rules?.doNotRebuildWordmarkAsText) {
    failures.push('wordmark_rule_not_enforced');
  }

  const channelFamilies = system.channels ?? {};
  for (const [channel, list] of Object.entries(channelFamilies)) {
    if (Array.isArray(list) && list.length > Number(system.rules?.maxFamiliesPerPiece ?? 2)) {
      warnings.push(`channel_more_than_two_families:${channel}`);
    }
  }

  const cssPath = path.join(root, 'app', 'typography-vars.css');
  if (!fs.existsSync(cssPath)) {
    failures.push('missing_typography_css_vars');
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ status: 'FAIL', failures, warnings }, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        summary: {
          families: Object.keys(families).length,
          roles: Object.keys(roles).length,
        },
        warnings,
      },
      null,
      2
    )
  );
}

run();
