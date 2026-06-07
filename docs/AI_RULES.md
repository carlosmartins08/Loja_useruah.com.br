# AI Rules

Data de revisao: 2026-06-06

## Decisao atual
- IA está fora do produto público.
- Não usar SDK de IA no client.
- Não expor `NEXT_PUBLIC_*` para provedores de IA.
- Busca e curadoria atuais são locais e determinísticas.

## O que é permitido agora
- Recomendação local baseada no catálogo canônico.
- Busca guiada por regras simples e dados internos.
- Uso de IA apenas como assunto futuro de arquitetura, não como feature ativa.

## O que é proibido agora
- Reintroduzir `@google/genai` ou equivalente em `app/`, `components/` ou `lib/`.
- Criar CTA, label, modal ou navegação prometendo IA ativa.
- Chamar provedor externo de IA diretamente do browser.

## Condição para voltar com IA
- Endpoint server-side dedicado.
- Controle de custo, abuso e observabilidade.
- Contrato de fallback sem IA.
- Revisão explícita de arquitetura e governança antes de merge.

## Guardrail operacional
- `npm run qa:product:guardrails` deve passar.
- Qualquer falha nessa QA bloqueia a reintrodução de IA no produto.
