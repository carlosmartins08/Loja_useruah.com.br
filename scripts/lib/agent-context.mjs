#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { recommendSkills, getCatalogSize } from './skill-catalog.mjs';

const AGENT_PLANS = {
  FRONT_1_COMMUNITY_CAMPAIGNS: {
    currentMission: 'Fechar o recorte de campanhas com ownership real e sem abrir dominio paralelo.',
    requiredAgents: [
      'Executive Orchestrator',
      'Project Brain',
      'Chief Product Strategist',
      'Business Analyst',
      'Requirements Engineer',
      'Domain Architect',
      'Journey Architect',
      'Solution Architecture Lead',
      'Chief Engineering Architect',
      'Quality Office',
    ],
    supportOffices: ['Governance Office', 'Documentation Office'],
    nextActions: [
      'Validar a leitura do dominio de campanhas contra o estado real do runtime.',
      'Gerar artefato de requisito e jornada com criterio de aceite verificavel.',
      'Escalar qualquer conflito de ownership antes de tocar implementacao.',
    ],
    stopCondition: 'Pare se a campanha depender de uma premissa nao provada ou de uma nova fronteira de dominio.',
  },
  FRONT_2_AFFILIATE_REFERRAL: {
    currentMission: 'Fechar atribuicao e fechamento de afiliacao sem inventar payout proprio.',
    requiredAgents: [
      'Executive Orchestrator',
      'Project Brain',
      'Chief Product Strategist',
      'Business Analyst',
      'Requirements Engineer',
      'Domain Architect',
      'Journey Architect',
      'Solution Architecture Lead',
      'Chief Engineering Architect',
      'Quality Office',
    ],
    supportOffices: ['Governance Office', 'Security Office'],
    nextActions: [
      'Validar a trilha de referral contra ledger e escopo real.',
      'Garantir que o fechamento siga a regra vigente e nao um atalho de UX.',
      'Parar se surgir qualquer tentativa de criar reward ou balance nao autorizado.',
    ],
    stopCondition: 'Pare se a atribuicao pedir ledger novo, reward proprio ou payout fora do contrato vigente.',
  },
  FRONT_3_CATALOG_CURATION_HARDENING: {
    currentMission: 'Endurecer curadoria e catalogo sem abrir Fase 3 autonoma.',
    requiredAgents: [
      'Executive Orchestrator',
      'Project Brain',
      'Chief Product Strategist',
      'Business Analyst',
      'Requirements Engineer',
      'Domain Architect',
      'Journey Architect',
      'Solution Architecture Lead',
      'Chief Engineering Architect',
      'Quality Office',
    ],
    supportOffices: ['Experience Office', 'Documentation Office'],
    nextActions: [
      'Revalidar estados de curadoria e a leitura publica do catalogo.',
      'Corrigir qualquer lacuna entre review, ready e published.',
      'Bloquear expansao de produto paralelo enquanto o recorte atual nao estiver fechado.',
    ],
    stopCondition: 'Pare se a mudanca tentar vender Fase 3 como se ja fosse base madura completa.',
  },
  FRONT_4_PUBLIC_SURFACES_HONESTY: {
    currentMission: 'Manter superficies publicas honestas e sem promessas que o runtime nao sustenta.',
    requiredAgents: [
      'Executive Orchestrator',
      'Project Brain',
      'Chief Product Strategist',
      'Requirements Engineer',
      'Domain Architect',
      'Journey Architect',
      'Solution Architecture Lead',
      'Chief Engineering Architect',
      'Quality Office',
    ],
    supportOffices: ['Governance Office', 'Experience Office'],
    nextActions: [
      'Auditar paginas publicas que ainda sugerem capacidades ausentes.',
      'Remover copy, CTA ou navegacao que prometam algo inexistente.',
      'Parar se a correção estiver empurrando regra de negocio para o client.',
    ],
    stopCondition: 'Pare se a pagina estiver tentando simular dominio ou permissao que nao existem.',
  },
  FRONT_5_REAL_PAYMENTS_CUTOVER: {
    currentMission: 'Manter o cutover de pagamentos bloqueado ate a janela externa real existir.',
    requiredAgents: [
      'Executive Orchestrator',
      'Project Brain',
      'Governance Guardian',
      'Solution Architecture Lead',
      'Chief Engineering Architect',
      'Quality Office',
    ],
    supportOffices: ['Security Office', 'Documentation Office', 'Data Office'],
    nextActions: [
      'Confirmar se a janela externa objetiva de homolog final e cutover existe.',
      'Manter o bloqueio como estado ativo, nao como desculpa para patch improvisado.',
      'Preparar apenas o que puder ser validado sem tocar o contrato real de pagamento.',
    ],
    stopCondition: 'Pare imediatamente se a base URL ainda for localhost ou se o ajuste tentar simular homolog real.',
  },
};

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function readText(filePath) {
  try {
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseActiveFront(text) {
  const statusMatch = text.match(/Status da frente:\s*`([^`]+)`/i);
  const objectiveMatch = text.match(/## Objetivo atual\s*\n([\s\S]*?)\n## /i);
  const branchMatch = text.match(/Branch:\s*`([^`]+)`/i);

  return {
    status: statusMatch?.[1] ?? null,
    objective: objectiveMatch?.[1]?.trim().replace(/\n+/g, ' ') ?? null,
    branch: branchMatch?.[1] ?? null,
  };
}

export function buildAgentPlan(root = process.cwd(), contextText = '') {
  const sessionState = readJson(path.join(root, '.agents', 'session-state.json'), {});
  const activeFrontText = readText(path.join(root, 'docs', 'ACTIVE_FRONT.md'));
  const activeFront = parseActiveFront(activeFrontText);
  const front = String(sessionState.activeFront || activeFront.status || '').trim();
  const blocked = Boolean(sessionState.blocked);
  const objective = String(sessionState.objective || activeFront.objective || '').trim();
  const selected = AGENT_PLANS[front] || {
    currentMission: 'Manter continuidade e roteamento enquanto a frente nao estiver mapeada.',
    requiredAgents: ['Executive Orchestrator', 'Project Brain', 'Governance Guardian'],
    supportOffices: ['Documentation Office'],
    nextActions: [
      'Identificar a frente ativa real antes de agir.',
      'Amarrar a demanda ao plano mestre e ao gatilho de continuidade.',
    ],
    stopCondition: 'Pare se a frente nao puder ser identificada com clareza.',
  };
  const analysisText = [contextText, objective, front, activeFront.status, selected.currentMission].filter(Boolean).join(' ');
  const recommendedSkills = recommendSkills(analysisText, { root, limit: 10 });

  return {
    activeFront: front,
    blocked,
    objective,
    branch: sessionState.branch || activeFront.branch || null,
    generatedAt: new Date().toISOString(),
    currentMission: selected.currentMission,
    requiredAgents: selected.requiredAgents,
    supportOffices: selected.supportOffices,
    nextActions: selected.nextActions,
    stopCondition: selected.stopCondition,
    catalogSize: getCatalogSize(root),
    recommendedSkills,
    sourceFiles: {
      activeFront: 'docs/ACTIVE_FRONT.md',
      routingMatrix: 'docs/AI_AGENTS_ROUTING_MATRIX.md',
      sessionState: '.agents/session-state.json',
    },
    activeFrontLabel: activeFront.status,
  };
}

export function ensureAgentPlanFile(root = process.cwd(), contextText = '') {
  const plan = buildAgentPlan(root, contextText);
  const outputDir = path.join(root, '.tmp-store');
  const outputPath = path.join(outputDir, 'active-agent-plan.json');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return { plan, outputPath };
}

export function formatAgentBrief(plan) {
  const toBulletList = (items) => {
    if (!Array.isArray(items) || items.length === 0) return '- none';
    return items.map((item) => `- ${item}`).join('\n');
  };

  const recommendedSkills = Array.isArray(plan.recommendedSkills) && plan.recommendedSkills.length > 0
    ? plan.recommendedSkills
        .map((skill) => `- ${skill.name} [score ${skill.score}] - ${skill.reasons.slice(0, 3).join(', ')}`)
        .join('\n')
    : '- none';

  const lines = [
    `Active front: ${plan.activeFront ?? 'n/a'}`,
    `Blocked: ${plan.blocked ? 'yes' : 'no'}`,
    `Mission: ${plan.currentMission ?? 'n/a'}`,
    `Skill catalog size: ${plan.catalogSize ?? 'n/a'}`,
  ];

  if (plan.requestText) {
    lines.push(`Request: ${plan.requestText}`);
  }

  lines.push(
    '',
    'Required agents:',
    toBulletList(plan.requiredAgents),
    '',
    'Support offices:',
    toBulletList(plan.supportOffices),
    '',
    'Recommended skills:',
    recommendedSkills,
    '',
    'Next actions:',
    toBulletList(plan.nextActions),
    '',
    `Stop condition: ${plan.stopCondition ?? 'n/a'}`
  );

  return lines.join('\n');
}

export function buildAgentRoute(root = process.cwd(), requestText = '') {
  const plan = buildAgentPlan(root, requestText);
  return {
    ...plan,
    requestText: String(requestText ?? '').trim(),
  };
}
