# Route Definition Of Done (Obrigatorio)

Data de revisao: 2026-05-19

## Politica: Payment Deferred (ativo)

Objetivo: permitir evoluir produto/UX sem bloquear o roadmap por gateway e banco agora.
Documento de apoio: `docs/PAYMENTS_DEFINITION_OF_DONE.md`

Regras obrigatorias enquanto pagamento real estiver adiado:
- Contrato de API congelado em `app/api/payments/checkout/route.ts`, `app/api/payments/status/[paymentId]/route.ts` e `app/api/payments/webhook/route.ts`.
- Nao alterar nomes de campos principais sem migration de contrato: `paymentId`, `orderId`, `providerReference`, `status`, `method`, `amount`, `currency`.
- Frontend deve seguir usando `x-idempotency-key` em checkout para evitar dupla cobranca em retry.
- Webhook deve manter validacao de assinatura por `x-signature` quando `PAYMENT_WEBHOOK_SECRET` estiver definido.
- Sandbox continua fonte de verdade para dev/staging ate entrada do gateway real.
- Qualquer PR que toque pagamentos precisa documentar compatibilidade retroativa no PR description.

## Home (`/`)
- [ ] `components/home/HomePage.tsx` permanece apenas como composicao de secoes.
- [ ] Conteudo estruturado em `components/home/sections/*`.
- [ ] Dados editoriais em `components/home/home-data.ts`.
- [ ] JSON-LD valido e coerente com `useruah.com.br`.

## Shop (`/shop`)
- [ ] `app/shop/page.tsx` so renderiza a view.
- [ ] Estado de filtro/visualizacao isolado em `components/shop/ShopPageView.tsx`.
- [ ] Dados e tipos em `components/shop/shop-data.ts`.
- [ ] Fluxo `shop -> product` validado manualmente.

## Product (`/product/[id]`)
- [x] `app/product/[id]/page.tsx` apenas orquestra `params`, metadata e view.
  Ref: `app/product/[id]/page.tsx`
- [x] Modelo e JSON-LD no dominio de produto (`components/product/product-data.ts`).
  Ref: `components/product/product-data.ts`
- [x] View sem regra de negocio de fetch direto.
  Ref: `components/product/ProductPageView.tsx`
- [x] Fluxo `product -> add to cart -> checkout` validado no codigo.
  Ref: `components/commerce/ProductInteractive.tsx`, `context/CartContext.tsx`, `components/checkout/CheckoutPageView.tsx`

### Product - Conversao e Confianca (prioridade)

#### P0 - Obrigatorio para operacao comercial
- [x] Calculo de frete visivel na PDP sem depender do carrinho.
  Ref: `components/commerce/SmartShipping.tsx`
- [x] Prazo estimado de entrega em data clara (ex.: "chega ate 24/05/2026").
  Ref: `components/commerce/SmartShipping.tsx`
- [x] Parcelamento exibido abaixo do preco a vista.
  Ref: `components/commerce/ProductInteractive.tsx`
- [x] Botao "Comprar agora" funcional levando ao checkout rapido.
  Ref: `components/commerce/ProductInteractive.tsx`
- [x] Tabela de medidas fixa e legivel no mobile.
  Ref: `components/commerce/TechnicalGuide.tsx`, `components/product/ProductPageView.tsx`
- [x] Aviso de caimento (slim/regular/oversized) explicito.
  Ref: `components/product/product-data.ts`, `components/product/ProductPageView.tsx`
- [x] Composicao do tecido (ex.: 100% algodao fio 30.1) exibida.
  Ref: `components/product/product-data.ts`, `components/product/ProductPageView.tsx`
- [x] Tipo de estampa (silk/DTG/sublimacao) exibido.
  Ref: `components/product/product-data.ts`, `components/product/ProductPageView.tsx`, `components/commerce/ProductInteractive.tsx`
- [x] Guia de lavagem (icones ou texto curto) exibido.
  Ref: `components/product/product-data.ts`, `components/product/ProductPageView.tsx`
- [x] Selecao de cor atualiza a imagem principal automaticamente.
  Ref: `components/product/ProductPageView.tsx`, `components/commerce/ProductInteractive.tsx`
- [ ] Fotos reais de detalhes (costura, gola, etiqueta) disponiveis.
  Status: parcial (galeria pronta, ainda aguardando acervo real)
  Ref: `components/commerce/ProductMediaGallery.tsx`, `components/product/product-data.ts`

#### P1 - Forte alavanca de conversao
- [x] Avaliacoes com tags filtraveis (ex.: "tamanho correto", "tecido macio").
  Ref: `components/commerce/ProductSocialProof.tsx`
- [x] Classificacao separada por qualidade, entrega e custo-beneficio.
  Ref: `components/commerce/ProductSocialProof.tsx`
- [x] Secao publica de perguntas e respostas na propria PDP.
  Ref: `components/commerce/ProductQA.tsx`
- [x] Zoom de alta qualidade na estampa/textura.
  Ref: `components/commerce/ProductMediaGallery.tsx`
- [x] WhatsApp/chat visivel para suporte imediato.
  Ref: `components/commerce/ProductInteractive.tsx`, `components/product/ProductPageView.tsx`
- [x] Cross-selling ("Compre junto") com kits e regra de preco clara.
  Ref: `components/commerce/SmartRecommender.tsx`, `components/product/ProductPageView.tsx`

#### P2 - Diferencial competitivo
- [ ] Mockups com modelos de biotipos diferentes.
  Status: parcial (estrutura de galeria pronta com mockups, aguardando acervo final)
  Ref: `components/commerce/ProductMediaGallery.tsx`, `components/product/product-data.ts`
- [x] Provador virtual com entrada de altura/peso e recomendacao de tamanho.
  Ref: `components/commerce/ProductSizeAdvisor.tsx`, `components/product/ProductPageView.tsx`
- [x] Checkout em um clique com metodos instantaneos (Pix/carteiras digitais), quando tecnicamente viavel.
  Ref: `components/commerce/ProductInteractive.tsx`, `components/checkout/sections/CheckoutStepTwoSection.tsx`
  Backend sandbox: `app/api/payments/checkout/route.ts`, `app/api/payments/status/[paymentId]/route.ts`, `app/api/payments/webhook/route.ts`
  SeguranÃ§a de base: idempotency key (`x-idempotency-key`) e validaÃ§Ã£o de assinatura (`x-signature`) habilitadas

#### Criterios de qualidade da PDP
- [ ] Imagens em formato otimizado (WebP/AVIF) e carregamento percebido rapido.
  Status: parcial (`next/image` ativo, mas acervo ainda placeholder)
- [ ] LCP da PDP <= 2.5s em ambiente de referencia.
  Status: nao medido
- [ ] CLS <= 0.1 na PDP.
  Status: nao medido
- [x] Todos os CTAs principais funcionam em mobile e desktop (adicionar + comprar agora + suporte).
- [ ] Conteudo tecnico e comercial coerente com o produto real (sem placeholder).
  Status: parcial (ainda existem imagens e dados mock)

## Checkout (`/checkout`)
- [x] `app/checkout/page.tsx` apenas entrada.
- [x] Fluxo visual e estado em `components/checkout/CheckoutPageView.tsx`.
- [ ] Cenarios validados: carrinho vazio, etapa 1, etapa 2, confirmacao.
- [ ] Nenhuma regressao de calculo de prazo/total.

## Baseline Visual e de Interacao para Rotas Criticas
Escopo desta fase (obrigatorio):
- `/product/[id]`
- `/checkout`

Regra de escopo:
- Este baseline nao e um Design System global.
- Expansao para outras rotas so pode ocorrer por decisao formal de governanca.

### Tokens semanticos minimos obrigatorios
- `surface`
- `text-primary`
- `text-secondary`
- `border`
- `accent`
- `danger`
- `success`
- `muted`
- `warning`
- `focus`

Regra:
- Sem criar cor local fora desses tokens para componentes criticos sem atualizacao formal deste baseline.

### Fonte tecnica dos tokens
Os tokens semanticos do baseline devem apontar para a fonte tecnica oficial do projeto.

Fonte de verdade esperada:
- tokens definidos no arquivo global de estilos/tokens do projeto;
- ou, quando aplicavel, em `tailwind.config`, `globals.css`, `theme.css`, `tokens.ts` ou arquivo equivalente ja adotado pelo projeto.

Nenhum componente critico de `/product/[id]` ou `/checkout` deve criar cor, espacamento, radius, sombra ou tipografia local fora da fonte tecnica oficial sem justificativa registrada no PR.

### CTA dominante por viewport
- CTA primario deve representar uma unica acao dominante por viewport.
- CTAs duplicados so sao permitidos quando executam a mesma acao e nao competem visualmente entre si.

### Matriz de estados por componente
| Componente | Loading | Empty | Error | Success |
| --- | --- | --- | --- | --- |
| Galeria de midia | Sim | Sim | Sim | Opcional |
| Preco/parcelamento | Sim | Sim | Sim | Opcional |
| CTA de compra | Sim | Opcional | Sim | Sim |
| Q&A/Avaliacoes | Sim | Sim | Sim | Sim |
| Resumo de checkout | Sim | Sim | Sim | Sim |

Nota normativa:
- `Opcional` significa aplicavel quando houver evento explicito de confirmacao.

### Regra anti-perda de conversao
- Nenhuma alteracao visual pode reduzir a clareza de preco, disponibilidade, selecao de variacao, CTA principal, mensagem de erro de checkout ou confirmacao de compra.

### Resultado esperado - variacao indisponivel na PDP
Quando o usuario selecionar uma variacao indisponivel em `/product/[id]`, o sistema deve:
- manter a variacao visualmente identificavel como indisponivel;
- bloquear a acao de compra para aquela combinacao;
- exibir mensagem acionavel proxima ao seletor ou ao CTA;
- preservar alternativas disponiveis quando existirem;
- nao permitir envio de combinacao invalida ao backend.

Mensagem minima aceitavel:
- "Esta combinacao nao esta disponivel. Escolha outra cor, tamanho ou variacao."

### Acessibilidade minima verificavel
- Foco visivel em botoes, links, inputs e seletores de variacao.
- Erro associado ao campo ou acao correspondente.
- Mensagens de erro nao podem depender apenas de cor.
- Estados de sucesso/erro devem ser compreensiveis sem depender so de icone/cor.
- Campos criticos do checkout devem ter `label` claro.

### Cenarios minimos de validacao manual
- [ ] PDP com produto completo.
- [ ] PDP com midia ausente.
- [ ] PDP com variacao indisponivel.
- [ ] PDP com avaliacoes vazias.
- [ ] Checkout com carrinho vazio.
- [ ] Checkout com falha de pagamento sandbox.
- [ ] Checkout com pagamento aprovado.
- [ ] Checkout com erro de campo obrigatorio.
- [ ] Mobile 360px com sticky ativo.

### Resultados esperados - cenarios minimos de checkout
| Cenario | Resultado esperado minimo |
| --- | --- |
| Carrinho vazio | Exibir estado vazio claro, CTA para voltar a loja e impedir avanco para pagamento. |
| Etapa de dados pessoais | Validar campos obrigatorios, mostrar erro proximo ao campo e impedir avanco com dados invalidos. |
| Etapa de endereco | Validar endereco minimo necessario, mostrar erro acionavel e preservar dados ja preenchidos. |
| Etapa de pagamento | Exibir resumo do pedido, metodo selecionado e estado claro de processamento. |
| Falha de pagamento sandbox | Exibir mensagem acionavel, permitir nova tentativa ou troca de metodo de pagamento, sem duplicar pedido. |
| Pagamento aprovado sandbox | Exibir confirmacao de compra, numero/identificador do pedido e proximo passo de acompanhamento. |
| Confirmacao | Mostrar status inicial do pedido e caminho claro para "Meus pedidos" ou acompanhamento. |

### Campos criticos do checkout
Campos minimos tratados como criticos:
- nome completo;
- e-mail;
- telefone, quando exigido pelo fluxo;
- CPF/CNPJ, quando exigido pelo pagamento ou emissao;
- CEP;
- endereco;
- numero;
- cidade;
- estado;
- metodo de pagamento;
- dados minimos do metodo de pagamento;
- aceite de termos, quando aplicavel.

Todo erro em campo critico deve ser exibido proximo ao campo correspondente e informar a acao esperada do usuario.

## Qualidade transversal
- [ ] `npm run check` sem erros.
- [ ] Sem `any` novo sem justificativa.
- [ ] Rotas e links internos conferidos.
- [ ] Responsivo validado em mobile e desktop para rota alterada.

## Plano de acoes seguintes (governanca)
- Backlog de dominio deve ser mantido apenas nos documentos especificos:
  - `docs/PAYMENTS_DEFINITION_OF_DONE.md`
  - `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
  - `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
  - `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- Qualquer mudanca de estado/contrato deve seguir `docs/DOCS_CLASSIFICATION.md` e `docs/README_DOCS_HIERARCHY.md`.
- Qualquer mudanca transversal deste baseline deve:
  1. atualizar `docs/ROUTE_DEFINITION_OF_DONE.md`;
  2. refletir validacao em `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`;
  3. registrar decisao em `docs/CHANGELOG_GOVERNANCE.md`;
  4. informar problema resolvido, impacto esperado e rotas afetadas.

Documento de apoio para pedidos e logística: `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`

Documento de apoio para catálogo e curadoria: `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`

Documento de apoio para atendimento e tickets: `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`


