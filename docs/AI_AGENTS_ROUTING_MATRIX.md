# AI Agents Routing Matrix

Data de revisao: 2026-07-07

## Objetivo
Traduzir a estrutura operacional de agentes deste projeto para uso real, sem criar duplicidade de autoridade e sem ignorar a frente ativa.

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
3. `docs/DOCS_CLASSIFICATION.md`
4. `docs/README_DOCS_HIERARCHY.md`
5. `docs/EXECUTION_TRACKING.md`
6. `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
7. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
8. `docs/ARCHITECTURE.md`
9. `docs/CODEBASE_MAP.md`
10. `.agents/session-state.json`
11. `scripts/lib/agent-context.mjs`

Se houver conflito, a frente ativa e o plano mestre do projeto mandam no curto prazo.

Nota:
- a pasta `.ai-agents` nao faz parte da camada ativa deste repositorio
- se existir em outro workspace, ela pode servir como referencia externa, mas nao como autoridade local

## Leitura honesta do estado atual
Este projeto nao esta em fase livre para “envolver todos”.
O estado local em `.agents/session-state.json` indica:
- frente ativa em `FRONT_6_CONTINUITY_DIFFERENTIAL_AUDIT`
- W1-W8 tratados como historico processado; W7/W8 permanecem limitados as evidencias existentes
- dependencia de janela externa objetiva de homolog final e cutover
- `FRONT_5_REAL_PAYMENTS_CUTOVER` nao e a frente ativa e nao pode ser reaberta por atalho de ambiente

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

## Auditoria 360 de fluxo critico

Auditoria 360 e um tipo proprio de demanda e nao deve ser confundida com a frente ativa do projeto.

Quando a solicitacao combinar auditoria com termos do fluxo comercial critico (`catalogo`, `checkout`, `pedido`, `pagamento`, `webhook` ou `producao`), `npm run agents:route` deve retornar:
- `requestType= audit_360`;
- `routingMode= request_first`;
- `executionStatus= ROUTED_READ_ONLY`;
- a frente ativa como restricao, quando estiver bloqueada, sem substituir a missao da auditoria.

O resultado da auditoria deve separar:
- fato observado;
- hipotese;
- risco e impacto de negocio;
- recomendacao;
- mudanca ainda nao autorizada.

Cada achado precisa trazer evidencia de codigo/documentacao, severidade, confianca e proximo responsavel. Uma auditoria nao libera pagamento, nao muda contrato e nao abre frente nova por conta propria.

## Auditoria de coerencia estrutural

Auditoria de coerencia estrutural e um tipo proprio de demanda para organizar o projeto como sistema evolutivo. Ela nao substitui `audit_360` do fluxo comercial e nao deve ser roteada como continuidade comum.

Quando a solicitacao combinar sinais de coerencia, inconsistencia, fonte de verdade, base evolutiva ou organizacao estrutural com escopo amplo de arquitetura, dominio, dados, contratos, estados, persistencia, ambientes ou documentacao, `npm run agents:route` deve retornar:
- `requestType= coherence_audit`;
- `routingMode= request_first`;
- `executionStatus= ROUTED_READ_ONLY`;
- a frente ativa como restricao, quando estiver bloqueada.

O plano deve ser executado em fases:
1. baseline de autoridade;
2. runtime contra documentos;
3. limites de dominio e dados;
4. contratos e maquinas de estado;
5. persistencia por ambiente;
6. qualidade, operacao e documentacao.

O resultado deve separar auditoria de implementacao. Cada divergencia precisa registrar autoridade esperada, evidencia observada, incoerencia, impacto, decisao e criterio de aceite. Correcoes posteriores entram em tarefas menores, com handoff para a frente ativa e sem abrir uma segunda autoridade documental.

## Plano de execucao controlada

Pedidos que falem em plano pratico, chegar a 100% da funcionalidade, nao quebrar o projeto, eliminar duplicidade ou seguir boas praticas devem ser roteados como `execution_plan`. Eles nao devem iniciar implementacao automaticamente.

O retorno esperado e:
- `requestType= execution_plan`;
- `routingMode= request_first`;
- `executionStatus= PLANNED_CONTROLLED_EXECUTION`;
- a frente ativa e seus bloqueios preservados como restricao;
- ondas sequenciais com gate, evidencias, handoff, criterio de aceite e rollback.

Ordem oficial das ondas:
1. `W0`: baseline, fontes de verdade e bloqueios;
2. `W1`: identidade, sessao, acesso e ownership;
3. `W2`: catalogo, cotacao e pedido;
4. `W3`: pagamento, webhook e reconciliacao;
5. `W4`: producao, envio e suporte;
6. `W5`: admin, operacao e indicadores;
7. `W6`: ambientes, QA, observabilidade e entrega;
8. `W7`: classificacao diferencial do legado, sem reabrir W1-W6;
9. `W8`: preparacao de promocao externa, sem afirmar homologacao PASS.

Uma onda so pode ser encerrada quando houver, no minimo, contrato validado, persistencia explicita, maquina de estados alinhada ao runtime, regressao do risco principal e rollback conhecido. Auditoria, plano e implementacao continuam sendo fases diferentes.

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
- `npm run agents:route -- "<pedido>"`: roteia uma demanda e recomenda agentes, skills e docs de autoridade
- `npm run agents:brief`: mostra o plano ativo atual dos agentes e a cadeia documental canonica
- `npm run agents:exec -- -- <comando>`: executa uma acao com briefing de agente na frente

## Conclusao
Os agentes deste projeto fazem sentido aqui, mas apenas como cadeia de responsabilidade.
Sem frente ativa clara, contexto valido e gate de continuidade, eles viram encenacao.
