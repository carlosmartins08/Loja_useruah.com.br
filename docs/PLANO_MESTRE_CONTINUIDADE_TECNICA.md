# Plano Mestre de Continuidade Tecnica

Data de revisao: 2026-06-20
Owner: Produto + Engenharia

## Objetivo
Definir um quadro unico de continuidade para o projeto evoluir sem reabrir fase, sem duplicar dominio e sem tratar documento aspiracional como realidade do runtime.

## Regra de precedencia
- Este documento nao redefine fase de produto.
- Escopo oficial da fase atual continua em `docs/FASE_1_VENDA_DE_PRODUTO.md`.
- Maturidade real continua em `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`.
- `docs/EXECUTION_TRACKING.md` entra apenas como snapshot ativo e evidencia recente do ciclo.
- Pagamento real continua na trilha transversal `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`.

## Quadro unico de continuidade

### Agora
- Fase 1 comercial: `IMPLEMENTADO` em ambiente controlado.
- Fase 1 funcional: fechada.
- `auth/session`: liberado com `qa:auth:cookie: PASS`.
- Pagamento real Stripe: `GO CONDICIONADO`.
- Condicionante atual da Stripe:
  - nao e auth
  - nao e credencial
  - nao e provider no recorte homologado
  - e aceite final de producao e readiness operacional real
- Evidencias da trilha Stripe homologada:
  - `npm run p3:precheck`: PASS
  - `npm run qa:stripe:smoke`: PASS
  - `npm run qa:provider:activate`: PASS
  - `npm run check`: PASS
  - `npm run build`: PASS
  - `npm run qa:functional`: PASS
- `gateway_real` generico: `PLANEJADO` como bridge futura.
- `pix`: fora do recorte imediato.
- Fase 2: aberta apenas para endurecimento serial de dominios `PARCIAL` ja provados no runtime.
- Fase 3: continua fechada como frente autonoma; so cabe hardening pontual do fluxo `artwork -> catalogo` quando ele ja estiver acoplado ao runtime atual e nao abrir produto paralelo.

### Agora, antes do aceite final de producao Stripe
- Registrar e executar apenas 1 frente por vez.
- Atacar somente dominios `PARCIAL` que ja tenham prova runtime e gate claro.
- Tratar pagamento real como trilha bloqueada por dependencia externa, nao como motivo para misturar frentes internas.

### Depois do aceite final de producao Stripe
- Registrar evidencia operacional e manter a Fase 1 como baseline vendavel.
- Continuar abrindo no maximo 1 recorte de evolucao por vez.
- Promover para `IMPLEMENTADO` apenas o que subir de maturidade na matriz com prova nova.

### O que continua proibido
- criar produto paralelo ao `CatalogItem`
- criar checkout paralelo
- criar `Order`, `Payment` ou `Cart` paralelos
- abrir Fase 3 como frente principal antes de consolidar o que a Fase 2 realmente tem
- tratar `Organization`, username publico, reward financeiro proprio de afiliado ou snapshot alem do contrato parcial atual como base pronta
- mexer em codigo para compensar ambiente Stripe incompleto
- reabrir documentacao sem evidencia nova

## Sequencia oficial de continuidade

### Etapa 1 - Stripe
Executar somente quando as credenciais Stripe de homologacao existirem no ambiente seguro:

```text
npm run p3:precheck
npm run qa:stripe:smoke
npm run qa:provider:activate
npm run check
npm run build
npm run qa:functional
```

Saida permitida:
- `GO`
- `GO CONDICIONADO`
- `NO-GO`

Regra:
- sem credenciais validas, o codigo continua congelado

### Etapa 2 - Baseline
Se a Etapa 1 terminar em `GO` ou `GO CONDICIONADO` sem risco de regressao de fluxo:
- atualizar `docs/EXECUTION_TRACKING.md` com evidencia recente do ciclo
- atualizar `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` se a maturidade real subir
- registrar decisao em `docs/CHANGELOG_GOVERNANCE.md`
- distinguir explicitamente:
  - Fase 1 funcional fechada
  - Fase 1 producao ainda condicionada ate aceite final de producao

### Etapa 3 - Frentes internas serializadas
Enquanto a janela real da Stripe nao abre, a execucao interna so pode seguir se todas as condicoes abaixo forem verdadeiras:
- Fase 1 continua preservada
- o recorte cabe em 1 unico dominio
- a matriz marca a capacidade como `PARCIAL` ou `IMPLEMENTADO`
- nenhuma dependencia `NAO PRESUMIR` esta sendo tratada como pronta
- o gate de prova da frente esta definido antes do patch

Sequencia obrigatoria:
1. `community-campaigns`
2. `affiliate-referral`
3. `catalogo-curadoria/artwork` apenas como hardening acoplado ao runtime atual
4. `superficies publicas` com criterio de honestidade de runtime
5. `real-payments-cutover` quando a janela externa existir

## Regra de escolha do proximo recorte
Pergunta obrigatoria:

```text
o proximo passo depende de capacidade IMPLEMENTADA ou PARCIAL validada?
```

Se a resposta for `nao`, o recorte nao abre.

## Melhor proximo recorte agora
Pelo estado atual das docs e do runtime:
- a frente correta imediata e `community-campaigns`
- a segunda frente correta e `affiliate-referral`
- `catalogo-curadoria/artwork` entra depois como endurecimento do fluxo real ja conectado ao catalogo publicado
- qualquer expansao para `Organization`, `/@username`, reward financeiro proprio de afiliado ou supplier completo deve esperar prova runtime ou decisao nova de produto

## Checklist anti-retrabalho
- usar `docs/FASE_1_VENDA_DE_PRODUTO.md` para escopo da base vendavel
- usar `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` para proibicoes estruturais da Fase 2
- usar `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md` para proibicoes estruturais da Fase 3
- usar `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` antes de promover qualquer capacidade como base pronta
- usar `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md` para tudo que for pagamento real

## Regra final
O projeto so continua de forma coerente se cada frente provar a anterior e se a serializacao for respeitada.

Sem prova da frente atual:
- nao se abre a seguinte.

Sem janela Stripe:
- nao existe `GO` honesto de pagamento real, mas ainda existe endurecimento interno honesto dos dominios `PARCIAL` ja provados.

Sem base Fase 2 realmente validada:
- nao existe Fase 3 honesta como expansao autonoma.
