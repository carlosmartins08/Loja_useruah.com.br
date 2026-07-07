# AI Agents Routing Matrix

Data de revisao: 2026-07-07

## Objetivo
Traduzir a estrutura de agentes definida em `.ai-agents` para uso real neste projeto, sem criar duplicidade de autoridade e sem ignorar a frente ativa.

## Regra central
Agente nao e enfeite de governanca.
Agente existe para assumir responsabilidade clara em uma fase clara, com entrada, saida, limite e escalonamento definidos.

## Modo ativo de trabalho
Os agentes deste projeto nao entram para observar.
Eles entram para:
- assumir uma fase
- produzir um artefato verificavel
- registrar o que foi decidido
- liberar o proximo passo
- parar quando houver bloqueio real

Regra pratica:
- se o agente nao muda o estado do trabalho, ele nao trabalhou
- se o agente so comenta sem entregar, ele nao fechou a responsabilidade
- se o agente encontra bloqueio, ele registra e escala em vez de improvisar

## Fonte de verdade
Ordem de precedencia para este projeto:
1. `docs/ACTIVE_FRONT.md`
2. `docs/NEXT_SESSION_TRIGGER.md`
3. `docs/EXECUTION_TRACKING.md`
4. `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
5. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
6. `docs/ARCHITECTURE.md`
7. `docs/CODEBASE_MAP.md`
8. `.ai-agents/architecture/ARCHITECTURE.md`
9. `.ai-agents/registry/AGENT_REGISTRY.md`
10. `.ai-agents/runtime/AGENTOS_RUNTIME_V1.md`

Se houver conflito, a frente ativa e o plano mestre do projeto mandam no curto prazo.

## Leitura honesta do estado atual
Este projeto nao esta em fase livre para “envolver todos”.
O estado local em `.agents/session-state.json` indica:
- frente ativa bloqueada em `FRONT_5_REAL_PAYMENTS_CUTOVER`
- dependencia de janela externa objetiva de homolog final e cutover
- proibicao de reabrir essa frente por atalho de ambiente

Conclusao pratica:
- agentes devem ser usados para continuidade e organizacao
- nao para forcar uma frente bloqueada

## Matriz de roteamento por fase

| Fase | Agente primario | Agentes de apoio | O que produz | Quando para |
|---|---|---|---|---|
| Recepcao e continuidade | `Executive Orchestrator` | `Project Brain`, `Governance Guardian` | triagem, dono, risco, contexto | escopo vago, conflito, falta de contexto |
| Discovery | `Chief Product Strategist` | `Business Analyst`, `Project Brain` | direcao de produto, hipoteses, problema real | problema nao validado |
| Analise e priorizacao | `Chief Product Strategist` | `Business Analyst`, `Governance Guardian` | prioridade, trade-offs, risco | prioridade sem base ou conflito com memoria |
| Requisitos | `Requirements Engineer` | `Business Analyst`, `Chief Product Strategist` | requisitos, criterios de aceite, rastreabilidade | ambiguidade ou base insuficiente |
| Dominio | `Domain Architect` | `Requirements Engineer`, `Project Brain` | modelo conceitual, regras, limites | dominio inconsistente |
| Jornada | `Journey Architect` | `Domain Architect`, `Requirements Engineer` | atores, eventos, estados, handoffs | jornada conflita com dominio |
| Arquitetura tecnica | `Solution Architecture Lead` | `Chief Engineering Architect`, `ARB` | arquitetura consumivel, contratos, dependencias | desenho nao consumivel ou risco estrutural |
| Execucao tecnica | `Chief Engineering Architect` | engenharia do office, `Quality Office` | implementacao, integracao, ajustes | requisito ou contrato insuficiente |
| Validacao | `Quality Office` | `Governance Guardian`, `ARB` | teste, regressao, parecer | falha, risco ou quebra de conformidade |
| Entrega e memoria | `Executive Orchestrator` | `Project Brain`, `Governance Guardian` | encerramento, registro, aprendizado | falta de evidencias ou pendencia aberta |

## Como envolver os agentes do jeito certo

### 1. Nao acionar todos ao mesmo tempo
O fluxo certo e sequencial.  
Quem entra cedo demais vira ruído. Quem entra tarde demais vira retrabalho.

### 1.1 O agente precisa gerar movimento
Cada agente acionado precisa responder com pelo menos uma destas saidas:
- decisao
- registro
- artefato
- bloqueio formal
- proximo passo exato

Se a resposta nao altera o estado do projeto, ela e decorativa.

### 2. Cada agente precisa de um artefato de entrada
- `Executive Orchestrator` recebe intake note e contexto minimo
- `Chief Product Strategist` recebe objetivo e problema candidato
- `Business Analyst` recebe demanda bruta e contexto
- `Requirements Engineer` recebe discovery validado
- `Domain Architect` recebe requisitos estruturados
- `Journey Architect` recebe modelo de dominio
- `Solution Architecture Lead` recebe dominio + jornada + requisitos
- `Chief Engineering Architect` recebe arquitetura tecnica
- `Quality Office` recebe build e criterios
- `Project Brain` recebe decisao aprovada, conflito ou aprendizado

### 3. Cada agente precisa devolver algo verificavel
Se o retorno nao pode ser auditado, ele nao fechou a fase.

## Estrutura de uso por tipo de demanda

### Demandas de continuidade e retomada
Usar:
- `Executive Orchestrator`
- `Project Brain`
- `project-continuity-governance-guardian`

Nao usar:
- `Chief Product Strategist` antes de entender o estado atual
- `Requirements Engineer` antes do problema estar claro

### Demandas de produto
Usar:
- `Chief Product Strategist`
- `Business Analyst`
- `Requirements Engineer`
- `Project Brain`

### Demandas de dominio e jornada
Usar:
- `Domain Architect`
- `Journey Architect`
- `Requirements Engineer`
- `Project Brain`

### Demandas de arquitetura e engenharia
Usar:
- `Solution Architecture Lead`
- `Chief Engineering Architect`
- `Governance Guardian`
- `ARB` quando houver risco estrutural

### Demandas de validacao e entrega
Usar:
- `Quality Office`
- `Governance Guardian`
- `Executive Orchestrator`
- `Project Brain`

## O que nao fazer
- nao criar agente novo so porque falta clareza de escopo
- nao pular discovery e chamar engenharia direto
- nao usar `.ai-agents` como substituto do estado real do projeto
- nao tratar memoria como opiniao
- nao reabrir `FRONT_5_REAL_PAYMENTS_CUTOVER` sem janela externa objetiva
- nao transformar rotulo de agente em poder real

## Handoff minimo entre agentes

```json
{
  "owner": "",
  "objective": "",
  "current_state": "",
  "input_artifact": "",
  "output_artifact": "",
  "risks": [],
  "blocked_by": [],
  "next_agent": "",
  "decision_record": ""
}
```

## Regra pratica para este projeto
Se a frente ativa estiver bloqueada, o trabalho do sistema e:
1. confirmar a trava
2. manter memoria limpa
3. evitar retrabalho
4. preparar a proxima janela valida
5. nao forcar execucao artificial
6. manter os agentes em rotacao util, nao em espera passiva

## Comandos praticos
- `npm run agents:route -- "<pedido>"`: roteia uma demanda e recomenda agentes + skills do catalogo
- `npm run agents:brief`: mostra o plano ativo atual dos agentes
- `npm run agents:exec -- -- <comando>`: executa uma acao com briefing de agente na frente

## Conclusao
Os agentes da `.ai-agents` fazem sentido aqui, mas apenas como cadeia de responsabilidade.
Sem frente ativa clara, contexto valido e gate de continuidade, eles viram encenacao.
