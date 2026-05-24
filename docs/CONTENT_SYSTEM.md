# Content System (Voz + Personalizacao + Governanca)

Data de revisao: 2026-05-24  
Owner: Produto + CX + Engenharia

## Objetivo
Manter comunicacao consistente em todo o projeto com personalizacao humana e controle operacional.

## Niveis de personalizacao
- `essencial`: fato + proximo passo + limite real
- `contextual`: inclui variaveis confiaveis (ex: `{firstName}`, `{orderId}`)
- `premium`: adapta por jornada/persona sem prometer alem da operacao

## Contrato minimo por mensagem
- `id`
- `tipo` (`success|error|warning|info|action`)
- `nivel` (`essencial|contextual|premium`)
- `rota`
- `momento`
- `persona`
- `headline`
- `body`
- `ctaPrimary` e/ou `ctaSecondary` (opcional)
- `variables` (opcional)
- `fallbackBody` (obrigatorio se houver variavel)

## Limites
- headline curta: max 60
- headline de bloco: max 90
- body curto: max 140
- body longo: max 280
- label de botao: max 24

## Guardrails
- Nao inventar dados pessoais/contextuais.
- Sem promessa de prazo sem base operacional.
- Sem linguagem robotica ou juridica excessiva em contexto de cliente.
- Em erro critico: clareza primeiro, empatia depois.

## Gate tecnico
- `npm run qa:content` valida:
  - ids duplicados
  - campos obrigatorios
  - limites de caracteres
  - variavel sem fallback
