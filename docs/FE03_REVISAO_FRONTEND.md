# FE-03 — revisão geral do frontend

Proposta para revisão do proprietário, em `codex/fe03-revisao-frontend`. Base inspecionada: `d649c16b0e84ab8655d9a39a4a55df32554b5578`, igual ao SHA histórico da auditoria. Nenhuma alteração posterior ou branch/PR da Jornada Territorial 001 foi encontrada no repositório oficial na inspeção. A homologação pública da Etapa C permanece pendente.

## Diagnóstico e solução

| Prioridade | Problema e evidência | Impacto | Solução | Arquivos | Risco | Verificação |
|---|---|---|---|---|---|---|
| P1 | `--control-line:#a3b5a6` tem 2,16:1 sobre branco; botões de ação com borda transparente; foco `#895b00` tem 1,21:1 contra consult `#9b661a` | Limites e foco pouco distintos | Linha neutra mais escura, foco azul com separador branco em superfícies claras, foco claro em categorias escuras; disabled com texto legível e borda tracejada | CSS principal | Recorte do foco e aparência dos estados | Contraste renderizado, teclado, estados de trabalho/visibilidade/carregamento/falha |
| P2 | Menu mistura glifos tipográficos e SVGs; busca móvel tem SVG sem indicação decorativa; valores de controles divergentes | Alinhamento e linguagem visual inconsistentes | SVGs próprios com viewBox 24, decoração explícita, tokens de foco/linha/raios/espaçamento | index e CSS principal | Nome acessível ou referência quebrada | Nomes dos botões, consumo de tokens, capturas do menu |
| P3 | Camadas cobre o zoom no desktop; ferramenta à esquerda pode ficar atrás de Camadas; contexto/legenda precedem as ações; zoom de 38–42px | Ações encobertas, pouca área útil e alvos pequenos | Camadas ao lado do zoom e altura inicial 480px; ferramenta à direita no desktop; contexto compacto, legenda após catálogo; zoom e pega da busca com 44px | CSS e index | Posições salvas, rolagem e arraste | União de retângulos, hit testing, quatro larguras e zoom nativo 200%, movimento/resize |
| P4 | Cores de interface repetidas e foco próximo a estado cartográfico | Confusão entre função do controle e significado do mapa | Proposta mantém verde institucional, distingue foco, linha, disabled e ações; tokens temáticos intactos | CSS principal | Percepção cromática e aceitação do proprietário | Pares medidos, diffs de dados/JS e avaliação visual |

## Apresentação implementada

- Bordas `--control-line:#6e8274`: 4,11:1 sobre branco e 3,81:1 sobre `--row-surface:#f5f7f3`.
- `--focus:#1c3f60`: 10,88:1 sobre fundo branco `#FFFFFF`. O foco claro `--focus-on-dark:#f4e3a7` tem 10,32:1 contra `--panel-surface:#19352d`. O contorno branco adjacente é registrado separadamente; não se presume o fundo pela cor do estado.
- Novos tokens: `--focus-gap`, `--space-1` a `--space-4`, `--radius-control`, `--radius-panel`, `--panel-height`. Consumidores antigos permanecem; nenhum token temático foi renomeado ou alterado.
- Ícones do menu, fechamento e busca usam SVGs próprios. IDs, textos e nomes acessíveis dos botões foram preservados. Não houve importação de ícones ou dependências.
- Contexto em grid compacto; legenda de maturidade depois das categorias. O texto integral, maturidade, disponibilidade, `publicStatus()` e `data-state` permanecem.
- Desktop: controle de zoom visualmente exposto ao lado do painel no desktop; ferramenta ativa no lado oposto. Mobile: cabeçalho e controles preservados, com rolagem interna. Movimento reduzido continua respeitado.

Os valores acima são pares intrínsecos reproduzíveis por luminância WCAG 2.x. As evidências de navegador incluem fundos efetivos compostos e estados renderizados. Não constituem uma declaração geral de conformidade WCAG.

## Medição da área útil

`tests/browser-fe03.py` intersecta retângulos visíveis com o mapa, varre intervalos verticais e calcula sua união, contando sobreposições somente uma vez. Considera busca, Leaflet, estados, painéis, menus, popups e fundo modal.

`Área útil = área total − união das áreas obstruídas`.

Capturas e medições são equivalentes em 1366×768, 768×1024, 390×844, 320×568 e zoom nativo 200% (janela 1366×768; viewport CSS medido 683×340). A altura real e pixels fracionários são registrados no JSON. Estados: fechado, menu, aberto, recolhido, trabalho/foco, visível, carregamento, falha e consulta; zoom inclui fechado/menu/aberto.

No desktop com Camadas aberto, a amostra passou de 72,53% para 73,48% de área útil (+8.932,25px²; +0,95 ponto percentual). Com painéis fechados houve perda de 532px² no desktop/tablet e 1.020px² no celular, decorrente da ampliação do zoom para alvos de 44px. Os controles continuam acessíveis e sem rolagem horizontal; a perda é menor que 0,70 ponto percentual nas quatro larguras.

**Tablet/celular com Camadas aberto ou recolhido: área útil operável de 0% nos dois estados**, pois o fundo modal existente cobre o mapa e bloqueia interação. Esse era o comportamento da FE-03 inicial; a Rodada Corretiva 02 recebeu autorização específica para remover a modalidade. Os novos resultados operacionais e suas limitações constam no relatório corretivo. Não se contabiliza a região esmaecida como área operável no registro histórico.

Limites: retângulos incluem os cantos arredondados transparentes; sombras não são contabilizadas. Não é análise pixel a pixel. GIS simulado; não demonstra disponibilidade pública das fontes.

## Evidências e testes reproduzíveis

Reutilize o servidor existente se a porta 8080 já estiver em uso. Com dependências instaladas:

```sh
npm ci --ignore-scripts
npm test
ARPIAS_TEST_OUTPUT=/tmp/fe03-after python tests/browser-operations.py
ARPIAS_TEST_OUTPUT=/tmp/fe03-round2 python tests/browser-round2.py
ARPIAS_FE03_PHASE=before ARPIAS_FE03_BASE_REF=d649c16b0e84ab8655d9a39a4a55df32554b5578 ARPIAS_TEST_OUTPUT=/tmp/fe03-before python tests/browser-fe03.py
```

A coleta anterior rende os quatro arquivos de apresentação diretamente dos blobs Git da base, sem modificar o checkout. Na implementação inicial, os módulos funcionais/dados eram idênticos à base. Após autorização específica, a coleta substitui também os três módulos funcionais corrigidos; dados continuam idênticos. CSS, index, cenários, alturas, fixtures e método são identificados nos resultados; hashes vinculam o código às capturas posteriores.

O job browser obtém duas gerações do histórico para acessar o pai-base do merge virtual. No PR desta branch, o harness produz antes/depois no artefato `navegador-<SHA>`; em outros PRs/pushes, continua com a regressão posterior. Nenhuma configuração de publicação é alterada.

Localmente, Leaflet/Esri são obtidos com TLS padrão e GIS externo recebe 503 **simulado**. Não confundir testes com homologação GIS pública. Não há testes físicos de toque/GPS ou leitores de tela. O zoom 200% usa preferência nativa do Chromium, não CSS zoom/pinch.

`tests/browser-fe03.py` testa movimento por ponteiro, toque via CDP e teclado separadamente nas quatro larguras. Resize nativo de Camadas por ponteiro e toque foi observado nesse Chromium. Resize por teclado **não existe** no contrato e não foi introduzido. Isso não certifica dispositivos físicos ou outros navegadores.

Meta 44×44: zoom, busca e controles medidos das camadas atingem a meta. Exceção medida: crédito inline Leaflet de 48,80×15px, mantido por atribuição/legalidade e operação por Tab/Enter; pode exigir precisão ao toque. Vértices de edição permanecem com seu símbolo compacto e a região adicional de hit testing existente; não houve ampliação de geometria ou novo mecanismo de resize.

## Arquivos fora do escopo principal

| Arquivo | Justificativa individual | Prioridade e regressão |
|---|---|---|
| `tests/browser-fe03.py` | Medições de DOM, contraste composto, baseline Git, capturas, hit testing e modalidades não podem ser demonstrados apenas editando CSS/HTML | P1–P4; cinco cenários de viewport, estados e métricas |
| `tests/browser-operations.py` | Executar a nova regressão e a comparação anterior no harness/artefato existentes, mantendo todas as suítes antigas | P1–P4; comando operacional inteiro e CI |
| `.github/workflows/test.yml` | `fetch-depth:2` somente no checkout do browser disponibiliza a base do merge virtual para evidências comparativas autênticas | P1–P4; job browser e artefato; sem dependências/workflows de publicação |
| `docs/FE03_REVISAO_FRONTEND.md` | Explicar diagnóstico, métodos, restrições e pendências de revisão | P1–P4; correspondência com resultados e diff |

## Limites e decisões pendentes

- **Retorno de foco ao encerrar ferramenta por Enter:** na base e na FE-03 inicial, terminava no `body`. A Rodada Corretiva 02 recebeu autorização específica e implementou restauração de foco em `js/tools.js`; os resultados atuais são registrados no relatório corretivo. Navegação/foco do portal e diálogos nativos seguem com suas regressões existentes.
- Na FE-03 inicial, Camadas recolhido mantinha o mapa modal/inert em tablet/celular. A corretiva altera a semântica para painel não modal, conforme autorização específica.
- Paleta e aprovação visual pertencem ao proprietário. Não usar `#187D87`; nenhuma cor de cartografia foi modificada.
- Exceções de alvo compacto, toque físico, outros navegadores, leitor de tela e homologação pública permanecem pendentes.
- A descrição do PR e relatório da entrega registram os resultados efetivamente executados e o SHA final. Nenhuma captura nova em `tests/evidence/`; imagens e JSON ficam nos artefatos e na entrega verificável da sessão.
- Na implementação inicial não houve mudanças funcionais. A corretiva altera somente os três trechos JavaScript expressamente autorizados; panels.js, dados, geometria, indicadores, metodologia, pacotes e lockfile permanecem preservados. Sem Jornada 001, merge, alterações de Pages ou publicação.

## Rodada Corretiva 02

O relatório anterior não prova operação em telas menores. Consultar [diagnóstico, verificações atuais e governança](FE03_RODADA_CORRETIVA_02.md). As correções específicas de P1/P3 foram autorizadas; somente resultados executados e CI vinculada ao novo SHA sustentam sua validação. Evidências locais não são links públicos; capturas e relatórios são disponibilizados no artefato do PR, com URLs registradas na descrição.
