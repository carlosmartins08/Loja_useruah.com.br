# Active Front

Data de revisao: 2026-06-20
Branch: `feat/payments-gateway-cutover-checklist`
Responsavel atual: `Codex + usuario`
Status da frente: `FRONT_4_IN_PROGRESS`

## Objetivo atual
Executar um plano serial de resolucao sem criar documentacao nova, usando apenas os documentos ativos que ja governam o projeto e sem deixar a sessao travar em loop de prova local.

## Gatilho rapido de retomada
Se a sessao cair ou for retomada depois:
1. abrir `docs/NEXT_SESSION_TRIGGER.md` como ponto de entrada canonico;
2. confirmar `frente ativa`, `ultimo passo executado`, `evidencia` e `proximo passo exato`;
3. recusar qualquer desvio que pule essa leitura.

## Frente unica aberta
Frente atual selecionada:
- `FRONT_4_PUBLIC_SURFACES_HONESTY`

Motivo:
- `FRONT_2_AFFILIATE_REFERRAL` fechou o recorte novo com prova especifica e prova integrada.
- `FRONT_3_CATALOG_CURATION_HARDENING` tambem fechou o recorte atual com prova especifica em `community-curation` e `catalog:curation`, sem abrir Fase 3 autonoma.
- a proxima lacuna pratica agora e evitar que novas paginas publicas voltem a prometer runtime inexistente.

Recorte atual em execucao:
- auditar superficies publicas restantes com criterio de honestidade de runtime, sem reintroduzir CTA, copy ou caminho cenografico.

## Plano serial de execucao
1. `FRONT_1_COMMUNITY_CAMPAIGNS`
Problema real: campanhas e governanca ja funcionam, mas ainda nao devem ser tratadas como dominio fechado.
Usuarios/roles: `community_manager`, `curator`, `platform_admin`.
Fonte autoritativa: `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`.
Gate de saida: `npm run qa:campaign:impact`, `npm run qa:campaign:detail`, `npm run qa:community:revenue` e `npm run qa:base:roles`.
Nao tocar: `Organization` madura, reward financeiro de afiliado, rotas novas por fora dos namespaces canonicos.

2. `FRONT_2_AFFILIATE_REFERRAL`
Problema real: atribuicao existe, mas o dominio ainda corre risco de ser lido como payout proprio.
Usuarios/roles: `affiliate`, `platform_admin`.
Fonte autoritativa: `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`.
Gate de saida: `npm run qa:affiliate:referral` e `npm run qa:role:closure`.
Nao tocar: `affiliate/rewards`, saldo sacavel proprio, ledger financeiro novo.

3. `FRONT_3_CATALOG_CURATION_HARDENING`
Problema real: `artwork` e `catalogo-curadoria` ainda estao `PARCIAL`, apesar de ja sustentarem o fluxo publicado atual.
Usuarios/roles: `artist`, `curator`, `platform_admin`.
Fonte autoritativa: `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`, `docs/EXECUTION_TRACKING.md`.
Gate de saida: `npm run qa:community-curation`, `npm run qa:catalog:curation` e `npm run qa:role:closure`.
Nao tocar: produto paralelo, checkout paralelo, expansao autonoma de Fase 3.

4. `FRONT_4_PUBLIC_SURFACES_HONESTY`
Problema real: ainda pode existir copy, CTA ou pagina publica prometendo runtime que nao existe.
Usuarios/roles: `visitor`, `customer`.
Fonte autoritativa: `docs/FASE_1_VENDA_DE_PRODUTO.md`, `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/ROUTES.md`.
Gate de saida: `npm run check`, `npm run build` quando houver impacto estrutural, e smoke dirigido das paginas tocadas.
Nao tocar: regra de negocio em `context/**` ou `hooks/**`, login social, portal autonomo ficticio, namespace novo.

5. `FRONT_5_REAL_PAYMENTS_CUTOVER`
Problema real: pagamento real segue `GO CONDICIONADO` por dependencia externa de homolog final e cutover.
Usuarios/roles: `finance_admin`, `platform_admin`, `customer`.
Fonte autoritativa: `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`, `docs/PAYMENTS_DEFINITION_OF_DONE.md`.
Gate de saida: `npm run p3:precheck`, `npm run qa:stripe:smoke`, `npm run qa:payments21`, `npm run qa:provider:activate`, `npm run qa:functional`, `npm run qa:coreops`, `npm run qa:matrix:audit` e evidencia da janela real.
Nao tocar: redesign de checkout, fase nova de produto, workaround de ambiente travestido de feature.

## Regra de passagem entre frentes
- So avancar para a proxima frente quando a atual terminar em `IMPLEMENTADO`, `PARCIAL` conscientemente limitado ou `BLOQUEADO` por dependencia externa objetiva.
- Nao abrir duas frentes no mesmo patch.
- Se surgir conflito entre frente atual e documento fonte, corrigir o documento fonte no mesmo ciclo ou parar.
- Se a mesma prova local repetir o mesmo bloqueio duas vezes sem aprendizado novo, registrar a limitacao e pivotar de forma consciente em vez de prolongar o loop.

## Ja concluido
- Base estrutural do ciclo anterior estabilizada no recorte ativo.
- `RBAC`, namespaces canonicos por papel e `qa:base:roles` tratados como verdades fechadas.
- Campanha publica, detalhe operacional de campanha, receita por campanha e referral com prova ativa em QA.
- `scripts/qa/qa-api-runner.mjs` endurecido para falhar de forma honesta no Windows sandbox em vez de fabricar falso negativo por `npm.cmd` ou `next build`.
- `docs/NEXT_SESSION_TRIGGER.md` e `docs/EXECUTION_TRACKING.md` consolidados como memoria macro do ciclo anterior.
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`, `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md` e `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` alinhados ao runtime parcial real da Fase 2.
- `npm run check` revalidado em `2026-06-20` com `PASS`.
- Plano serial de execucao consolidado sem criar documento novo.
- `/community/campaigns/[id]` passou a traduzir readiness em proximo passo e expor acoes coerentes por papel e estado, reutilizando `submit`, `approve`, `pause` e `close`.
- `/affiliate/links` e `ReferralLink` agora sustentam pausa e reativacao reais, sem inventar reward, payout ou ledger novo.
- `qa:affiliate:referral` passou em `QA_SERVER_MODE=dev` em `2026-06-20`, provando pausa, fallback publico sem atribuicao, reativacao, clique persistido e conversao idempotente.
- `qa:role:closure` passou em `QA_SERVER_MODE=dev` em `2026-06-20`, provando tambem a integracao `artist + community + affiliate` no fechamento da trilha.
- `qa:community-curation` passou em `QA_SERVER_MODE=dev` em `2026-06-20`, provando ownership, autenticacao, escopo autoral e transicao `submitted -> under_review -> approved`.
- `qa:catalog:curation` passou em `QA_SERVER_MODE=dev` em `2026-06-20`, provando `artwork aprovado -> CatalogItem pending_review -> impact review -> ready -> published -> vitrine publica`.
- `app/artista/[slug]/page.tsx` deixou de prometer portfolio completo por artista e passou a enquadrar a rota como contexto editorial honesto do catalogo publicado.
- `app/category/[slug]/page.tsx` deixou de simular portfolio individual, filtro falso e load more cenografico; a pagina agora assume o recorte real do catalogo publicado.
- `app/help-center/page.tsx` trocou dois cards cenograficos por links reais para `policies` e `account/orders`.
- `app/quem-somos/page.tsx` deixou de expor copy publica corrompida e passou a declarar o estagio real do produto sem mojibake.
- `npm run utf8:check` revalidado em `2026-06-20` com `PASS`.
- smoke local em `next dev` para `/artista/lucas-santana`, `/category/autoral`, `/help-center` e `/quem-somos` revalidado em `2026-06-20` com `PASS`.

## Ultimo passo executado
Hardening de `FRONT_4_PUBLIC_SURFACES_HONESTY` nas paginas publicas com maior risco de promessa falsa ou texto quebrado: `artista`, `category`, `help-center` e `quem-somos`, seguido de `utf8:check`, `check` e smoke local dirigido.

## Bloqueio atual
Nao ha bloqueio tecnico imediato na frente atual.

O risco real agora mudou:
- quebrar a serializacao e atacar duas frentes ao mesmo tempo
- voltar a transformar plano de execucao em documento paralelo sem autoridade
- misturar pagamentos reais com frentes internas que nao dependem da janela externa
- promover dominio `PARCIAL` para `IMPLEMENTADO` sem prova nova
- voltar a tratar falha de ambiente ou execucao fora do contrato do gate como se fosse regressao do app

## Evidencia
- `npm run check`: `PASS` em `2026-06-20`
- `npm run utf8:check`: `PASS` em `2026-06-20`
- `qa:affiliate:referral` com `QA_SERVER_MODE=dev`: `PASS` em `2026-06-20`
- `qa:role:closure` com `QA_SERVER_MODE=dev`, `PAYOUT_SECURITY_WINDOW_DAYS=0` e `AUTH_SESSION_SECRET=qa-local-session-secret`: `PASS` em `2026-06-20`
- `qa:community-curation` com `QA_SERVER_MODE=dev`: `PASS` em `2026-06-20`
- `qa:catalog:curation` com `QA_SERVER_MODE=dev`: `PASS` em `2026-06-20`
- smoke local em `next dev`: `PASS` em `2026-06-20` para `/artista/lucas-santana`, `/category/autoral`, `/help-center` e `/quem-somos`
- `docs/NEXT_SESSION_TRIGGER.md`: ciclo anterior fechado com regra clara de retomada
- `docs/EXECUTION_TRACKING.md`: snapshot ativo revalidado com o saneamento documental do ciclo
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`: `CampaignProduct` e snapshot contextualizado agora aparecem como `PARCIAL` tambem no status documental
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` e `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md`: handoffs atualizados para nao bloquear leitura do runtime parcial real
- `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`: sequencia macro passa a refletir execucao serial das frentes abertas
- `app/community/campaigns/[id]/page.tsx`: detalhe de campanha agora mostra proximo passo coerente e acoes acionaveis por role/estado
- `app/api/affiliate/links/[id]/pause/route.ts` e `app/api/affiliate/links/[id]/activate/route.ts`: transicoes operacionais reais de `ReferralLink`
- `app/affiliate/links/page.tsx`: workspace do afiliado agora explicita e controla status ativo/pausado
- `scripts/qa/qa-affiliate-referral.mjs`: suite preparada e aprovada para o recorte novo

## Proximo passo exato
Continuar `FRONT_4_PUBLIC_SURFACES_HONESTY` sem expandir escopo:
1. fazer uma ultima varredura de baixo custo nas superficies publicas restantes para confirmar que o padrao de honestidade nao reapareceu fora do recorte ja tocado;
2. se nada novo surgir, promover formalmente a proxima frente serial para `FRONT_5_REAL_PAYMENTS_CUTOVER`;
3. se surgir mais uma superficie cenografica, tratar em patch isolado e encerrar `FRONT_4` no mesmo criterio de prova curta.

## Nao reabrir sem evidencia nova
- `lib/access-control.ts` como autoridade canonica de permissao
- namespaces canonicos por papel como unica referencia interna
- `qa:base:roles` como gate obrigatorio para rota, RBAC, jornada e superficie cross-role
- campanha publica, referral e leitura por campanha como provas fechadas do recorte atual
- `spawn EPERM/EINVAL` em sandbox Windows como ruido ambiental quando a malha serial ja passou fora do sandbox

## Regra de encerramento da sessao
Nenhuma sessao encerra sem atualizar:
- `docs/ACTIVE_FRONT.md`
- `docs/NEXT_SESSION_TRIGGER.md` se a regra de retomada mudar
- `.agents/session-state.json`
