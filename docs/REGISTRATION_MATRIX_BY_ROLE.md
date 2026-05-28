# Registration Matrix by Role (MVP -> Evolucao)

Data de revisao: 2026-05-27  
Owner: Produto + Engenharia + Operacoes

## Regra estrutural
`Pessoa/Conta != Papel != Organizacao != Ambiente operacional`

## Objetivo
Definir quem cadastra o que, quem pode alterar, o que exige revisao e qual impacto operacional cada mudanca pode causar.

## Estado atual de funcionamento (resumo objetivo)
- Runtime de sessao suporta: `customer`, `platform_admin`, `support_agent`, `production_operator`, `finance_admin`, `artist`, `community_manager`.
- Rotas operacionais com matriz documentada ativa: `customer`, `platform_admin`, `support_agent`, `production_operator`.
- `finance_admin` ja possui comportamento de acesso administrativo por helper de roteamento.
- `supplier` e `curator` estao documentados em RBAC de dominio, mas sem ambiente de rota dedicado no frontend atual.

## Cadastro base comum (todos os papeis)
| Bloco | Campos principais | MVP | Status runtime |
| --- | --- | --- | --- |
| Identidade da conta | nome, email, senha/login social, telefone | Sim | Parcial |
| Papel inicial | customer, artist, community_manager etc. | Sim | Ativo |
| Termos aceitos | tipo de termo, versao, data/hora/IP | Sim | Ativo |
| Preferencias | canal, notificacoes, idioma | Parcial | Planejado |
| Seguranca | verify email, bloqueio, status conta | Sim | Parcial |
| Auditabilidade | createdAt, updatedAt, lastLogin | Sim | Parcial |

## Matriz por papel (o que gerencia)
| Papel | Cadastros principais | Pode publicar direto? | Status |
| --- | --- | --- | --- |
| `customer` | perfil, endereco, favoritos, tickets | Nao | Ativo |
| `artist` | perfil artistico, artes, portfolio, dados de recebimento | Nao (curadoria) | Parcial |
| `community_manager` | perfil institucional, campanhas, metas | Nao (revisao/admin) | Parcial |
| `supplier` | produto base, materia-prima, preco, frete, capacidade | Nao (impact review) | Planejado |
| `curator` | aprovar/rejeitar artes e catalogo | Sim, dentro do escopo | Planejado |
| `production_operator` | status de producao, ocorrencias, envio | Nao (somente operacao) | Ativo |
| `support_agent` | tickets, respostas, encaminhamentos | Nao (sem mutacao financeira) | Ativo |
| `finance_admin` | commission ledger, payout, refund, chargeback | Sim, com log | Parcial |
| `platform_admin` | usuarios, papeis, politicas, regras globais | Sim, com log | Ativo |

## Campos sensiveis (exigem revisao de impacto)
1. Tabela de preco de fornecedor
2. Regras de frete
3. Prazo/capacidade de producao
4. Materia-prima/ficha tecnica
5. Regras de comissao
6. Politica de troca/devolucao
7. Regras de gateway/taxas
8. Owner de comissao

## Regra obrigatoria de fluxo (editar != publicar)
- Toda alteracao de campo sensivel deve nascer como `pending_review`.
- Publicacao de mudanca critica so apos aprovacao (`finance_admin` ou `platform_admin` conforme dominio).
- Toda aprovacao/rejeicao critica deve gerar `AuditLog` com `actor_role`.

## Estados de cadastro recomendados
`empty -> draft -> incomplete -> pending_review -> approved -> active -> paused -> blocked`

## Comportamento por ambiente
- Mobile prioritario: `customer`, `artist`, `community_manager` (fluxo e CTA).
- Desktop prioritario: `supplier`, `support_agent`, `finance_admin`, `platform_admin` (tabelas, filtros, comparacao).

## Revisao de coerencia com docs existentes
- Fonte de permissoes globais: `docs/ROLES_MATRIX.md`
- Fonte de fluxo de acesso por rota: `docs/WORKFLOW_RBAC_ACCESS_MATRIX.md`
- Fonte de contratos: `docs/API_CONTRACTS.md`
- Fonte de estados: `docs/STATE_MACHINES.md`

## Gaps de funcionamento para execucao imediata
1. Atualizar `WORKFLOW_RBAC_ACCESS_MATRIX.md` para refletir explicitamente `finance_admin`.
2. Formalizar ambiente de rota para `artist` e `community_manager` (mesmo que inicial/parcial).
3. Definir endpoints de revisao de impacto para campos sensiveis de fornecedor antes de abrir UI completa de supplier.
4. Garantir que toda acao critica envie `actor_role` e passe por auditoria.

## Criterio de aceite desta matriz
- Existe owner por bloco de cadastro.
- Existe regra de permissao no backend por acao critica.
- Existe status operacional (ativo/parcial/planejado) por papel.
- Existe checklist de PR exigindo evidencia de impacto quando campo sensivel for alterado.
