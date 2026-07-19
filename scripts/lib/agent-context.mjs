#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { recommendSkills, getCatalogSize } from './skill-catalog.mjs';

const AUTHORITY_DOCS = [
  'docs/ACTIVE_FRONT.md',
  'docs/NEXT_SESSION_TRIGGER.md',
  'docs/DOCS_CLASSIFICATION.md',
  'docs/README_DOCS_HIERARCHY.md',
  'docs/EXECUTION_TRACKING.md',
  'docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md',
  'docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md',
  'docs/DECISIONS.md',
  'docs/ARCHITECTURE.md',
];

const CANONICAL_COMMANDS = [
  'npm run agents:route -- "<pedido>"',
  'npm run agents:brief',
  'npm run agents:exec -- -- <comando>',
];

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
  FRONT_6_CONTINUITY_DIFFERENTIAL_AUDIT: {
    currentMission: 'Reconciliar a autoridade de continuidade com o historico W1-W8 sem reabrir pagamentos ou alterar produto.',
    requiredAgents: [
      'Executive Orchestrator',
      'Project Brain',
      'Governance Guardian',
      'Solution Architecture Lead',
      'Chief Engineering Architect',
      'Quality Office',
    ],
    supportOffices: ['Documentation Office', 'Data Office', 'Delivery Operations Guardian'],
    nextActions: [
      'Tratar W1-W8 como historico processado, preservando apenas as evidencias existentes.',
      'Comparar ACTIVE_FRONT, session-state, NEXT_SESSION_TRIGGER e o roteador para eliminar contradicoes.',
      'Manter FRONT_5_REAL_PAYMENTS_CUTOVER bloqueada como dependencia externa, nao como frente ativa.',
      'Executar somente auditoria diferencial e validacoes de continuidade antes de qualquer nova frente de produto.',
    ],
    stopCondition: 'Pare se a correcao tentar alterar produto, contrato, persistencia, banco ou reabrir pagamento real.',
  },
};

const AUDIT_360_PLAN = {
  currentMission: 'Auditar a integridade do fluxo comercial critico sem abrir implementacao ou reabrir frente bloqueada.',
  requiredAgents: [
    'Executive Orchestrator',
    'Project Brain',
    'Requirements Engineer',
    'Domain Architect',
    'Journey Architect',
    'Solution Architecture Lead',
    'Chief Engineering Architect',
    'Quality Office',
  ],
  supportOffices: ['Security Office', 'Data Office', 'Documentation Office', 'Observability Office'],
  nextActions: [
    'Mapear o fluxo catalogo -> produto -> carrinho -> checkout -> pedido -> pagamento -> webhook -> producao.',
    'Separar fato observado, hipotese, risco, decisao recomendada e mudanca ainda nao autorizada.',
    'Registrar cada achado com evidencia de arquivo/linha, severidade, impacto, confianca e proximo responsavel.',
    'Encaminhar qualquer implementacao resultante para a frente ativa e seus gates, sem alterar o escopo durante a auditoria.',
  ],
  stopCondition: 'Pare se a auditoria tentar liberar pagamento, alterar contrato ou transformar hipotese em requisito sem evidencia.',
  audit: {
    auditType: 'audit_360',
    executionMode: 'read_only',
    scope: ['catalog', 'product', 'cart', 'checkout', 'order', 'payment', 'webhook', 'production'],
    evidenceRequired: ['runtime_code', 'api_contract', 'state_machine', 'persistence_path', 'qa_or_regression_proof'],
    findingSchema: [
      'id',
      'claim',
      'evidence',
      'status',
      'severity',
      'businessImpact',
      'confidence',
      'recommendedAction',
      'nextOwner',
    ],
  },
};

const COHERENCE_AUDIT_PLAN = {
  currentMission: 'Mapear e reduzir incoerencias estruturais do projeto sem criar uma nova autoridade paralela.',
  requiredAgents: [
    'Executive Orchestrator',
    'Project Brain',
    'Governance Guardian',
    'Requirements Engineer',
    'Domain Architect',
    'Journey Architect',
    'Solution Architecture Lead',
    'Chief Engineering Architect',
    'Quality Office',
  ],
  supportOffices: ['Data Office', 'Documentation Office', 'Security Office', 'Observability Office'],
  nextActions: [
    'Estabelecer a hierarquia de autoridade e a fonte de verdade por ambiente e dominio.',
    'Confrontar runtime, contratos, estados, persistencia, testes e documentacao.',
    'Registrar cada divergencia como fato, risco, decisao, criterio de aceite e proximo dono.',
    'Corrigir em ondas independentes, sem abrir frente nova nem misturar auditoria com implementacao.',
  ],
  stopCondition: 'Pare se a auditoria tentar reescrever a arquitetura, abrir uma frente bloqueada ou converter hipotese em regra sem evidencia.',
  audit: {
    auditType: 'coherence_audit',
    executionMode: 'read_only',
    scope: ['governance', 'architecture', 'domains', 'data', 'api_contracts', 'state_machines', 'persistence', 'journeys', 'quality', 'operations', 'documentation'],
    phases: [
      'authority_baseline',
      'runtime_vs_documents',
      'domain_and_data_boundaries',
      'contracts_and_states',
      'environment_persistence',
      'quality_and_operations',
    ],
    evidenceRequired: ['authority_docs', 'runtime_code', 'api_contract', 'state_machine', 'persistence_path', 'qa_or_regression_proof'],
    findingSchema: [
      'id',
      'domain',
      'expectedAuthority',
      'observedEvidence',
      'incoherence',
      'status',
      'severity',
      'businessImpact',
      'confidence',
      'decision',
      'acceptanceCriteria',
      'nextOwner',
    ],
  },
};

const EXECUTION_PLAN = {
  currentMission: 'Transformar o estado atual em uma entrega funcional por dominio, sem quebrar contratos, duplicar autoridade ou abrir escopo sem gate.',
  requiredAgents: [
    'Executive Orchestrator',
    'Project Brain',
    'Governance Guardian',
    'Requirements Engineer',
    'Domain Architect',
    'Solution Architecture Lead',
    'Chief Engineering Architect',
    'Quality Office',
    'Delivery Operations Guardian',
  ],
  supportOffices: ['Data Office', 'Documentation Office', 'Security Office', 'Observability Office', 'Journey Office'],
  nextActions: [
    'Congelar o baseline atual e transformar cada incoerencia em item rastreavel.',
    'Executar uma onda por vez, sempre com contrato, persistencia, estados, testes e rollback definidos.',
    'Reutilizar modulos existentes; criar fronteira nova somente com justificativa arquitetural registrada.',
    'Liberar um dominio apenas quando sua jornada critica tiver prova de runtime e operacao correspondente.',
  ],
  stopCondition: 'Pare se a tarefa pedir mudanca sem criterio de aceite, contrato sem compatibilidade, persistencia sem fonte oficial ou liberacao de uma frente bloqueada.',
  execution: {
    executionType: 'controlled_delivery_plan',
    executionMode: 'plan_first_then_implement',
    definitionOfDone: [
      'uma fonte de verdade por dado critico e ambiente',
      'um contrato validado e documentado',
      'uma maquina de estados alinhada ao runtime',
      'persistencia coerente com o ambiente',
      'teste de regressao para o risco principal',
      'observabilidade minima e rollback definido',
      'documentacao normativa atualizada sem duplicidade',
    ],
    waves: [
      { id: 'W0', name: 'baseline e autoridade', gate: 'nenhuma mudanca inicia sem mapa de fontes de verdade e bloqueios' },
      { id: 'W1', name: 'fundacao de identidade e acesso', gate: 'sessao, RBAC e ownership provados nas jornadas criticas' },
      { id: 'W2', name: 'catalogo, cotacao e pedido', gate: 'catalogo, preco, disponibilidade e pedido possuem autoridade server-side' },
      { id: 'W3', name: 'pagamento, webhook e reconciliacao', gate: 'valor, idempotencia, efeitos e falhas possuem prova repetivel' },
      { id: 'W4', name: 'producao, envio e suporte', gate: 'estados, snapshots, shipment e suporte refletem o mesmo pedido' },
      { id: 'W5', name: 'admin, operacao e indicadores', gate: 'nenhum dado sintetico aparece como indicador operacional real' },
      { id: 'W6', name: 'ambiente, QA e entrega', gate: 'build, MySQL, observabilidade, rollback e cutover estao comprovados' },
      { id: 'W7', name: 'classificacao diferencial do legado', gate: 'W1-W6 nao sao reabertas; origem e classificacao do backfill ficam explicitamente registradas' },
      { id: 'W8', name: 'preparacao de promocao externa', gate: 'manifesto, checksum, escopo, backup, rollback e preflight externos preparados sem afirmar homolog PASS' },
    ],
    requiredEvidence: ['decision_record', 'impact_map', 'api_contract', 'state_machine', 'persistence_path', 'regression_proof', 'operational_readiness'],
    handoffSchema: ['wave', 'owner', 'objective', 'input', 'output', 'changedFiles', 'risks', 'blockedBy', 'acceptanceCriteria', 'rollback', 'nextWave'],
  },
};

function normalizeRoutingText(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function classifyRequestType(requestText = '') {
  const normalized = normalizeRoutingText(requestText);
  const isAuditRequest = normalized.includes('auditoria') || normalized.includes('audit 360') || normalized.includes('audit360');
  const hasCriticalFlowTerm = [
    'catalogo',
    'checkout',
    'pedido',
    'pagamento',
    'webhook',
    'producao',
  ].some((term) => normalized.includes(term));

  if (isAuditRequest && hasCriticalFlowTerm) return 'audit_360';

  const executionSignals = [
    'plano de execucao',
    'plano pratico',
    'proposta de execucao',
    '100% da funcionalidade',
    'sem quebrar o projeto',
    'sem duplicidade',
    'sem incoerencia',
    'boa pratica de desenvolvimento',
  ];
  const isExecutionPlanRequest = executionSignals.some((signal) => normalized.includes(signal));
  if (isExecutionPlanRequest) return 'execution_plan';

  const coherenceSignals = [
    'coerencia',
    'incoerencia',
    'fonte de verdade',
    'base evolutiva',
    'auditoria estrutural',
    'organizar a casa',
    'consistencia arquitetural',
    'divergencia entre codigo e documentacao',
  ];
  const broadScopeSignals = ['arquitetura', 'dominio', 'dados', 'persistencia', 'contratos', 'estados', 'documentacao', 'ambientes', 'projeto'];
  const isCoherenceRequest = coherenceSignals.some((signal) => normalized.includes(signal));
  const hasBroadScopeTerm = broadScopeSignals.some((signal) => normalized.includes(signal));

  if (isCoherenceRequest && hasBroadScopeTerm) return 'coherence_audit';
  return 'continuity';
}

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
  const requestType = classifyRequestType(contextText);
  const requestPlan = requestType === 'audit_360' ? AUDIT_360_PLAN : requestType === 'coherence_audit' ? COHERENCE_AUDIT_PLAN : null;
  const executionPlan = requestType === 'execution_plan' ? EXECUTION_PLAN : null;
  const selected = requestPlan || executionPlan || AGENT_PLANS[front] || {
    currentMission: 'Manter continuidade e roteamento enquanto a frente nao estiver mapeada.',
    requiredAgents: ['Executive Orchestrator', 'Project Brain', 'Governance Guardian'],
    supportOffices: ['Documentation Office'],
    nextActions: [
      'Identificar a frente ativa real antes de agir.',
      'Amarrar a demanda ao plano mestre e ao gatilho de continuidade.',
    ],
    stopCondition: 'Pare se a frente nao puder ser identificada com clareza.',
  };
  const routingHints = requestType === 'audit_360'
    ? 'quality qa testing architecture backend domain api contract data persistence security payment webhook regression'
    : requestType === 'coherence_audit'
      ? 'governance architecture domain data api contract state persistence environment documentation quality operations security observability regression'
      : requestType === 'execution_plan'
        ? 'governance architecture domain api contract data persistence quality testing operations delivery rollback observability implementation regression'
        : '';
  const analysisText = [contextText, objective, front, activeFront.status, selected.currentMission, routingHints]
    .filter(Boolean)
    .join(' ');
  const recommendedSkills = recommendSkills(analysisText, { root, limit: 10 });
  const executionStatus = requestPlan
    ? 'ROUTED_READ_ONLY'
    : executionPlan
      ? 'PLANNED_CONTROLLED_EXECUTION'
      : blocked
        ? 'BLOCKED_ACTIVE_FRONT'
        : 'PASS';

  return {
    activeFront: front,
    blocked,
    blockedReasons: blocked ? sessionState.blockers ?? [] : [],
    objective,
    branch: sessionState.branch || activeFront.branch || null,
    generatedAt: new Date().toISOString(),
    authorityDocs: AUTHORITY_DOCS,
    canonicalCommands: CANONICAL_COMMANDS,
    currentMission: selected.currentMission,
    requestType,
    routingMode: requestPlan || executionPlan ? 'request_first' : 'active_front',
    executionStatus,
    activeFrontConstraint: (requestPlan || executionPlan) && blocked
      ? {
          status: 'blocked',
          front,
          reasons: sessionState.blockers ?? [],
        }
      : null,
    requiredAgents: selected.requiredAgents,
    supportOffices: selected.supportOffices,
    nextActions: selected.nextActions,
    stopCondition: selected.stopCondition,
    auditPlan: selected.audit ?? null,
    executionPlan: executionPlan?.execution ?? null,
    catalogSize: getCatalogSize(root),
    recommendedSkills,
    sourceFiles: {
      activeFront: 'docs/ACTIVE_FRONT.md',
      nextSessionTrigger: 'docs/NEXT_SESSION_TRIGGER.md',
      docsClassification: 'docs/DOCS_CLASSIFICATION.md',
      docsHierarchy: 'docs/README_DOCS_HIERARCHY.md',
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
    `Request type: ${plan.requestType ?? 'continuity'}`,
    `Routing mode: ${plan.routingMode ?? 'active_front'}`,
    `Execution status: ${plan.executionStatus ?? 'n/a'}`,
    `Mission: ${plan.currentMission ?? 'n/a'}`,
    `Skill catalog size: ${plan.catalogSize ?? 'n/a'}`,
  ];

  if (plan.requestText) {
    lines.push(`Request: ${plan.requestText}`);
  }

  lines.push(
    '',
    'Authority docs:',
    toBulletList(plan.authorityDocs),
    '',
    'Canonical commands:',
    toBulletList(plan.canonicalCommands),
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
    toBulletList(plan.nextActions)
  );

  if (plan.auditPlan) {
    lines.push(
      '',
      'Audit mode:',
      `- ${plan.auditPlan.executionMode}`,
      `- scope: ${plan.auditPlan.scope.join(', ')}`,
      `- evidence: ${plan.auditPlan.evidenceRequired.join(', ')}`,
      `- finding schema: ${plan.auditPlan.findingSchema.join(', ')}`
    );
  }

  if (plan.executionPlan) {
    lines.push(
      '',
      'Controlled execution plan:',
      `- ${plan.executionPlan.executionMode}`,
      `- waves: ${plan.executionPlan.waves.map((wave) => wave.id).join(', ')}`,
      `- definition of done: ${plan.executionPlan.definitionOfDone.join(', ')}`,
      `- required evidence: ${plan.executionPlan.requiredEvidence.join(', ')}`,
      `- handoff: ${plan.executionPlan.handoffSchema.join(', ')}`
    );
  }

  if (plan.activeFrontConstraint) {
    lines.push(
      '',
      'Active front constraint:',
      `- ${plan.activeFrontConstraint.front} remains ${plan.activeFrontConstraint.status}`
    );
  }

  if (Array.isArray(plan.blockedReasons) && plan.blockedReasons.length > 0) {
    lines.push('', 'Blocked reasons:', toBulletList(plan.blockedReasons));
  }

  lines.push('', `Stop condition: ${plan.stopCondition ?? 'n/a'}`);

  return lines.join('\n');
}

export function buildAgentRoute(root = process.cwd(), requestText = '') {
  const plan = buildAgentPlan(root, requestText);
  return {
    ...plan,
    requestText: String(requestText ?? '').trim(),
  };
}
