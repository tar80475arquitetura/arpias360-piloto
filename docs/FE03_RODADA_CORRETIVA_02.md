# FE-03 | Rodada Corretiva 02

Esta revisão continua o PR #7 em rascunho, na branch `codex/fe03-revisao-frontend`, sem reconstruir a FE-03. Referência inicial: `ab885c61040a0db08505efc4f56ae1fb991c1d00`. Base inspecionada: `d649c16b0e84ab8655d9a39a4a55df32554b5578`. Após a instrução complementar pré-push, o HEAD permanece ab885c6 e as correções estão na árvore local, sem commit. SHA final/candidato ainda não existe; depende da revisão do diff e autorização subsequente.

## Autorização e limites

O proprietário autorizou expressamente as correções mínimas em `configurePanel()` e Tab de `js/app.js`, `hide()` de `js/portal-ui.js` e restauração de foco em `js/tools.js`, mantendo consultas, medições, desenhos e confirmações. Registro **informado pelo proprietário**: 11/10/2026 às 21h19, America/Sao_Paulo. Primeira consulta disponível ao relógio depois da mensagem: **2026-10-12 00:21:18 UTC / 11/10/2026 21:21:18 −03**. Essa consulta não comprova o horário efetivo de recebimento.

Antes das edições funcionais, HEAD e upstream foram reconfirmados; os três módulos estavam sem alterações locais e sem conflitos. Os arquivos de documentação/testes já preparados foram preservados. Não foram encontrados PRs/branches identificáveis da Jornada Territorial 001 na leitura do repositório oficial; isso não prova ausência de trabalhos privados.

Merge não autorizado. Publicação autorizada condicionalmente, aguardando confirmação expressa posterior. Rollback: documentação autorizada, execução não autorizada. Main, Pages, dados, geometria, simbologia cartográfica e dependências não são modificados. Etapa C pendente.

## Diagnóstico e semântica de Camadas

Antes: desktop não modal; abaixo de 900 px, `configurePanel()` escrevia `role=dialog` e `aria-modal=true`, ativava o fundo e aplicava `inert` à topbar, mapwrap e ações móveis. O handler de Tab circularizava o foco nas extremidades do painel compacto. Fechar removia esses estados e `closeLayers(true)` devolvia o foco ao `panelOpener`. Recolher/mover não removia modalidade/inert. Resultado reproduzido em **768×1024, 390×844 e 320×568**: região visual livre, mas sem pan/zoom; o clique no fundo fechava o painel. Desktop **1366×768** operava normalmente.

Depois: Camadas é um `aside` não modal em todas as larguras. O estado fechado conserva `aria-hidden=true` e `inert` somente no painel. Aberto, sem `aria-modal`, sem role de diálogo atribuído por Camadas e sem fundo bloqueador. Tab/Shift+Tab seguem a ordem do documento, sem ciclo modal. Os controles expandidos, foco inicial compacto, rolagem, posições e retorno pelo controle de abertura permanecem. O Portal mantém seu bloqueio próprio da aplicação e seu ciclo de teclado; `hide()` restaura os atributos salvos e chama `configurePanel()` para reconciliar o estado. Diálogos nativos de confirmação/informações permanecem modais.

CSS não consegue tornar focável um descendente de `inert` nem reconciliar semântica ARIA e aprisionamento de Tab. Ocultar o fundo por CSS seria insuficiente. Riscos: interação acidental fora do painel, conflito com retorno do Portal e mudança de ordem de navegação; regressões cobrem esses estados separadamente. Sem correção, P3 permaneceria bloqueado mesmo com área visível.

## Rastreabilidade dos trechos funcionais

As linhas anteriores são do commit inicial `ab885c6`; as posteriores são desta rodada. Inserções são explicitamente identificadas. O [diff remoto do PR #7](https://github.com/tar80475arquitetura/arpias360-piloto/pull/7/files) mostra somente alterações já enviadas. O patch completo desta rodada, incluindo arquivos novos, é apresentado na descrição do PR antes de qualquer commit/push.

| Arquivo / função | Antes → depois | Causa / implementação mínima | Justificativa e regressão |
|---|---|---|---|
| `js/app.js`, `configurePanel()` | 773 → 773–774; 775–777 → 776–778; 779–780 → 780–781 | Modalidade compacta bloqueava mapa/topbar. Camadas não modal, fundo sempre oculto, mapwrap/ações móveis sem inert; topbar respeita Portal visível; remove apenas semântica modal criada para Camadas | P3; 4 larguras, aberto/recolhido/movido/fechado, pan por mouse/toque/teclado e zoom por roda; Portal mantém ancestor inert |
| `js/app.js`, listener `keydown` de Camadas | 814 → 815 | Tab era aprisionado por largura. Ciclo só se aplica a um painel efetivamente marcado modal | P3/acessibilidade; Tab e Shift+Tab nas extremidades, sem alterar atalhos de movimento |
| `js/portal-ui.js`, `hide()` | 51–52 → 51–52 | Saída do Portal recolocava inert na topbar quando Camadas compacto aberto. Reconciliado por `configurePanel()` | P3; retorno do Portal com Camadas aberto, rolado, recolhido; mudança de viewport; seleção, ferramentas e preferências preservadas |
| `js/tools.js`, estado da IIFE | inserção após 15 → 16 | Não existia registro do controle iniciador. Adicionado `toolOpener` | P1; Consultar, Medir, Editar e iniciador não focável |
| `js/tools.js`, `request(next)` | inserção após 42 → 44–45 | Origem precisa ser capturada antes das confirmações assíncronas; retorno só quando a saída foi iniciada dentro da ferramenta | P1; cancelamento não rouba foco, busca externa preserva foco |
| `js/tools.js`, `request(next)` | inserção após 57 → 61–69 | Ocultar ferramenta focada fazia foco cair no BODY. Depois de transição bem-sucedida, usa origem conectada, focável/visível e sem hidden/inert/aria-hidden; fallback Consultar ou Mais | P1; Tab/Shift+Tab/Enter em 3 ferramentas × 4 viewports; confirmação cancelada preserva edição e feição, aceite restaura backup |

Consultas, handlers de desenho, métricas, confirmações, persistência e geometria não tiveram lógica alterada. CSS não pode restabelecer um destino dinâmico de foco ao ocultar o elemento ativo. A restauração ocorre depois das validações, nunca no caminho de recusa/falha. O botão Medir/Editar do menu fechado usa **Mais** como fallback visível.

## Workflow e reprodução

Mantido `fetch-depth: 2` exclusivamente no checkout do job **browser**. Consumidores: `tests/browser-operations.py` lê `pull_request.base.sha`, executa `git cat-file -e <base>^{commit}` e `tests/browser-fe03.py` executa `git show <base>:<arquivo>`. O checkout de PR é um merge virtual: profundidade 2 inclui seu pai-base; profundidade 1 não fornece esses blobs. A comparação anterior/posterior é renderizada por interceptação local dos arquivos Git, sem mudar o checkout.

Também é obtido **somente o commit fixo ab885c6**, por `git fetch --no-tags origin ab885c61040a0db08505efc4f56ae1fb991c1d00 --depth=1`, para a comparação corretiva antes/depois. Ele não é garantido pelos dois níveis do merge virtual após um novo commit na branch. Não há troca de branch, reset ou integração.

A comparação agora substitui os quatro arquivos de apresentação e os três módulos JavaScript autorizados, com tipos MIME apropriados. Os demais scripts/dados permanecem iguais. Isso evita comparar CSS antigo com lógica funcional nova.

```sh
npm ci --ignore-scripts --cache /tmp/arpias-fe03-npm-cache
npm test
ARPIAS_TEST_OUTPUT=/tmp/arpias-browser python tests/browser-operations.py
ARPIAS_TEST_OUTPUT=/tmp/arpias-browser python tests/browser-round2.py
ARPIAS_FE03_PHASE=before ARPIAS_FE03_BASE_REF=ab885c61040a0db08505efc4f56ae1fb991c1d00 ARPIAS_TEST_OUTPUT=/tmp/arpias-browser python tests/browser-fe03-corrective.py
ARPIAS_TEST_OUTPUT=/tmp/arpias-browser python tests/browser-fe03-corrective.py
```

O servidor já existente na porta 8080 foi reutilizado. `npm ci --ignore-scripts` com o cache padrão falhou; usando cache gravável em `/tmp`, instalou corretamente, sem modificar lockfile ou dependências. A suíte corretiva da versão candidata falha se P1/P3 falharem. A referência histórica testa explicitamente a reprodução negativa: 12 retornos incorretos e 36 interações bloqueadas. Isso não dispensa nenhuma asserção da candidata.

`tests/browser-round2.py`: a fixture 503 desmarca o relevo antes de `check()` verificar seu estado transitório, gerando uma corrida. Substituído por clique real, exigindo controle inicialmente desmarcado e, depois, estado de falha, controle desmarcado e `relief.ready=false`. Não foi alterada expectativa para aprovar um defeito.

## Evidências e classificação

Arquivos anteriores preservados: 43 capturas anteriores e 48 posteriores, relatórios e pacote local. Artefato histórico não expirado, metadados consultados novamente: [execução 38183814303 / artefato 11718777080](https://github.com/tar80475arquitetura/arpias360-piloto/actions/runs/38183814303/artifacts/11718777080), vinculado ao HEAD ab885c6. O download do armazenamento retornou 403 neste ambiente; o download pelo proprietário não foi certificado. URLs de artefatos exigem autenticação normal no GitHub. Não se oferece `/workspace` como entrega pública.

As evidências desta rodada são regeneradas por navegador a partir dos blobs Git e do checkout candidato. O upload `if: always()` inclui JSONs, capturas, `COMPARACOES.md`, logs do servidor e este relatório. Nenhuma captura é versionada ou publicada em Pages. A CI nova depende de autorização de push; nenhum artefato novo é alegado antes dessa autorização. A descrição registra os resultados locais e a limitação de entrega visual.

- **Git:** SHAs, branch/upstream, diff, dados/dependências preservados, PR em rascunho.
- **Testes locais:** instalação com cache gravável, unitários, sintaxe e integridade do diff.
- **Navegador:** Chromium controlado, geometria/estados/contrastes, ponteiro, toque CDP, teclado e zoom nativo 200%.
- **CI:** resultado somente da execução vinculada ao SHA final; o resultado histórico não substitui esse registro.
- **Não verificado:** leitores de tela, aparelhos físicos, demais navegadores e homologação integral dos serviços GIS públicos.
- **Pendente de autorização:** paleta, merge, publicação, rollback e escolha da sequência de homologação.

Fontes GIS externas retornam 503 **simulado** nas regressões. Leaflet/Esri são obtidos com TLS padrão. Esses testes não certificam a disponibilidade real de ortofoto, WFS ou NASA.

## Contraste e área

Método WCAG 2.x: converter sRGB em luminância relativa, compor transparências sobre o fundo renderizado e calcular `(Lmaior+0,05)/(Lmenor+0,05)`. Texto, limites/ícones e foco são registrados separadamente; nenhuma certificação WCAG geral é declarada.

**Indicador de foco `#1C3F60` sobre fundo branco `#FFFFFF`: contraste aproximado de 10,88:1.** Borda `#6E8274` sobre branco: 4,11:1; anterior `#A3B5A6`: 2,16:1. Cor de foco anterior `#895B00` e fundos efetivos de cada estado constam nos JSONs de contraste. Capturas incluem trabalho/visibilidade, carregamento/falha, menu e consulta. Paleta permanece proposta, sem nova alteração; tokens cartográficos permanecem intactos.

Área: mapa menos união exata dos retângulos obstrutores, intersectados ao mapa, por varredura de intervalos; sobreposições contam uma única vez. `fe03-comparacoes.json` e `COMPARACOES.md` registram 39 cenários com contêiner/áreas/percentuais, estado, zoom, diferenças em px² e pontos percentuais; 43 pares visuais da base main versus FE-03. A suíte corretiva compara adicionalmente a FE-03 inicial com esta rodada, registrando região visual livre, inert, hit testing e eventos Leaflet. Cantos arredondados são aproximados por retângulos e sombras excluídas; uma sondagem de interação não prova todos os pixels. Área visual não prova operação.

## Retificação dos horários da Fase 2

Leitura dos campos `merged_at` do GitHub:

- [PR #5](https://github.com/tar80475arquitetura/arpias360-piloto/pull/5): **2026-10-11T20:52:36Z / 11/10/2026 17:52:36 −03**, merge b12b851bb932ee6c801477bdc994a24d0f5fc754.
- [PR #6](https://github.com/tar80475arquitetura/arpias360-piloto/pull/6): **2026-10-11T21:01:32Z / 11/10/2026 18:01:32 −03**, merge d649c16b0e84ab8655d9a39a4a55df32554b5578.

Os registros de relógio 20:51:14Z e 21:00:11Z das autorizações anteriores são consultas após as mensagens. **Horário efetivo de recebimento: não confirmado.** Não se alteram registros históricos nem se inventa precisão. Descrições humanas dos critérios/limitações da FE-03 foram traduzidas para português, preservando identificadores técnicos.

## Integração, homologação e reversão — somente planejamento

A configuração e versão pública foram verificadas por leitura e registradas abaixo e na descrição do PR. Havendo Pages `main / (root)`, o fluxo existente exige integração na main; sem autorização separada, nenhuma integração/publicação será feita.

Após aprovação visual, P1/P3 validados, CI exata e evidências disponíveis: confirmar novamente HEAD/base, conflitos e árvore resultante; solicitar autorização específica para merge commit normal e publicação automática pelo fluxo existente. Sem squash/rebase/force, sem mudar origem do Pages e sem excluir branches.

**Alternativa A:** homologar primeiro a versão pública atual, preservando sua referência/evidências, e depois decidir pela FE-03. **Alternativa B:** integrar/publicar FE-03 antes da homologação integral da versão anterior, exigindo aceitação expressa da substituição de uma referência pública ainda não homologada. Nenhuma alternativa é escolhida automaticamente.

Rollback futuro: a referência anterior é main d649c16, sujeita à confirmação pública byte a byte registrada no PR; candidata ainda não tem SHA commitado; após autorização, será o SHA final aprovado do PR. Para reverter um eventual merge, preparar nova branch/PR com `git revert -m 1 <SHA_DO_MERGE_FE03>` e revisar a árvore resultante contra a referência anterior, preservando alterações posteriores legítimas. Merge e publicação da reversão exigem nova autorização. Riscos: commits posteriores/deploy em andamento, preferências salvas do navegador e indisponibilidade externa. Não se altera main nem se executa reversão nesta rodada.

Após publicação autorizada: acompanhar CI e deploy vinculados ao merge; carregar aplicação com TLS válido; testar controles, Camadas livre, teclado/foco, seleção/relatório, trabalho, preferências, portal e painéis nas quatro larguras/200%; verificar serviços GIS reais e registrar indisponibilidades separadamente. Comparar byte a byte HTML/CSS/JS/SVG/dados sem transformação com os blobs do SHA aprovado. Divergência é falha até explicação verificável. Para transformação comprovada, registrar origem/destino/processo e equivalência alternativa; não presumir transformação. Sucesso de rollback exige CI/deploy verdes, integridade da árvore/publicação anterior e regressões/homologação aplicáveis aprovadas. TLS público bloqueado implica “não realizada”.

## Arquivos desta rodada e necessidade

| Arquivo | Prioridade / motivo / validação |
|---|---|
| `js/app.js` | P3; semântica/interação e Tab, autorização específica, sondagens de mapa/teclado |
| `js/portal-ui.js` | P3; reconciliar retorno do Portal, autorização específica, regressão Portal com painéis |
| `js/tools.js` | P1; registrar/restaurar foco, autorização específica, encerramento/recusa de confirmações |
| `tests/browser-fe03-corrective.py` | P1/P3; reproduzir causas e validar correções com eventos, teclado, desenho sintético e capturas |
| `tests/browser-fe03.py` | P1–P4; relatórios em português, base funcional autêntica e índice/deltas reproduzíveis de comparação |
| `tests/browser-round2.py` | P1/P3/regressão; corrigir corrida de fixture mantendo estado final exigido |
| `.github/workflows/test.yml` | P1/P3/evidências; executar comparações críticas e preservar artefatos mesmo se houver falha; manter profundidade justificada |
| `docs/FE03_REVISAO_FRONTEND.md` | P1–P4; corrigir linguagem/alegações anteriores e vincular diagnóstico atual |
| `docs/FE03_RODADA_CORRETIVA_02.md` | P1–P4; autorização, rastreabilidade, resultados e governança |

Não houve nova alteração de cor/ícone/layout CSS na corretiva: nesses aspectos visuais, **não aplicável**, pois a implementação anterior foi preservada. P2 permanece sob verificação de nomes, SVGs e hierarquia; P4 depende da aprovação da paleta. A mudança perceptível de P3 é a retirada do fundo modal bloqueador em tablet/celular. P1 passa a mostrar foco no controle válido após encerramento; no desktop também há essa mudança de interação/foco.

## Resultados locais e revisão pré-push

- Unitários: **111 aprovados, 0 reprovados, 0 ignorados, 0 pendentes**.
- Regressões de navegador anteriores: **48 grupos aprovados** (14 operações + 4 FE-01A + 2 painéis + 9 Portal + 3 ciclo de popups + 5 FE-03 + 11 Rodada 02).
- Correção: **80 sondagens de mapa + 12 retornos de foco aprovados**, 24 verificações nas extremidades Tab/Shift+Tab e confirmação de edição cancelada/aceita, foco de busca externa e iniciador não focável. Não confundir grupos com asserções.
- Referência inicial: 12 retornos ao BODY e 36 interações bloqueadas reproduzidos. São reproduções negativas esperadas, não falhas da candidata.
- Falhas de preparação: cache padrão npm e corrida da fixture do relevo corrigidos e registrados; falhas finais da candidata: zero.
- Ignorados: zero; não executados: leitores de tela, aparelhos físicos, outros navegadores, homologação GIS integral e CI das alterações locais. Resize por teclado não existe.
- Capturas regeneradas: **43 pares main/FE-03 + 32 pares FE-03 inicial/corretiva**, estes últimos com 20 estados de painel e 12 fechamentos de ferramentas por versão. Conteúdo comparativo local existe; **URLs novas para os binários ainda indisponíveis**. Não se declara entrega/auditoria visual concluída.

| Viewport | Mapa px² | Área útil antes/depois, Camadas aberto | Diferença px² / p.p. | Fechado, diferença px² / p.p. |
|---|---:|---|---|---|
| 1366×768 | 939.808 | 72,525% / 73,476% | +8.932,25 / +0,950 | −532 / −0,057 |
| 768×1024 | 728.064 | 0% / 66,498% | +484.148,41 / +66,498 | −532 / −0,073 |
| 390×844 | 287.040 | 0% / 36,558% | +104.936,88 / +36,558 | −1.020 / −0,355 |
| 320×568 | 147.200 | 0% / 15,223% | +22.408,56 / +15,223 | −1.020 / −0,693 |
| Zoom 200%, CSS 683×340 | 180.653,5 | 0% / 39,891% | +72.064,36 / +39,891 | −532 / −0,294 |

Comparação main d649c16 versus candidata local, com união de obstruções e fundo modal; perdas com painel fechado são regressões geométricas documentadas pelos alvos maiores da FE-03 inicial. Nos estados abertos corrigidos, os eventos de pan/zoom passaram; sondagens não certificam todos os pixels. Os 39 registros completos incluem dimensão do contêiner, área total/obstruída/útil, zoom, estado e limites do método.

Pages: `main / (root)`, `build_type=legacy`, estado `built`, HTTPS obrigatório. Verificação **2026-10-12 00:30:23 UTC / 11/10/2026 21:30:23 −03**, método `gh api repos/tar80475arquitetura/arpias360-piloto/pages`. Endereço: https://tar80475arquitetura.github.io/arpias360-piloto/. Consulta pública somente de integridade, com TLS padrão: **38/38 arquivos idênticos** aos blobs de main d649c16, em **00:30:42 UTC / 21:30:42 −03**. Isso confirma a referência estática anterior; não equivale à homologação funcional pública nem escolhe alternativa A/B.

Conforme instrução complementar: nenhuma autorização de commit/push decorre da apresentação. Somente edição da descrição do PR para evidências está autorizada, preservando integralmente o texto anterior; sem comentários, reviews, título, labels ou estado. Capturas novas carecem de URL verificável; resultados locais relatados não são execução de CI. Artefato futuro é complementar, após eventual autorização de push. Ao apresentar diff/resultados, parar e aguardar decisão expressa entre revisão parcial e outro meio de entrega.
