# lib

Casa da verdade tecnica compartilhada do projeto.

## O que vive aqui
- regra de negocio
- persistencia e stores
- auth, sessao e RBAC
- integracoes externas
- adaptadores de provider
- handlers reutilizaveis de API administrativa
- utilitarios compartilhados que nao pertencem a `components/`, `context/` ou `hooks/`

## Taxonomia rapida
- `*-store.ts`
  - leitura, escrita, snapshot, rastreabilidade e comutacao de persistencia
- `*-service.ts`
  - orquestracao de fluxo e regra de negocio
- `*-provider.ts`
  - adaptacao de gateway, supplier ou integracao externa
- `admin-api/**`
  - logica reutilizavel para rotas administrativas densas
- `role-matrix/**`
  - matriz de permissao e de cadastro por papel
- `role-routing/**`
  - mapeamento de namespace, dashboards e navegacao por papel
- `ui/**`
  - constantes ou helpers de apoio visual sem virar componente React

## O que nao deve viver aqui
- JSX de tela
- estado local efemero de componente
- interacao de DOM
- efeito puramente visual
- wrapper de rota que so repassa props

## Regra pratica
- se a mudanca decide estado real do negocio, tende a viver em `lib/`
- se a mudanca so coordena experiencia cliente, avalie `context/` ou `hooks/`
- se a mudanca so renderiza interface, ela nao deve nascer aqui
