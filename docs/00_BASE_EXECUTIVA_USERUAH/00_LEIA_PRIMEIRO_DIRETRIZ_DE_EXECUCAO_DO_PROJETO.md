# 00 — Leia Primeiro: Diretriz de Execução do Projeto UseRuah

## Propósito

Este documento é a porta de entrada obrigatória para qualquer agente, desenvolvedor ou operador que vá atuar no projeto `Loja_useruah.com.br`.

Ele existe para impedir que o volume antigo de documentação gere perda de contexto, retrabalho, abertura indevida de fase ou execução baseada em documento superado.

## Regra central

```text
Documento antigo pode explicar de onde viemos.
A base executiva define para onde vamos.
A matriz mostra o que é real.
O código implementa.
Os testes provam.
O readiness libera produção.
```

## Ordem obrigatória de leitura

Antes de qualquer desenvolvimento, patch, auditoria ou alteração documental, leia nesta ordem:

```text
1. docs/00_BASE_EXECUTIVA_USERUAH/00_LEIA_PRIMEIRO_DIRETRIZ_DE_EXECUCAO_DO_PROJETO.md
2. docs/00_BASE_EXECUTIVA_USERUAH/01_MASTER_USE_RUAH_PROJETO_GOVERNANCA_E_FASES.md
3. docs/00_BASE_EXECUTIVA_USERUAH/02_DOCUMENTACAO_TIPOS_DE_USUARIO_ECOSSISTEMA_USERUAH.md
4. docs/00_BASE_EXECUTIVA_USERUAH/03_MATRIZ_DE_CADASTRO_METODO_CUBO_E_ARQUITETURA_BANCO_USERUAH.md
5. docs/00_BASE_EXECUTIVA_USERUAH/04_ARQUITETURA_BACKEND_E_TECNICA_USERUAH.md
6. docs/00_BASE_EXECUTIVA_USERUAH/05_GOVERNANCA_E_REGRAS_DE_NEGOCIO_USERUAH.md
7. docs/00_BASE_EXECUTIVA_USERUAH/06_INTERFACE_E_JORNADAS_DE_USUARIO_USERUAH.md
8. docs/00_BASE_EXECUTIVA_USERUAH/07_DEFINITION_OF_DONE_QA_E_CONTRATOS_DE_ENTREGA_USERUAH.md
```

Depois disso, consultar os documentos operacionais específicos conforme o tipo de mudança.

## Hierarquia de autoridade

Quando houver conflito entre documentos, seguir esta ordem:

```text
1. PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md
   Define o estado real: IMPLEMENTADO, PARCIAL, PLANEJADO, AUSENTE, NAO PRESUMIR ou BLOQUEADO.

2. Documentos oficiais de fase
   Definem escopo e intenção funcional da fase.

3. Handoffs entre fases
   Definem o que pode ou não pode passar de uma fase para outra.

4. Readiness / precondições operacionais
   Definem produção, pagamento real, persistência, observabilidade, cutover e rollback.

5. Execution tracking / evidências
   Registram execução; não autorizam mudança sozinhos.

6. Changelog
   Registra histórico; não é fonte primária de escopo.

7. Documentos antigos de jornada, visão, roadmap e mapas
   Servem como apoio/contexto; não comandam implementação contra matriz, fase, handoff ou readiness.
```

## Estado decisório atual

```text
Fase 1 funcional: fechada/convergente.
Fase 1 produção: depende da janela real de homologação final.
Stripe readiness: GO CONDICIONADO.
Fase 2: parcial/condicional; MovementCampaign básico é o único recorte real identificado.
Fase 3: bloqueada até Fase 1 concluir homologação final e Fase 2 ter base real suficiente.
```

## Trava pré-patch

Antes de qualquer patch, o agente deve responder objetivamente:

```text
Tipo da mudança:
Fonte que autoriza:
O que NÃO será tocado:
Critério de aceite:
```

Categorias válidas:

```text
Fase 1 funcional
Readiness transversal
Fase 2 funcional
Incidente-Correção
Dívida técnica explícita
Documentação
Ruído
```

Se esses campos não puderem ser preenchidos com clareza, o patch não deve começar.

## Regra para dívida técnica

Só existe `Dívida técnica explícita` se houver pelo menos um dos fatores abaixo:

```text
bloqueio real
regressão real
simplificação comprovada com impacto direto
risco objetivo para produção
evidência em teste, log, incidente ou matriz
```

Caso contrário, classificar como `Ruído`.

## Regra para incidente/correção

Usar `Incidente-Correção` quando a mudança responder a falha real em homologação ou produção.

Exigir:

```text
causa observada
impacto
rollback
teste de contenção
RCA curto depois da correção, se aplicável
```

## Trava da homologação final da Fase 1

A próxima execução operacional legítima é a janela real de homologação final da Fase 1.

Classificação:

```text
Tipo da mudança: Readiness transversal
Fonte autorizadora: docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md
Não tocar: Fase 2, Fase 3, auth, checkout, pedido, pagamento, documentação sem evento novo
Critério: evidências da homologação final + GO / GO CONDICIONADO residual / NO-GO
```

A execução só pode começar se existirem os 5 insumos:

```text
1. HML_BASE_URL real da homologação final
2. Dono/responsável da janela
3. Ambiente confirmado
4. Critério de evidência esperado
5. Autorização explícita para iniciar
```

Se qualquer item estiver ausente, retornar:

```text
STATUS: AGUARDANDO_JANELA_REAL
```

E não executar testes, não abrir patch, não alterar código e não alterar documentação.

## Regras de fase

### Fase 1

```text
Fase 1 vende.
Fase 1 é a base funcional do e-commerce.
Fase 1 funcional está fechada/convergente.
Produção ainda depende de readiness/homologação final.
```

### Fase 2

```text
Fase 2 contextualiza.
Fase 2 não cria novo Product, Checkout, Cart, Order ou Payment.
Fase 2 não pode corrigir pendência mal encerrada da Fase 1.
Fase 2 só pode abrir recorte autorizado, preferencialmente MovementCampaign básico após Fase 1 avançar operacionalmente.
```

### Fase 3

```text
Fase 3 está bloqueada.
Fase 3 não pode ser iniciada com base em Fase 2 parcial ou em documentos planejados sem implementação.
```

## Anti-padrões proibidos

```text
usar documento antigo para abrir escopo novo
reabrir Fase 1 funcional sem bug real
abrir Fase 2 ampla por conveniência
abrir Fase 3 antes de base real suficiente
criar checkout paralelo
criar pedido paralelo
criar pagamento paralelo
criar produto paralelo ao CatalogItem
tratar UI como prova de backend
tratar jornada como prova de implementação
tratar tracking como autorização de mudança
corrigir documentação sem conflito concreto
continuar auditoria quando a próxima ação é operacional
```

## Como usar documentos antigos

Documentos antigos de jornada, visão, roadmap, mapas e arquitetura inicial devem ser usados como contexto.

Eles não devem contrariar:

```text
matriz de implementação
fase oficial
handoff
readiness
código real
testes
```

## Critério mínimo de pronto

Nenhuma entrega deve ser aceita sem evidência.

Evidência pode ser:

```text
teste automatizado
gate PASS
log rastreável
validação manual controlada
registro de execução
veredito GO / GO CONDICIONADO / NO-GO
```

## Regra final

```text
A UseRuah evolui por fases, não por ansiedade.
Cada fase precisa provar sua realidade antes de virar base da próxima.
Governança boa não acelera qualquer coisa.
Governança boa impede avanço falso.
```
