# Plano Mestre de Continuidade Tecnica

Data de revisao: 2026-06-21
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
  - `npm run p3:precheck`: PASS apenas quando `HML_BASE_URL` apontar para a homolog final real
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

## Plano de execucao do levantamento atual

Objetivo:
- transformar o levantamento honesto do estado atual em plano executavel sem perder memoria operacional
- separar o que e bloqueio externo, o que e dominio parcial e o que e apenas proibicao de promessa
- impedir que a equipe trate estabilidade de nucleo como fechamento total do produto

Regra deste plano:
- este bloco nao autoriza abrir varias frentes ao mesmo tempo
- a frente ativa continua sendo a registrada em `docs/ACTIVE_FRONT.md`
- itens abaixo so podem virar execucao quando respeitarem a serializacao e o gate da frente correspondente

### Bloco A - Bloqueio externo real

1. `real-payments-cutover`
- Estado: `BLOQUEADO`
- Problema: pagamento real em producao segue sem janela externa valida fora de `localhost`
- Condicao de abertura:
  - `HML_BASE_URL` fora de `localhost`
  - dono da janela definido
  - evidencia operacional externa preparada
- Prova minima de saida:
  - `npm run p3:precheck`
  - `npm run qa:stripe:smoke`
  - `npm run qa:payments21`
  - `npm run qa:provider:activate`
  - `npm run qa:functional`
  - `npm run qa:coreops`
  - `npm run qa:matrix:audit`
- Nao confundir com:
  - readiness local
  - dry-run honesto
  - baseline interna aprovada

### Bloco B - Dominios parciais com prova real

2. `community-campaigns`
- Estado: `PARCIAL`
- O que falta resolver:
  - nao vender governanca de campanha como dominio maduro
  - endurecer o recorte sem abrir `Organization` ou movimento amplo
- Gate:
  - `npm run qa:campaign:impact`
  - `npm run qa:campaign:detail`
  - `npm run qa:community:revenue`
  - `npm run qa:base:roles`
- Criterio de fechamento:
  - campanha segue operavel
  - owner, governanca e receita por campanha continuam coerentes
  - nenhuma promessa de maturidade acima do runtime atual

3. `affiliate-referral`
- Estado: `PARCIAL`
- O que falta resolver:
  - manter atribuicao, link, clique e conversao como escopo real
  - impedir leitura de payout, reward ou saldo proprio como se ja existissem
- Gate:
  - `npm run qa:affiliate:referral`
  - `npm run qa:role:closure`
- Criterio de fechamento:
  - recorte segue operacional
  - linguagem, superficie e docs nao insinuam reward financeiro proprio

4. `catalogo-curadoria-artwork`
- Estado: `PARCIAL`
- O que falta resolver:
  - consolidar o fluxo `artwork -> catalogo -> impact review -> ready -> published`
  - impedir expansao autonoma de Fase 3 antes da hora
- Gate:
  - `npm run qa:community-curation`
  - `npm run qa:catalog:curation`
  - `npm run qa:role:closure`
- Criterio de fechamento:
  - fluxo continua honesto, provado e acoplado ao runtime atual
  - nenhuma abertura de produto paralelo ou checkout paralelo

### Bloco C - Lacunas que nao podem ser vendidas como prontas

5. `cobertura exaustiva de UX`
- Estado: `NAO PROVADO EXAUSTIVAMENTE`
- Inclui:
  - cada tela
  - cada mensagem
  - cada diagrama de interface
  - cada matriz de cadastro
  - cada combinacao de campos obrigatorios
  - cada edge case visual e textual
- Leitura correta:
  - existe confianca forte no nucleo provado
  - nao existe certificacao total tela a tela
- Acao permitida:
  - so abrir revisao especifica quando houver evidencia nova, risco objetivo ou prioridade explicita

6. `cobertura total de ambientes`
- Estado: `NAO PROVADO EXAUSTIVAMENTE`
- Inclui:
  - equivalencia total entre local, homolog final e producao real
- Leitura correta:
  - local e gates internos deram prova util
  - homolog final real e producao ainda dependem da trilha de cutover
- Acao permitida:
  - nao prometer paridade total antes da janela externa e da evidencia operacional

### Ordem pratica depois do bloqueio atual

Quando `FRONT_5_REAL_PAYMENTS_CUTOVER` deixar de estar bloqueada:
1. executar e fechar a janela real de pagamento
2. reclassificar `pagamento real em producao` em `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` e `docs/EXECUTION_TRACKING.md` se a prova subir
3. reavaliar os dominios `PARCIAL` ainda abertos
4. abrir apenas o proximo recorte que tiver:
   - problema real claro
   - gate definido
   - risco de negocio justificado

### Saidas que este plano permite

- `PROVADO`: quando houver gate e evidencia nova suficientes
- `PARCIAL CONSCIENTE`: quando o recorte estiver operacional, mas nao maduro
- `BLOQUEADO EXTERNO`: quando depender de janela, ambiente ou ator fora do repositorio
- `NAO PROMETER`: quando existir estabilidade local, mas nao prova exaustiva ou maturidade de dominio

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
