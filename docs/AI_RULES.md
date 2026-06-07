# AI Rules

Data de revisao: 2026-06-06

## Decisao atual
- IA esta fora do produto publico.
- Nao usar SDK de IA no client.
- Nao expor `NEXT_PUBLIC_*` para provedores de IA.
- Busca e curadoria atuais sao locais e deterministicas.

## O que e permitido agora
- Recomendacao local baseada no catalogo canonico.
- Busca guiada por regras simples e dados internos.
- Uso de IA apenas como assunto futuro de arquitetura, nao como feature ativa.

## O que e proibido agora
- Reintroduzir `@google/genai` ou equivalente em `app/`, `components/` ou `lib/`.
- Criar CTA, label, modal ou navegacao prometendo IA ativa.
- Chamar provedor externo de IA diretamente do browser.

## Condicao para voltar com IA
- Endpoint server-side dedicado.
- Controle de custo, abuso e observabilidade.
- Contrato de fallback sem IA.
- Revisao explicita de arquitetura e governanca antes de merge.

## Guardrail operacional
- `npm run qa:product:guardrails` deve passar.
- Qualquer falha nessa QA bloqueia a reintroducao de IA no produto.

## Reentrada futura
- Se IA voltar, o desenvolvimento deve seguir `docs/PLANO_REENTRADA_IA_E_MIDIA_REAL.md`.
