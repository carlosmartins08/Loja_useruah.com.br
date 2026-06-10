# Data

## Objetivo
Guardar dados versionados usados pelo runtime como conteudo, tokens, mensagens e catalogos auxiliares.

## O que entra aqui
- tokens de cor e tipografia
- mensagens e regras de UX
- briefs e dados editoriais auxiliares
- estruturas consumidas diretamente por `lib/**`, `components/**` ou suites QA

## O que nao entra aqui
- thresholds operacionais
- janelas de execucao
- SLA
- segredo ou credencial
- artefato temporario

## Regra de decisao
- se o arquivo e lido como fonte de verdade do produto, interface ou conteudo, prefira `data/**`
- se o arquivo descreve operacao e nao UX/runtime do produto, prefira `config/**`
