# context

Casa do estado cliente compartilhado entre telas.

## O que vive aqui
- estado que precisa atravessar mais de um componente ou rota
- sessao de superficie consumida por UI
- persistencia local de navegador quando fizer sentido
- coordenacao client-side para chamar endpoints ja existentes

## O que nao deve viver aqui
- regra de negocio autoritativa
- validacao critica de permissao
- persistencia servidora como fonte unica de verdade
- fluxo de dominio que deveria estar em `lib/`

## Leitura do estado atual
- `CartContext.tsx`
  - estado de carrinho e persistencia local para experiencia cliente
- `UserContext.tsx`
  - sessao de superficie, refresh de sessao e troca de papel no client

## Regra pratica
- `context/**` pode orquestrar
- `lib/**` deve decidir

Se um contexto comecar a acumular regra critica de pedido, pagamento, auth ou transicao de estado, ele saiu do lugar certo.
