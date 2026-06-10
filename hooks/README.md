# hooks

Casa de hooks client-side reutilizaveis.

## O que vive aqui
- comportamento local de UI
- integracao com DOM e browser APIs
- acessibilidade, viewport, foco e interacao
- derivacoes de estado de superficie que nao pedem contexto global

## O que nao deve viver aqui
- regra de negocio central
- persistencia servidora
- orquestracao completa de dominio
- fluxo que ja exige coordenacao entre varias telas

## Estado atual
- `use-mobile.ts`
  - breakpoint e leitura de viewport
- `use-focus-trap.ts`
  - controle de foco para overlay e acessibilidade

## Regra pratica
- se o hook e sobre DOM, UX e comportamento local, ele tende a viver aqui
- se precisa compartilhar estado entre telas, reavalie `context/`
- se precisa decidir regra do sistema, reavalie `lib/`
