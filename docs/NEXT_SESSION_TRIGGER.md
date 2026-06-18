# Next Session Trigger

Data de revisao: 2026-06-18

## Objetivo
Retomar a execucao exatamente pela mesma logica de saneamento e evolucao validada neste ciclo, sem reabrir decisoes fechadas e sem misturar escopo novo com base ja consolidada.

## Prompt curto para colar amanha
Use este prompt literalmente ou com ajuste minimo:

`Retome a execucao a partir de docs/NEXT_SESSION_TRIGGER.md e docs/EXECUTION_TRACKING.md. Preserve a logica ja validada: seguranca antes de UI, namespace canonico como verdade interna, RBAC em lib/access-control.ts como autoridade, smoke autenticado por papel como prova real, e qa:base:roles como gate obrigatorio antes de liberar mudanca. Nao reabra escopo ja fechado; avance apenas na proxima frente permitida e me avise se algum passo violar essa disciplina.`

## Regra de retomada obrigatoria
1. Ler antes de agir:
   - `docs/NEXT_SESSION_TRIGGER.md`
   - `docs/EXECUTION_TRACKING.md`
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

## Verdades que nao devem ser reabertas sem evidencia nova
- `lib/access-control.ts` e a autoridade canonica de permissao de runtime.
- `lib/role-routing/access-routing.ts` decide superficie e redirect, nao regra de negocio.
- `/admin/impact-reviews` continua superficie cross-role de governanca.
- Leitura cross-role nao implica poder de aprovar ou rejeitar.
- Redirect legado e compatibilidade externa, nao superficie interna viva.
- Falha em runner paralelo nao vale como regressao se a malha serial passar.
- `spawn EPERM` em `next build` dentro de sandbox Windows nao vale como regressao se `build` e `qa:base:roles` passarem fora do sandbox no mesmo working tree.
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
Escolher apenas uma por vez:
- limpar historico documental ainda ativo que possa induzir leitura errada do runtime atual
- atacar um dominio ainda `PARCIAL` sem reabrir a coerencia ja fechada dos papeis
- fechar a proxima lacuna objetiva de Fase 2 sem fingir payout financeiro proprio de afiliado ou dominio maduro de `Organization`
- remover novo ponto de ambiguidade estrutural se ele aparecer em rota, guard, jornada, QA ou copy publica com promessa sem runtime

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
