# Plano de Desenvolvimento Frontend

Data de revisao: 2026-07-07

## Objetivo
Organizar a evolucao das superficies de frontend com base no que esta provado no runtime, no que esta parcial e no que nao deve ser presumido.

## Escopo
Este plano cobre:
- frontend publico
- account
- admin
- support
- community
- affiliate
- movement
- shells, cascas e superficies nao canonicas

## Fonte normativa
- `docs/FRONTEND_FASE_1_VENDA_DE_PRODUTO.md`
- `docs/FASE_1_VENDA_DE_PRODUTO.md`
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- `docs/ROUTES.md`
- `docs/README_DOCS_HIERARCHY.md`
- `docs/DOCS_CLASSIFICATION.md`

## Estado atual real
### PRONTO E FUNCIONAL
- base de rotas canonicas da Fase 1 compila com sucesso no build
- navegacao canonica nao depende de `ELIV` como fonte de regra

### ALINHADO
- jornadas centrais da Fase 1 que ja passam por build e gates operacionais
- navegacao canonica que nao depende de casca ou alias morto

### PARCIAL
- `Catálogo`
- `Frontend público`
- `Account`
- `Admin`
- `Support`
- `Community`
- `Affiliate`

### FALTANTE
- `Movement`

### NÃO PRESUMIR
- `ELIV`
- qualquer superficie que compile mas nao tenha prova funcional suficiente
- qualquer shell que exista so para ocupacao visual

## Principios
- pagina compilada nao significa superficie madura
- casca nao canonica nao pode comandar decisao de produto
- o frontend deve refletir o estado real da operacao, nao a promessa
- nada novo entra se nao reduzir atrito real de uso ou operacao

## Sequencia de desenvolvimento
1. Consolidar navegacao e rotas canonicas
2. Fechar jornadas publicas prioritarias
3. Tratar superficies administrativas e de conta
4. Isolar ou remover cascas nao canonicas
5. Revisar suporte, comunidade e afiliacao por prova real
6. Deixar `Movement` em aberto ate existir fonte oficial propria

## Critérios de aceite
- a rota existe e corresponde ao que a interface promete
- o comportamento principal foi testado
- nao ha dependencia de atalho escondido
- nao ha duplicidade de superficie para a mesma decisao
- layout e navegação nao contradizem a fonte executiva

## Gates minimos
- `npm run check`
- `npm run build`
- smoke ou QA funcional da superficie em questao
- evidência registrada no tracking quando houver mudanca de estado

## Riscos principais
- casca parecer produto pronto
- rota existir sem fluxo real
- `ELIV` ou outra area experimental ser confundida com canonica
- promover `Movement` sem fonte oficial e sem contrato

## Próxima ação unica
Escolher uma superficie parcial e fechar apenas uma jornada real por vez, com prova objetiva e sem criar duplicidade.
