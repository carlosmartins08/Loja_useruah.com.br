# Catalog & Curation Definition Of Done (Obrigatorio)

Data de revisao: 2026-05-19

## Objetivo
Padronizar o fluxo de catálogo e curadoria para evitar publicação indevida, duplicidade de regra e retrabalho entre time criativo, curadoria e operação.

## Escopo do dominio
- Upload de arte e metadados.
- Revisão de curadoria (aprovar/reprovar com justificativa).
- Vínculo arte-produto e variantes.
- Publicação em catálogo e despublicação controlada.

## Máquina de estados
Este fluxo deve seguir obrigatoriamente as transições definidas em `docs/STATE_MACHINES.md` (`artwork` e `campaign`, com reflexo operacional em catálogo publicado).

Em caso de conflito, `docs/STATE_MACHINES.md` prevalece.

Não repetir estados ou transições neste DoD. Qualquer alteração de fluxo deve ser feita primeiro em `STATE_MACHINES.md` e depois refletida aqui apenas como referência.

## Ownership por perfil (resumo)
- `artist`: cria/submete arte.
- `community_manager`: cria insumos de campanha vinculáveis.
- `curator`: revisa, aprova/reprova e define diretrizes de publicação.
- `supplier`: mantém dados técnicos de base/variante.
- `platform_admin`: override controlado e auditoria.

Referencia completa: `docs/ROLES_MATRIX.md`

## Fase A: Submissao e revisao (MVP)
### Escopo
- [ ] Formulário de submissão com metadados mínimos.
- [ ] Fila de curadoria com filtros por status/data/autor.
- [ ] Aprovação/reprovação com motivo obrigatório.

### Critérios de aceite
- [ ] Submissão sem campos mínimos é bloqueada.
- [ ] Curador consegue aprovar/reprovar sem ação ambígua.
- [ ] Histórico da revisão fica auditável por arte.

## Fase B: Vínculo arte-produto e variantes
### Escopo
- [ ] Associar arte aprovada a base de produto.
- [ ] Definir variantes de cor/tamanho/preço base.
- [ ] Validar coerência de disponibilidade por variante.

### Critérios de aceite
- [ ] Não existe item de catálogo sem arte aprovada.
- [ ] Variante inválida (preço/estoque/dado técnico) é bloqueada.
- [ ] Mudança de variante mantém rastreabilidade de revisão.

## Fase C: Publicacao e despublicacao
### Escopo
- [ ] Publicar item no catálogo público com versão.
- [ ] Despublicar/arquivar com motivo e trilha.
- [ ] Garantir impacto controlado em páginas públicas (shop/product).

### Critérios de aceite
- [ ] Publicação reflete no catálogo sem item órfão.
- [ ] Despublicação não quebra link interno sem fallback.
- [ ] Reversão para estado anterior é possível com histórico.

## Fase D: Qualidade de catálogo
### Escopo
- [ ] Checklist visual/técnico antes de publicação.
- [ ] Verificação mínima de mídia (resolução, proporção, alt, consistência).
- [ ] Verificação de copy comercial e atributos técnicos.

### Critérios de aceite
- [ ] Item publicado atende padrão visual e técnico mínimo.
- [ ] SEO básico preenchido (título, descrição, dados estruturados quando aplicável).
- [ ] Rejeição por qualidade gera feedback acionável para correção.

## Contratos minimos de dados
Artwork deve possuir, no mínimo:
- [ ] `artworkId`
- [ ] `authorId`
- [ ] `status`
- [ ] `sourceAsset`
- [ ] `metadata` (tema, categoria, tags)
- [ ] `submittedAt`, `reviewedAt`
- [ ] `reviewReason` (obrigatório quando `rejected`)

CatalogItem deve possuir, no mínimo:
- [ ] `catalogItemId`
- [ ] `artworkId`
- [ ] `productBaseId`
- [ ] `variants[]`
- [ ] `publicationStatus`
- [ ] `createdAt`, `updatedAt`, `publishedAt`

## Observabilidade obrigatoria
- [ ] Eventos mínimos:
  - `artwork_submitted`
  - `artwork_review_started`
  - `artwork_approved`
  - `artwork_rejected`
  - `catalog_item_published`
  - `catalog_item_archived`
- [ ] Correlação por `artworkId` e `catalogItemId`.

## Testes obrigatorios
- [ ] Unit: transições válidas/inválidas de arte e catálogo.
- [ ] Integração: submissão -> curadoria -> publicação.
- [ ] E2E: item aprovado aparece no shop e é acessível na PDP.

## Segurança e governança
- [ ] Aprovação/reprovação somente por role autorizada.
- [ ] Override administrativo com justificativa obrigatória.
- [ ] Ações críticas com `AuditLog`.

## Critério de pronto (go-live parcial)
- [ ] 20 itens processados em staging (submissão->curadoria->publicação) sem inconsistência de estado.
- [ ] Nenhum item `rejected` publicado.
- [ ] Curadoria consegue justificar 100% das reprovações em auditoria amostral.

## Referencias
- `docs/ROLES_MATRIX.md`
- `docs/MVP_ROADMAP.md`
- `docs/ROUTE_DEFINITION_OF_DONE.md`
- `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`

## Fila oficial de execucao (sprint atual)
Fonte de controle: `docs/EXECUTION_STATUS_MATRIX.md` (seção "Sprint atual (WIP 1): Catálogo/Curadoria - 10 itens priorizados").

Ordem de ataque obrigatória:
1. Fechar contratos e estados canônicos (`Artwork` e `CatalogItem`).
2. Implementar submissão e fila de curadoria.
3. Implementar aprovação/rejeição com `reason` e `AuditLog`.
4. Implementar vínculo arte-produto-variante e regra de bloqueio.
5. Implementar publicação/despublicação com trilha.
6. Remover dependência de mock na PDP, lendo item publicado real.
