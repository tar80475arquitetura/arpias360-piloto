# Fase 1 — Estabilização do PR #5

Base verificada: `6133c1f0409de9056319cf1ea573959a94c27b23`; main `a02dabd2e89ae9b77e0c9e4d5275066cb204102a`; PR #6 preservado em `e442a3b077e613eeb5f4a047374e83a41e0f7b2b`, descendente de #5. Os dois PRs estavam abertos, mergeable e com CI aprovada antes das edições.

## Diagnóstico reproduzido

`browser-popup-lifecycle.py --diagnose` foi executado antes de alterar `panels.js`, com 30 popups Leaflet distintos. No final: **30 observadores de mutação ainda registrados**, zero observadores de redimensionamento ativos e 180 registros dos seis listeners locais por popup sem remoção explícita. O listener global de resize retornava ao nível inicial (14). Alterar o DOM do último popup fechado executava **um callback** de preparação.

Isso confirma limpeza incompleta e trabalho em elemento fechado. Os contadores instrumentam registros sem manter referências fortes a nós ou callbacks (WeakMaps e metadados simples). Não são um perfil de heap: não demonstram crescimento ilimitado de memória ou retenção após coleta de lixo. `popup-baseline.json` é diagnóstico, não um teste aprovado.

## Correção fundamentada

- Guardar o MutationObserver e desconectá-lo no dispose, junto com ResizeObserver e listener global.
- Remover os seis listeners do popup e interromper um arraste em andamento, liberando captura e estado visual.
- Resume prepara o conteúdo que mudou enquanto fechado e reativa observadores/listeners uma única vez. Bind, dispose e resume repetidos são idempotentes.
- Painéis permanentes continuam ativos durante sua vida útil; posição visual, coordenadas, dados, conteúdo do Leaflet e contratos cartográficos não são alterados.

## Validação

- **107/107 testes unitários**, sem falhas ou ignorados.
- **34 grupos de navegador**: 14 operacionais, 11 Rodada 02, 4 FE-01A, 2 mobilidade e 3 novos de ciclo de vida.
- Após 30 ciclos: **zero** observadores/listeners de popup ativos, sem callbacks em conteúdo fechado, listener global no nível inicial. Reutilização do mesmo nó, troca de cabeçalho, bind/dispose repetidos, fechamento durante captura, arraste por mouse/toque e setas preservando coordenadas aprovados.
- Sintaxe JavaScript/Python e diff check aprovados. O novo script é chamado pela suíte operacional existente, incluindo a CI do PR.

Os JSON deste diretório registram a execução local antes do commit (SHA-base e worktree modificada); o manifesto liga os resultados aos hashes exatos do código corrigido. As regressões completas e a CI serão executadas/verificadas no HEAD final, com resultados identificados pelo SHA no relatório de entrega e nos artefatos oficiais de Actions. Evidências antigas em `tests/evidence/panels` e `tests/evidence/fe02` são preservadas.

GIS externo: **503 simulado**; CDN com TLS normal. Os testes são reais de navegador com fixtures locais, sem homologação de serviços externos, GPS físico ou site publicado. Nenhum merge de PR, force-push, alteração de main/Pages ou publicação foi realizado.

## Reproduzir

Com o servidor existente na porta 8080:

```sh
npm test
python tests/browser-operations.py
python tests/browser-round2.py
```

O modo `--diagnose` coleta o estado para comparação e não aplica expectativas de aprovação. O modo normal do teste de ciclo de vida verifica a limpeza e falha na implementação anterior.
