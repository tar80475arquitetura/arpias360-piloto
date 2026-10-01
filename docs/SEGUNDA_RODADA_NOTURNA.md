# Segunda rodada e checkpoint — 01/10/2026

Branch exclusiva: `codex/gecad-final`. Base: `e6c2cde`. Commit desta rodada identificado no histórico por `fix: estabiliza ortofoto oficial e encerra checkpoint noturno`.

## Resultado

Foto Aérea 2019 confirmada visualmente em **1366x768 e 390x844**, exclusivamente pelo serviço oficial de Niterói, com as quatro camadas da Defesa Civil sobrepostas. Trocas Ruas → Foto Aérea → Satélite → Foto Aérea → Ruas realizadas; os 138 pontos continuam independentes da base. Nenhuma imagem de São Gonçalo substituiu a ortofoto.

Satélite NASA GIBS / VIIRS confirmado carregado com data **2026-09-29**, dois tiles válidos, nenhum tile de outra base permanecendo após o carregamento. É uma referência de menor resolução, ampliada além do zoom nativo 9; não representa tempo real. Fallback para ruas preservado para falha do satélite.

## Diagnóstico da ortofoto

REST oficial consultado antes da correção: [Mosaico 2019 MapServer](https://geo.niteroi.rj.gov.br/arcgis/rest/services/Imagens/Mosaico_2019_mapservice/MapServer?f=pjson).

- `singleFusedMapCache: true`: serviço em cache, compatível com `L.esri.tiledMapLayer`.
- Referência espacial 102100 / EPSG:3857; tiles PNG 256x256; LOD 0–23.
- Recursos Map/Query/Data e suporte a camadas dinâmicas também existem, mas não exigem substituir o consumo correto por tiles.
- Limites de escala 591657527.591555 a 70.5310735 e extensão oficial usados para restringir requisições à cobertura.
- Tile observado `12/2314/1558` retorna 404; `12/2315/1558` retorna 200, `image/png`, 71754 bytes. O 404 de um tile não demonstra indisponibilidade do mosaico inteiro.
- A implementação antiga removia a imagem inteira após qualquer tile com erro. Agora aguarda o lote de tiles e conserva a imagem quando houve tiles válidos, tolerando lacunas do mosaico. Falha completa continua explícita.
- Certificado não apresentou erro nas leituras REST desta rodada. A resposta PNG inspecionada não trouxe cabeçalho Access-Control-Allow-Origin; imagens carregaram no navegador local, sem erro fatal observado. Não houve desativação de certificado nem proxy.
- Timeout de seleção continua em 15 segundos sem tile válido. A opção da foto aérea permanece no catálogo, oferece nova tentativa e botão **Usar mapa de ruas**. Não muda silenciosamente a foto aérea para OSM.

Não foi alterada a arquitetura para export/image: a grade oficial mostrou-se compatível e carregou visualmente. A cobertura externa e lacunas brancas do próprio mosaico não são preenchidas com fotografia genérica.

## Correções concluídas

- Impedir que um tile ausente descarte a ortofoto válida.
- Restringir tiles da ortofoto à extensão informada pelo serviço.
- Mostrar falha da foto aérea explicitamente e oferecer escolha de ruas.
- Remover base anterior ao reutilizar satélite em cache.
- Fallback de satélite direcionado a ruas, evitando alternância entre bases com falha.
- Mensagem de busca vazia e invalidação de pesquisa anterior pendente.
- Cancelar geolocalização pendente ao limpar camadas.
- Evitar foco/reposicionamento atrasado de consulta que já foi fechada.
- Fechamento dos sheets por gesto para baixo na alça, além dos botões existentes; teste automatizado do limiar do gesto.
- Altura da área cartográfica em tela cheia e quebra de linha dos estados longos.
- Nomes oficiais de bairros vinculados às geometrias existentes, exibidos a partir do zoom 13. Nome municipal aplicado à maior geometria para evitar repetição nas ilhas. Texto proveniente dos atributos, sem HTML externo. A vinculação usa `onEachFeature`, documentado na [API Esri Leaflet](https://developers.arcgis.com/esri-leaflet/api-reference/esri-leaflet/feature-layer/).

## Testes

**21 testes aprovados, zero falhas**, executados com `node --test tests/core.test.cjs tests/location.test.cjs`. Cinco regressões adicionadas: satélite em cache, falha explícita da ortofoto, lote parcialmente válido, nomes territoriais como texto seguro e fechamento por gesto mobile. Mantidas as 16 verificações anteriores. Sintaxe de app.js e diff sem erros.

No navegador HTTP local já em execução: camadas isoladas 37/38/36/27; combinações Sirenes + Pluviômetros, Sirenes + NUDECs e todas as quatro, total 138. Limpeza repetida retornou zero pontos civis. Switch por Space testado no desktop. Link gerado foi aberto em nova aba e produziu um marcador e consulta com as coordenadas corretas; a nova aba iniciou com apresentação desktop. Não representa teste de WhatsApp real nem acesso remoto a localhost.

Inspeção inicial de **320x568, 360x800, 375x812, 390x844, 412x915, 430x932, 768x1024, 820x1180, 1280x720, 1366x768, 1440x900 e 1920x1080**, mais paisagem **844x390**. Sem rolagem horizontal do documento; botões principais dentro da viewport. Medidas de mapa durante transições não devem ser interpretadas como dimensões finais estabilizadas. Trocas entre retrato/paisagem preservaram o estado das camadas; reajuste por ResizeObserver e invalidateSize mantido. Console consultado ao final: sem erros/avisos capturados.

Não se declara auditoria WCAG completa. Leitor de tela, teclado virtual, posição real e negativa de permissão de geolocalização permanecem testes humanos pendentes. O gesto foi validado por teste automatizado, não por toque físico de um telefone.

## Arquivos e evidências

Alterados: `js/app.js`, `index.html`, `css/style.css`, `tests/core.test.cjs`. Acrescentados: `data/catalogo.json`, este relatório e `docs/testes-rodada2/`.

- `testes-rodada2/ortofoto-desktop.png`: Niterói, foto oficial e Defesa Civil.
- `testes-rodada2/ortofoto-mobile.png`: foto oficial e quatro camadas em 390x844.
- `testes-rodada2/satelite-desktop.png`: NASA carregado com quatro camadas.
- `testes-rodada2/resolucoes.json`: medidas iniciais da inspeção.

Os GeoJSON validados, manifesto recuperado e sua documentação permanecem idênticos à base da rodada. Não foram integrados dados temáticos dos municípios vizinhos nem criados valores cadastrais ou índices científicos.

## Pendências no checkpoint

O pedido de encerramento interrompeu a expansão do catálogo. `data/catalogo.json` salva somente um **rascunho de metadados**, com 12 grupos complementares às referências de mapa existentes, fontes identificadas e estados disponíveis/futuros. Ainda não é consumido pela aplicação. A reorganização visual nas 13 categorias e pesquisa por sinônimos **não estão concluídas**. As referências anuais de ITBI apontam à fonte geral, sem comprovação de cada arquivo anual; não devem ser usadas como prova de dados integrados.

Curvas de nível e áreas alagáveis: não há arquivo local e não foi identificado endpoint correspondente validado nos catálogos oficiais consultados. Permanecem previstas, sem geometria, botão funcional ou risco inferido. A camada genérica Área de risco não foi renomeada como alagamento. A existência de APP de declividade não foi interpretada como classes de declividade.

Municípios do entorno: os nomes existentes do mapa OSM continuam disponíveis. Ainda falta apresentação regional independente sobre foto aérea/satélite; não foram inventadas posições para São Gonçalo, Maricá, Rio de Janeiro ou Baía de Guanabara.

Nomes de bairros em polígonos multipartes podem repetir-se nas partes pequenas; requer revisão de decluttering em nova tarefa. Não impede seleção de base ou acesso aos pontos.

**Decisão humana necessária:** validar a fonte e o significado de alagamento, curvas de nível, recortes regionais e dados anuais antes de integrar. Nenhuma pontuação de fragilidade, cadastro fiscal, ITBI, ISP, Cemaden, S2ID ou fonte temática complexa foi implementada.

Próxima tarefa recomendada: concluir o catálogo e sua busca, mantendo estados honestos; depois validar e integrar oficialmente relevo, alagamento e rótulos regionais. A rodada encerra após commit e push exclusivo da branch. Sem merge, produção ou nova funcionalidade após o checkpoint.
