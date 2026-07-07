#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

let cachedCatalog = null;
let cachedCatalogPath = null;

function resolveCatalogPath(root = process.cwd()) {
  const candidates = [
    path.join(root, '..', 'skills', 'CATALOGO.md'),
    path.join(root, 'skills', 'CATALOGO.md'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(text) {
  return normalize(text).match(/[a-z0-9]+/g) ?? [];
}

function parseCatalog(text) {
  const skills = [];
  const entryRegex = /Nome:\s*(.+)\r?\nTags:\s*(.+)\r?\nUso:\s*(.+)\r?\nLocal:\s*`?([^`\r\n]+)`?/g;
  let match;

  while ((match = entryRegex.exec(text)) !== null) {
    const [, name, tags, usage, local] = match;
    skills.push({
      name: name.trim(),
      tags: tags
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      usage: usage.trim(),
      local: local.trim(),
    });
  }

  return skills;
}

export function loadSkillCatalog(root = process.cwd()) {
  const catalogPath = resolveCatalogPath(root);
  if (!catalogPath) {
    throw new Error('Unable to locate skills/CATALOGO.md. The skill catalog is required for routing.');
  }

  if (cachedCatalog && cachedCatalogPath === catalogPath) {
    return cachedCatalog;
  }

  const text = fs.readFileSync(catalogPath, 'utf8');
  cachedCatalog = parseCatalog(text);
  cachedCatalogPath = catalogPath;
  return cachedCatalog;
}

export function scoreSkillAgainstText(skill, text) {
  const normalizedText = normalize(text);
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  let score = 0;
  const reasons = [];

  const addReason = (weight, label) => {
    score += weight;
    reasons.push(label);
  };

  if (normalizedText.includes(normalize(skill.name))) {
    addReason(12, `name:${skill.name}`);
  }

  for (const tag of skill.tags ?? []) {
    if (normalizedText.includes(normalize(tag))) {
      addReason(4, `tag:${tag}`);
    }
  }

  for (const token of tokenize(`${skill.usage} ${skill.tags.join(' ')}`)) {
    if (token.length < 4) continue;
    if (tokenSet.has(token)) {
      score += 1;
      if (reasons.length < 6) reasons.push(`match:${token}`);
    }
  }

  return { score, reasons };
}

export function recommendSkills(text, { root = process.cwd(), limit = 8 } = {}) {
  const catalog = loadSkillCatalog(root);
  const ranked = catalog
    .map((skill) => {
      const result = scoreSkillAgainstText(skill, text);
      return {
        ...skill,
        score: result.score,
        reasons: result.reasons,
      };
    })
    .filter((skill) => skill.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));

  return ranked.slice(0, limit);
}

export function getCatalogSize(root = process.cwd()) {
  return loadSkillCatalog(root).length;
}
