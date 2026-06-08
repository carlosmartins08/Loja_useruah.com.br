# Fase 2 - Readiness Checklist

Data de revisao: 2026-06-08

## Objetivo
Definir o criterio minimo para iniciar a Fase 2 sem destruir a coerencia da Fase 1, sem inflar escopo e sem mascarar backlog antigo como se fosse frente nova.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` continua mandando no escopo da Fase 1.
- `docs/FASE_1_FREEZE_CHECKLIST.md` continua mandando no congelamento da Fase 1.
- `docs/MVP_ROADMAP.md` continua como ordem macro de evolucao.
- Este documento so responde uma pergunta: **podemos abrir a Fase 2 sem reabrir a Fase 1?**

## Veredito possivel
- `IMPLEMENTADO`: a abertura da Fase 2 esta formalmente sustentada por escopo, gate e documentacao
- `PARCIAL`: pode iniciar discovery e desenho, mas ainda sem implementacao
- `BLOQUEADO`: qualquer tentativa de abrir Fase 2 reabre a Fase 1

## 1. Pre-condicoes obrigatorias

| Item | Status esperado | Evidencia |
| --- | --- | --- |
| Fase 1 com escopo preservado | PASS | `docs/FASE_1_VENDA_DE_PRODUTO.md` |
| Fase 1 com GO/NO-GO preservado | PASS | `docs/FASE_1_GO_NO_GO_CHECKLIST.md` |
| Fase 1 com freeze preservado | PASS | `docs/FASE_1_FREEZE_CHECKLIST.md` |
| `npm run check` | PASS | gate tecnico |
| `npm run build` | PASS | gate tecnico |
| `npm run qa:functional` | PASS | jornada publica e conta |
| `npm run qa:coreops` | PASS | pedido ponta a ponta |
| `npm run qa:matrix:audit` | PASS | coerencia documental minima |

Se qualquer item acima falhar, o status e `BLOQUEADO`.

## 2. Perguntas obrigatorias antes de abrir a fase

Cada pergunta abaixo precisa de resposta objetiva. Se vier resposta vaga, a Fase 2 nao esta pronta.

### 2.1 Qual e o dominio que abre primeiro?
Escolher um e apenas um:
- expansao comercial e operacional de papeis
- comunidade e campanhas
- catalogo escalavel com artista/curadoria
- financeiro e comissionamento

Ou, antes da abertura oficial da Fase 2:
- pre-condicao operacional de pagamento real e persistencia financeira

Se a resposta for "um pouco de cada", a fase nao esta pronta.

### 2.2 O que entra e o que fica fora?
Precisa existir:
- lista curta do que entra
- lista curta do que fica fora
- criterio de corte

### 2.3 Quem e o ator ativo novo?
Precisa nomear:
- qual novo papel entra
- o que ele pode fazer
- o que ele ainda nao pode fazer

### 2.4 O que nao pode mudar na Fase 1?
Precisa citar explicitamente:
- loja publica
- checkout
- ownership do pedido
- rastreio/status
- suporte basico
- RBAC entre `customer` e `admin_master`

## 3. Definicao minima da Fase 2

Antes de implementar, a Fase 2 precisa ter um documento proprio com:
- objetivo da fase
- atores ativos novos
- escopo dentro / fora
- rotas novas
- estados novos
- contratos novos ou alterados
- criterio de aceite P0
- regra de nao-regressao sobre a Fase 1

Se a frente escolhida for apenas de readiness transversal, ela deve ter documento proprio, mas nao pode se declarar fase oficial nem substituir o handoff Fase 1 -> Fase 2.

Se isso nao existir, a implementacao ainda e prematura.

## 4. Checklist de arquitetura antes de codar

| Item | Status esperado | Observacao |
| --- | --- | --- |
| Novo dominio nao duplica regra da Fase 1 | PASS | shared continua shared |
| Novas rotas nao contaminam navegação ativa da Fase 1 | PASS | sem surfacing acidental |
| Novo papel nao recebe permissao por heranca solta | PASS | RBAC explicito |
| Novos estados nao vazam para UI da Fase 1 | PASS | traducao isolada |
| Novas APIs nao quebram contratos atuais | PASS | compatibilidade ou versionamento |
| Novo dashboard nao rouba foco do `/admin` Fase 1 | PASS | coexistencia controlada |

## 5. Checklist de produto antes de codar

| Item | Status esperado | Observacao |
| --- | --- | --- |
| Problema real da Fase 2 esta formulado | PASS | nao pode ser wishlist |
| Metrica principal da fase definida | PASS | ex: 1 fluxo novo ponta a ponta |
| Dependencias da Fase 1 foram separadas | PASS | sem retrabalho oculto |
| Aceite P0 do dominio novo existe | PASS | sem criterio difuso |
| Backlog de melhorias cosmeticas ficou fora | PASS | foco no fluxo novo |

## 6. O que a Fase 2 nao pode fazer
- usar a Fase 2 para corrigir desorganizacao da Fase 1 sem admitir isso
- reintroduzir multiator na interface principal da loja
- abrir mais de um dominio novo ao mesmo tempo
- mudar o significado de `/account` ou `/admin` sem regra documental nova
- quebrar o fluxo mestre da Fase 1 para acomodar um papel futuro

## 7. Ordem recomendada de abertura

### Opcao mais segura
1. congelar a Fase 1
2. escolher 1 dominio da Fase 2
3. escrever documento oficial da Fase 2
4. definir checklist P0 da nova fase
5. validar impacto sobre Fase 1
6. so entao implementar

### Opcao proibida
1. abrir varias rotas novas
2. testar no navegador
3. depois tentar explicar em qual fase aquilo entra

## 8. Gate de entrada da Fase 2
Executar em serie antes da primeira implementacao:

```text
npm run check
npm run build
npm run qa:functional
npm run qa:coreops
npm run qa:matrix:audit
```

Depois disso, responder formalmente:
- qual dominio da Fase 2 abre agora
- qual papel novo entra agora
- qual metrica prova que a fase funcionou

## 9. Veredito pratico

### `IMPLEMENTADO`
Use quando:
- a Fase 1 esta congelada e validada
- ha apenas 1 dominio novo escolhido
- ha documento e aceite minimo da Fase 2

### `PARCIAL`
Use quando:
- a Fase 1 esta congelada
- o dominio novo foi escolhido
- mas ainda falta documento ou corte mais claro

### `BLOQUEADO`
Use quando:
- a Fase 1 ainda pede ajuste estrutural
- a nova fase mistura varios dominios
- o time quer codar antes de decidir escopo

## 10. Decisao honesta
Se a pergunta for:
"podemos abrir a Fase 2 agora?"

A resposta correta so e `sim` quando a pergunta mais dura tambem responder `sim`:

"se eu congelar hoje a Fase 1 e auditar daqui a 30 dias, ela continua valida sem reinterpretacao?"

Se a resposta for `nao`, entao ainda nao e Fase 2.
Ainda e Fase 1 mal encerrada.
