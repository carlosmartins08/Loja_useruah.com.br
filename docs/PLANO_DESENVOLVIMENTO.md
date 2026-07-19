# Plano de Desenvolvimento

Data de revisao: 2026-07-07

## Objetivo
Organizar a execucao do projeto por superficie real, sem duplicar governanca, sem misturar plano com autorizacao e sem transformar roadmap em permissao de mudanca.

## O que este documento e
- um indice operacional para os planos de frontend e backend
- uma leitura de sequencia de desenvolvimento coerente com o estado real do projeto
- um ponto de entrada para decidir onde trabalhar sem reabrir fases bloqueadas

## O que este documento nao e
- nao e base executiva
- nao e autorizacao para patch
- nao substitui `docs/EXECUTION_TRACKING.md`
- nao substitui `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- nao reabre Fase 2 ou Fase 3

## Fontes de verdade que continuam valendo
- `docs/FASE_1_VENDA_DE_PRODUTO.md`
- `docs/FRONTEND_FASE_1_VENDA_DE_PRODUTO.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- `docs/EXECUTION_TRACKING.md`
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`

## Estrutura do plano
### Frontend
Cobrir o que o usuario ve e navega:
- frontend publico
- account
- admin
- support
- community
- affiliate
- movement
- shells, cascas e superficies nao canonicas

### Backend
Cobrir o que sustenta estado, contrato e operacao:
- auth/session
- orders
- checkout
- payments
- webhook
- persistencia
- QA/Gates
- readiness de producao

## Regra de uso
1. Ler a base executiva antes de usar este plano.
2. Classificar o estado real antes de propor trabalho.
3. Executar apenas o que cabe na superficie autorizada.
4. Registrar evidencias no documento de dominio e no tracking quando houver mudanca real.
5. Nao tratar este plano como autorizacao de producao.

## Estado real resumido
- pronto e funcional no recorte validado:
  - frontend base de rotas canonicas compila com sucesso no build
  - `auth/session`
  - `orders`
  - `checkout`
  - `payments`
  - `webhook`
  - `QA/Gates`
- nucleo funcional de Fase 1 provado
- superfices publicas e administrativas ainda misturam areas alinhadas e parciais
- `Movement` continua faltante
- `Stripe/readiness` continua `GO CONDICIONADO`
- janela real de homologacao final continua pendente

## Sequencia recomendada
1. Fechar o frontend por superficie e prova
2. Fechar o backend por contrato, estado e gates
3. Usar os planos especificos para escolher proximo passo
4. Registrar divergencias e bloqueios no tracking
5. Nao abrir nova frente sem evidencia

## Proxima acao unica
Consultar o plano especifico da area que sera trabalhada e confirmar se existe evidencia suficiente para executar sem reabrir o bloqueio atual.
