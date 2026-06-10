# Config

## Objetivo
Guardar configuracoes operacionais versionadas que ajustam comportamento sem exigir mudanca de codigo.

## O que entra aqui
- SLA operacional
- janelas de execucao
- thresholds
- politicas numericas ou calendarios de operacao

## O que nao entra aqui
- copy, mensagens, tokens visuais ou conteudo editorial
- manifestos exigidos por ferramenta externa
- segredo ou credencial

## Regra de decisao
- se a informacao e um parametro operacional ajustavel, prefira `config/**`
- se mudar esse arquivo altera politica, janela, tolerancia ou sensibilidade de operacao, ele pertence a `config/**`
