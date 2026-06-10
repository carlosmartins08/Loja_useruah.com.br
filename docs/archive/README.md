# Archive de Documentos

Este diretorio guarda documentos retirados da camada ativa de consulta.

## O que significa estar em `docs/archive/`
- nao e fonte viva de execucao
- nao e fonte normativa
- nao deve ser usado para autorizar patch, fase ou readiness atual

## Criterio de arquivamento
- historico datado que nao e fonte viva de execucao
- plano de transicao ja concluido ou superado
- template redundante sem uso no fluxo atual

## Diferenca importante
- `docs/archive/**`
  - arquivo morto de consulta eventual
- `docs/*.md` com aviso de redirecionamento
  - ainda vivem na camada ativa apenas para apontar a fonte correta
- `docs/*.md` referenciais
  - continuam em `docs/` porque ajudam entendimento atual, mesmo sem autoridade normativa

Se algum arquivo daqui voltar a ser referencia operacional, ele deve retornar para `docs/`, ter links atualizados e ter classificacao revista em `docs/DOCS_CLASSIFICATION.md`.
