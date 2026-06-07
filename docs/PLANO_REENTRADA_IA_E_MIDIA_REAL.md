# Plano de Reentrada: IA e Midia Real

Data de revisao: 2026-06-06

## Estado atual
- O escopo atual esta fechado sem IA ativa no produto.
- O catalogo publico usa midia editorial oficial em `public/assets/editorial/catalog/**`.
- O que falta agora nao e correcao pendente. Sao duas frentes futuras e separadas:
  - biblioteca visual real de produto
  - eventual reentrada de IA via backend

## O que realmente falta
### 1. Biblioteca visual real de produto
- Objetivo: substituir o editorial como midia oficial quando houver acervo fotografico ou mockup serio.
- Problema que isso resolve: aumentar prova visual, percepcao de material, confianca de compra e consistencia entre PDP e expectativa real.
- Problema que isso nao resolve sozinho: preco, sortimento, operacao ou conversao ruim por oferta fraca.

### 2. IA server-side futura
- Objetivo: habilitar experiencias de busca, recomendacao ou personalizacao com controle real.
- Problema que isso resolve: ampliar flexibilidade de descoberta e assistencia.
- Problema que isso nao resolve sozinho: catalogo ruim, copy fraca, assets fracos ou falta de estrategia comercial.

## Regra de decisao
- Nao reabrir essas frentes por curiosidade tecnica.
- Reabrir somente se existir uma necessidade concreta de negocio ou experiencia.
- Tratar cada frente como projeto proprio, com escopo, aceite e rollback.

## Como desenvolver a biblioteca visual real
### Pre-condicoes
- Definir quais familias entram primeiro.
- Definir padrao unico de captura ou mockup.
- Definir variacoes minimas por produto:
  - capa principal
  - hover
  - detalhe
  - contexto de uso, se fizer sentido

### Regras de implementacao
- Nao misturar foto real, mockup ruim e editorial na mesma familia sem regra explicita.
- Nao gravar asset novo direto em caminhos legados de `public/assets/products/mockups/**`.
- Criar um caminho oficial novo quando a biblioteca real nascer, por exemplo:
  - `public/assets/products/library/**`
- Atualizar a normalizacao em `lib/product-artwork.ts` para apontar primeiro para a biblioteca real e so usar editorial quando a familia ainda nao tiver migrado.
- Migrar por lote pequeno e verificavel, nao por troca massiva cega.

### Gates obrigatorios
- Todo asset precisa existir fisicamente em `public/`.
- Toda familia migrada precisa renderizar corretamente em:
  - `/shop`
  - `/product/[id]`
  - wishlist
  - cart
- QA precisa falhar se um item marcado como "biblioteca real" apontar para asset ausente.
- O editorial so pode continuar como fallback declarado, nunca como mistura silenciosa.

### Criterio de pronto
- Pelo menos uma familia completa migrada ponta a ponta sem asset quebrado.
- PDP e vitrine dessa familia sem fallback inesperado.
- Regra de normalizacao documentada e coberta por QA.

## Como desenvolver IA no futuro
### Pre-condicoes
- Caso de uso definido com clareza:
  - busca
  - recomendacao
  - personalizacao
  - assistencia
- Metrica de sucesso definida antes da implementacao.
- Dono operacional definido para custo, abuso e revisao de respostas.

### Regras de implementacao
- Nao usar SDK de IA em `app/`, `components/` ou qualquer fluxo client-side publico.
- Criar rota server-side dedicada em `app/api/*`.
- Exigir fallback sem IA para toda experiencia critica.
- Registrar prompts, limites, timeouts e estrategia de erro no backend.
- Instrumentar custo, latencia, taxa de falha e uso por fluxo.

### Gates obrigatorios
- Revisao de arquitetura antes de merge.
- Guardrail atualizado para bloquear volta de chave publica ou SDK client-side.
- Teste de degradacao: com IA indisponivel, a experiencia continua funcional.
- Observabilidade minima:
  - request id
  - custo estimado
  - status de fallback
  - erro classificado

### Criterio de pronto
- Feature funciona com e sem provider.
- Custo e abuso estao sob controle mensuravel.
- Experiencia nao promete mais do que entrega.
- Go-live aprovado com rollback simples.

## Ordem recomendada quando isso voltar
1. Primeiro decidir qual das duas frentes tem motivacao real.
2. Abrir um documento de escopo proprio para essa frente.
3. Definir criterio de pronto antes de escrever codigo.
4. Implementar por lote pequeno com QA explicita.
5. So depois ampliar cobertura.

## Referencias
- `docs/AI_RULES.md`
- `docs/DECISIONS.md`
- `docs/ARCHITECTURE.md`
- `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- `scripts/qa-product-guardrails.mjs`
- `scripts/catalog-seed-helpers.mjs`
