# Content Migration - loja.useruah.com.br -> Nova Versao

Data de revisao: 2026-05-24  
Owner: Produto + Conteudo + Engenharia

## Objetivo
Reaproveitar o nucleo de mensagem da pagina antiga com padrao de copy moderno, consistente e orientado a conversao.

## Fonte analisada
- `https://loja.useruah.com.br/`

## Mapa de decisao

### 1) Reaproveitar (direto)
- Proposta central: fe + arte + expressao pessoal.
- Narrativa "Projeto Ruah" (origem e proposito).
- Pilares: estilo, durabilidade, conforto, tecnicas de estampa.
- FAQ base: producao, prazo, tamanhos, cuidados, pagamento, trocas.
- Blocos institucionais e contato.

### 2) Reaproveitar com adaptacao
- Hero principal: reduzir para headline + subheadline + CTA.
- "Junte-se a nos": manter 1 bloco unico com CTA claro.
- "3 passos": transformar em assistente de escolha objetivo.
- Sustentabilidade: manter apenas com alegacoes verificaveis.
- Logistica/prazo: alinhar com SLA operacional real.

### 3) Descartar
- Repeticoes de promessa em secoes diferentes.
- Superlativos sem prova objetiva.
- Texto longo sem acao.
- Qualquer promessa sem lastro operacional.

## Aplicacao por tela

### Home (`/`)
- Hero (promessa + CTA)
- 3 beneficios (qualidade, conforto, significado)
- Colecoes/categorias
- Prova social
- FAQ curto (3-5 itens)

### Produto (`/product/[id]`)
- Beneficio da peca
- Material/estampa/cuidados
- Prazo operacional
- FAQ especifica do produto

### Checkout (`/checkout`)
- Mensagens transacionais curtas
- Erro com proximo passo
- Confirmacao com orientacao de acompanhamento

### Conta (`/account/orders`)
- Linguagem de status por etapa
- Notificacao de envio/rastreio
- Excecoes (cancelamento/reembolso) com clareza

### Ajuda (`/help-center`)
- FAQ completo
- Politicas de troca/privacidade/termos
- Canais de suporte

## Limites editoriais
- Headline curta: ate 60
- Headline de bloco: ate 90
- Apoio curto: ate 140
- Apoio longo: ate 280
- Botao: ate 24

## Checklist de aceite
- [ ] Cada bloco tem objetivo unico.
- [ ] Cada bloco tem CTA principal.
- [ ] Sem duplicidade de promessa.
- [ ] Sem alegacao sem evidencia.
- [ ] Copy aprovada em mobile e desktop.

