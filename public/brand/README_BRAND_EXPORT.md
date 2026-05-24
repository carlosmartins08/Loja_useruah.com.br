# Brand Assets Export Guide

Estrutura oficial:

- `public/brand/SVG`: versoes vetoriais oficiais para uso no app/site.
- `public/brand/92ppi`: exportacoes raster para usos de interface e tamanhos especificos.
- `public/brand/2x`: exportacoes de alta densidade.

Substitua os arquivos oficiais mantendo exatamente estes nomes em `public/brand/SVG`:

- `logo-wordmark-dark.svg`
- `logo-wordmark-light.svg`
- `logo-mark-dark.svg`
- `logo-mark-light.svg`
- `logo-mark-192.png`
- `logo-mark-512.png`
- `apple-touch-icon.png` (180x180)
- `favicon-16.png`
- `favicon-32.png`
- `favicon.ico`

Convencao de variacoes (obrigatoria):

- Arquivos sem sufixo `_v1` = versao oficial sem slogan (uso padrao do produto/app).
- Arquivos com sufixo `_v1` = versao completa com slogan (uso institucional, campanha, apresentacoes e pecas editoriais).
- Nunca substituir arquivo oficial sem sufixo por versao `_v1`.
- Quando houver duvida, usar sempre a versao sem slogan.

Exemplos:

- `logo-wordmark-dark.svg` -> wordmark oficial sem slogan.
- `logo-wordmark-dark_v1.svg` -> wordmark completo com slogan.
- `logo-wordmark-light.svg` -> wordmark oficial sem slogan.
- `logo-wordmark-light_v1.svg` -> wordmark completo com slogan.

Formatos e dimensoes:

- Wordmark: `1200x320` (SVG e PNG @2x opcional)
- Mark: `512x512`, `192x192`
- Apple: `180x180`
- Favicon: `16x16`, `32x32`, `.ico` com 16/32/48
