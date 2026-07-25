# Next Session Trigger

Data de revisao: 2026-07-25

## Objetivo
Retomar por `FRONT_1_COMMUNITY_CAMPAIGNS`, mantendo W1-W8 como historico processado e sem reabrir pagamentos ou expandir campanhas alem do runtime `PARCIAL` provado.

## Gatilho canonico de retomada
Toda nova sessao deve comecar por este gatilho, nesta ordem:
1. Ler `docs/ACTIVE_FRONT.md`.
2. Ler `docs/NEXT_SESSION_TRIGGER.md`.
3. Ler `docs/EXECUTION_TRACKING.md`.
4. Ler `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`.
5. Confirmar verbalmente ou internamente:
   - onde o trabalho parou;
   - o que ja foi provado;
   - qual e a frente unica ativa;
   - qual e o proximo passo exato;
   - qual e a condicao de pivot para evitar loop;
   - se W7 e W8 estao sendo tratados como historico com metadados suficientes, sem inventar detalhes.
6. So depois executar.

## Prompt curto para colar amanha
Use este prompt literalmente ou com ajuste minimo:

`Retome FRONT_1_COMMUNITY_CAMPAIGNS a partir de docs/ACTIVE_FRONT.md, docs/NEXT_SESSION_TRIGGER.md, docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md, docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md e .agents/session-state.json. Trate campanhas como PARCIAL, nao reabra pagamentos e nao inicie Organization, reward financeiro proprio ou rota paralela.`

## Checklist anti-retrabalho
Antes de qualquer patch, a retomada precisa responder `SIM` para tudo abaixo:
- estou partindo da frente ativa registrada, e nao de memoria parcial;
- nao vou reabrir frente ja provada sem evidencia nova;
- nao vou criar documento paralelo para decidir o que os documentos ativos ja decidem;
- nao vou insistir no mesmo runner se ele repetir o mesmo bloqueio sem aprendizado novo;
- consigo dizer em uma linha qual e o proximo passo exato desta sessao.

Se qualquer item acima for `NAO`, parar e corrigir a leitura antes de implementar.

## Protocolo de continuidade operacional
- `docs/ACTIVE_FRONT.md` passa a ser a memoria operacional canonica da frente em aberto.
- `.agents/session-state.json` espelha o mesmo estado em formato legivel por maquina.
- `docs/EXECUTION_TRACKING.md` continua como snapshot macro e ponte para historico.
- Se a sessao encerrar com bloqueio, registrar o bloqueio em `docs/ACTIVE_FRONT.md` e `.agents/session-state.json` antes de parar.

## Regra de retomada obrigatoria
1. Ler antes de agir:
   - `docs/ACTIVE_FRONT.md`
   - `docs/NEXT_SESSION_TRIGGER.md`
   - `docs/EXECUTION_TRACKING.md`
   - `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
   - `.agents/session-state.json`
   - `docs/ROUTES.md`
   - `docs/JOURNEY_MATRIX_BY_ROLE.md`
   - `docs/CODEBASE_MAP.md`
2. Tratar como ja fechado:
   - RBAC tipado consolidado
   - namespaces canonicos por papel
   - dashboards sem links para rota bloqueada
   - `impact-reviews` com leitura cross-role e decisao restrita
   - gate serial `qa:base:roles`
3. Nao aceitar atalho:
   - nao usar header fallback para validar fluxo sensivel se o runtime exigir sessao real
   - nao criar rota nova para contornar guard existente
   - nao reexportar pagina de outro papel para fingir jornada propria
   - nao insistir no mesmo runner local quando ele repetir o mesmo bloqueio sem aprendizado novo; registrar o limite em `docs/ACTIVE_FRONT.md` e pivotar para a proxima frente serial resolvivel
4. Sempre provar antes de encerrar:
   - `npm run check`
   - `npm run build` quando houver impacto estrutural
   - `npm run qa:base:roles` para mudanca em rota, RBAC, jornada ou superficie cross-role

## Estado consolidado no fim deste ciclo
- Base estrutural atual: `ESTAVEL NO RECORTE`
- `check`: `PASS`
- `build`: `PASS`
- `qa:role:journeys`: `PASS`
- `qa:base:roles`: `PASS`
- `qa:campaign:impact`: `PASS`
- `qa:campaign:detail`: `PASS`
- `qa:community:revenue`: `PASS`
- `qa:campaign:public`: `PASS`
- `p3:precheck`: `BLOCKED_EXTERNAL_BASE_URL` quando `HML_BASE_URL=http://localhost:3000`
- `p3:plug`: `BLOCKED_EXTERNAL_BASE_URL` em dry-run quando a base ainda e local
- `go:preflight`: `BLOCKED_EXTERNAL_BASE_URL` em dry-run quando a base ainda e local
- `go:e2e:proof`: `BLOCKED_EXTERNAL_BASE_URL` em dry-run quando a base ainda e local

## Evidencia adicional deste ciclo
- `qa:routes`: `PASS`
- `qa:blindspots`: `PASS`
- `qa:campaign:impact`: `PASS`
- `qa:campaign:detail`: `PASS`
- `qa:community-curation`: `PASS`
- `qa:community:revenue`: `PASS`
- `qa:catalog:curation`: `PASS`
- `qa:affiliate:referral`: `PASS`
- `ops:campaign:public`: `PASS`
- `qa:role:closure`: `PASS`
- `qa:coreops`: `PASS`
- `qa:crossrole:impact`: `PASS`
- `qa:matrix:audit`: `PASS`
- `qa:affiliate:referral` em `QA_SERVER_MODE=dev`: `PASS`
- `qa:role:closure` em `QA_SERVER_MODE=dev`: `PASS` quando a execucao respeita `PAYOUT_SECURITY_WINDOW_DAYS=0` e `AUTH_SESSION_SECRET=qa-local-session-secret`
- `utf8:check`: `PASS`
- smoke local em `next dev` para `/artista/lucas-santana`, `/category/autoral`, `/help-center` e `/quem-somos`: `PASS`
- smoke local em `next start` para `/`, `/journal` e `/register`: `PASS`

## Regra anti-loop
- Se a mesma prova local falhar ou for interrompida duas vezes sem produzir evidencia nova, isso deixa de ser tarefa ativa e vira limitacao de ambiente.
- A sessao deve registrar esse limite em `docs/ACTIVE_FRONT.md` e `.agents/session-state.json`, depois seguir para outra frente serial valida.

## Contrato minimo da proxima sessao
A proxima sessao so esta autorizada a:
1. preparar ou executar somente `FRONT_1_COMMUNITY_CAMPAIGNS` dentro do perimetro `PARCIAL` e dos gates documentados; ou
2. manter o trabalho parado se a solicitacao tentar reabrir W1-W8, iniciar pagamento real sem dependencia externa comprovada ou expandir campanhas para Organization, membership madura, reward financeiro proprio ou rota paralela.

Qualquer outra abertura de escopo conta como desvio e deve ser recusada antes do primeiro patch.

## Verdades que nao devem ser reabertas sem evidencia nova
- `lib/access-control.ts` e a autoridade canonica de permissao de runtime.
- `lib/role-routing/access-routing.ts` decide superficie e redirect, nao regra de negocio.
- `/admin/impact-reviews` continua superficie cross-role de governanca.
- Leitura cross-role nao implica poder de aprovar ou rejeitar.
- Redirect legado e compatibilidade externa, nao superficie interna viva.
- Falha em runner paralelo nao vale como regressao se a malha serial passar.
- `spawn EPERM` em `next build` dentro de sandbox Windows nao vale como regressao se `build` e `qa:base:roles` passarem fora do sandbox no mesmo working tree.
- Em Windows sandboxado, uma rota nova pode exigir `QA_SERVER_MODE=dev` para QA especifica quando `start` estiver reusando build antigo sem o patch atual.
- Divergencia entre execucao manual e gate oficial so vale como sinal tecnico quando as mesmas envs do gate estiverem presentes.
- `/community/campaigns/[id]` e `GET /api/campaigns/[id]` agora sao a memoria operacional canonica da campanha, inclusive para leitura por governanca.
- `/api/commissions/me/campaigns` e a secao nova de `/community/revenue` mostram atribuicao real por campanha, nao payout isolado por campanha.
- Curadoria de `artwork` nao pula mais de `submitted` direto para decisao final; a etapa `under_review` passou a ser contrato real do runtime.
- A cadeia `artwork aprovado -> CatalogItem pending_review -> impact review -> ready -> published` passou a ter prova ativa; nao voltar a tratar bootstrap seed como unica evidencia valida do dominio.
- `artist`, `community_manager` e `affiliate` deixaram de ser papeis parcialmente cenograficos: agora fecham atribuicao real ate pedido, ledger ou conversao conforme seu escopo.
- Afiliacao deixou de ser tela estatica: `/affiliate`, `/affiliate/links`, `/api/affiliate/links`, `/af/[slug]` e o snapshot de pedido agora sustentam link, clique e conversao reais, mas sem ledger de rewards.
- O snapshot contextualizado da Fase 2 deixou de congelar so ids e metadados soltos: quando a compra nasce de campanha ativa, ele ja preserva `campaignName`, a regra vigente e a composicao formal de preco com `movementMarkup` + `priceCompositionVersion`.
- `CampaignProduct` deixou de ser capacidade imaginada: `/api/campaigns/[id]/products`, `/community/campaigns`, `/c/[campaignId]` e o checkout agora respeitam vinculo real entre campanha ativa e `CatalogItem` publicado.
- Rejeicao de `impact review` em `Campaign` nao deixa mais campanha travada em `pending_review`: o runtime devolve para `rejected`, preserva `decisionReason` em `/api/campaigns` e `/community/campaigns` passou a mostrar essa devolutiva ao owner.
- `/admin/impact-reviews` passou a sustentar um recorte proprio de campanhas com historico e contexto de runtime; `platform_admin` aprova/rejeita a `impact review` ali e `curator/platform_admin` conseguem concluir a moderacao final da campanha sem abrir dominio novo de `Organization`.
- `/` e `/category/[slug]` deixaram de se apoiar em cards estaticos para vender: agora refletem o catalogo publicado real que alimenta `/shop`.
- Home, help center, login, cadastro publico, footer, menu mobile, CTA de produto, `/returns`, `/policies` e `/quem-somos` deixaram de prometer personalizacao self-service, portal autonomo de troca, login social inexistente, canais externos ou contatos oficiais que o runtime nao sustenta hoje.
- `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` deixou de tratar `/@username*` e `/affiliate/rewards` como mapa pratico de continuidade; essas superficies seguem planejadas e nao podem ser presumidas no runtime atual.

## Proxima frente permitida
`FRONT_1_COMMUNITY_CAMPAIGNS` e a frente serial ativa. `real-payments-cutover` continua condicionado a janela externa objetiva e nao pode ser retomado por esta transicao.

Leitura operacional deste momento:
- `affiliate-referral` fechou o recorte novo.
- `catalogo-curadoria/artwork` fechou o recorte validado nesta sessao.
- `superficies publicas` fechou o recorte ativo com saneamento de `artista`, `category`, `help-center`, `quem-somos`, `journal`, `register` e `footer`.
- W1-W8 sao historico processado para fins de continuidade; W7/W8 nao autorizam afirmar homologacao externa.
- `FRONT_6_CONTINUITY_DIFFERENTIAL_AUDIT` foi concluida: documentos, espelho operacional e roteador concordam, e caches locais nao participam da autoridade.
- a frente ativa agora e `FRONT_1_COMMUNITY_CAMPAIGNS`.
- `real-payments-cutover` permanece dependencia externa bloqueada e nao deve ser reaberta como frente atual.
- `npm run qa:campaign:authority` passou em MySQL QA local isolado, com schema `001`/`002`, provando persistencia de `Campaign` e `CampaignProduct` apos reinicio sem fallback dos dados locais obsoletos; os caches locais de campanha foram restaurados ao fim do gate.
- Essa evidencia cobre autoridade e persistencia, nao promove `Campaign` ou `CampaignProduct` alem de `PARCIAL` nem autoriza `CAMPAIGN_*_REPAIR`; T1 nao foi iniciado.
- Proximo gate candidato: `npm run qa:campaign:impact`, por cobrir apenas o ciclo de governanca de campanha sem pedido, checkout, pagamento ou webhook. Ele permanece bloqueado ate que `qa-api-runner` receba isolamento equivalente de `QA_DATABASE_URL` e do cache derivado.

## Sinais de desvio
Se qualquer um destes aparecer, parar e corrigir a direcao:
- dashboard apontando para rota que o proprio papel nao abre
- componente compartilhado disparando fetch proibido para papel valido
- teste passando com header fake onde producao exige cookie real
- docs ativos ensinando alias legado como se fosse canonicidade
- mudanca de negocio sendo resolvida dentro de `context/**` ou `hooks/**`

## Pergunta de controle no inicio da proxima sessao
Antes de implementar, responder internamente:
`A mudanca proposta respeita a base canonica atual ou esta reintroduzindo ambiguidade de rota, permissao, jornada ou ownership?`

Se a resposta nao for claramente a primeira, nao avancar direto.
