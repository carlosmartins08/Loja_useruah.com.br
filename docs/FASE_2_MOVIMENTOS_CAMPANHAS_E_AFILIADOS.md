# Fase 2 - Movimentos, Campanhas e Afiliados

Data de revisao: 2026-06-20

## Objetivo
Definir o escopo funcional oficial da Fase 2 sobre a venda ja provada na Fase 1, sem fazer o texto parecer mais maduro do que o runtime atual.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` continua mandando na Fase 1.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` define a regra estrutural da passagem.
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` define o que pode ser tratado como `IMPLEMENTADO`, `PARCIAL`, `PLANEJADO`, `AUSENTE`, `NAO PRESUMIR` ou `BLOQUEADO`.
- `docs/EXECUTION_TRACKING.md` registra apenas snapshot ativo e evidencias recentes do ciclo.
- Este documento define o escopo funcional oficial da Fase 2.

## Regra central
Fase 1 vende.
Fase 2 contextualiza.
Nada e duplicado.
Tudo preserva o fluxo base de compra.

Leitura obrigatoria:
- escopo de fase nao equivale a implementacao comprovada;
- quando runtime e documento divergirem, prevalece a matriz; o tracking entra apenas como evidencia recente.

## Proibicoes estruturais
A Fase 2 nao deve criar:
- novo `Product` paralelo
- novo checkout paralelo
- novo `Order` paralelo
- novo `Payment` paralelo
- novo carrinho paralelo

Produto de movimento deve ser tratado como:
- `CatalogItem + Organization + MovementCampaign`, quando houver

Pedido de movimento continua sendo:
- `Order + OrderItem + OrderItemSnapshot`

Checkout continua sendo:
- `/cart`
- `/checkout`

## Contexto adicional do snapshot da Fase 2
Campos ja comprovados no runtime atual quando a compra nasce de campanha ativa:
- `organizationId`
- `campaignId`
- `campaignName`
- `campaignProgressivePriceRule`
- `movementMarkup`
- `referralLinkId`
- `affiliateUserId`
- `priceCompositionVersion`

Campo ainda planejado, sem prova runtime ponta a ponta:
- `organizationUsername`

Estado atual reconhecido:
- o snapshot oficial continua preservando a base da Fase 1, mas ja captura contexto ampliado em `phase2-context-pricing-v1` quando a compra nasce de campanha ativa com composicao formal de preco;
- hoje o runtime ja consegue persistir todos os campos listados acima, exceto `organizationUsername`;
- `movementMarkup` e `priceCompositionVersion` agora representam a composicao real de preco validada em runtime para a campanha ativa, nao uma promessa vaga;
- `organizationUsername` continua fora e nao pode ser presumido.

## O que entra como escopo oficial da fase
- `MovementCampaign` basico: capacidade parcial no runtime atual
- `CampaignProduct` parcial no runtime atual: a campanha ja consegue vincular `CatalogItem` publicado, abrir `/c/[campaignId]` com vitrine filtrada em `/shop?campaignId=...` e fazer o checkout rejeitar item publicado fora desse recorte
- `Organization / Movement`: escopo previsto, ainda nao comprovado como dominio maduro
- username publico unico e vitrine `/@username`: escopo previsto, ainda nao comprovado ponta a ponta
- categorias internas de movimento: escopo previsto
- links rastreaveis e afiliacao: capacidade parcial no runtime atual para `ReferralLink`, clique publico em `/af/[slug]`, pausa/reativacao operacional do link, snapshot de pedido com `referralLinkId` e conversao registrada automaticamente; reward financeiro proprio segue fora
- arrecadacao e contexto comercial do movimento: escopo previsto, dependente de implementacao adicional

## O que fica fora
- supplier com painel proprio como frente primaria da fase
- supplier API visivel ao consumidor
- split financeiro completo em UI publica
- payout automatizado completo sem validacao financeira previa
- BI avancado e gamificacao pesada

## Regra de protecao
Qualquer implementacao da Fase 2 deve validar que a Fase 1 continua funcionando sem regressao.
