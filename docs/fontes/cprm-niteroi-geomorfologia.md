# Base geomorfológica de Niterói — validação em 01/10/2026

DANTAS, Marcelo E.; COSTA, Lais. Carta geomorfológica: município de Niterói, RJ. CPRM, fevereiro de 2017. Escala 1:30.000. [Registro institucional](https://rigeo.sgb.gov.br/handle/doc/17483).

## Original e integridade

Encontrado em C:\Users\tar_p\Downloads\niteroi_padraoderelevo.zip. Copiado, sem alteração, para data/raw/cprm/niteroi_padraoderelevo.zip. SHA-256: **d3ed15b364d452436178b612268e9d7de201fbce2ad3cd1e472dbd7caff99b95**. CRC de todos os membros validado. Downloads preservado. O bloqueio anterior por ausência local do ZIP foi resolvido nesta rodada.

Inventário completo:

| Membro | Bytes |
| --- | ---: |
| niteroi_padraoderelevo/ | 0 |
| niteroi_padraoderelevo/limite_niteroi.cpg | 5 |
| niteroi_padraoderelevo/limite_niteroi.dbf | 1167 |
| niteroi_padraoderelevo/limite_niteroi.prj | 418 |
| niteroi_padraoderelevo/limite_niteroi.sbn | 132 |
| niteroi_padraoderelevo/limite_niteroi.sbx | 116 |
| niteroi_padraoderelevo/limite_niteroi.shp | 115552 |
| niteroi_padraoderelevo/limite_niteroi.shp.xml | 30902 |
| niteroi_padraoderelevo/limite_niteroi.shx | 108 |
| niteroi_padraoderelevo/niteroi_padraoderelevo.lyr | 14336 |
| niteroi_padraoderelevo/Niterói.cpg | 5 |
| niteroi_padraoderelevo/Niterói.dbf | 778165 |
| niteroi_padraoderelevo/Niterói.prj | 151 |
| niteroi_padraoderelevo/Niterói.sbn | 4148 |
| niteroi_padraoderelevo/Niterói.sbx | 468 |
| niteroi_padraoderelevo/Niterói.shp | 3580056 |
| niteroi_padraoderelevo/Niterói.shp.xml | 52154 |
| niteroi_padraoderelevo/Niterói.shx | 3292 |

## Shapefiles reais

### limite_niteroi.shp

1 feições; tipo POLYGON; CRS original **EPSG:31983**, confirmado pelo próprio PRJ; codificação UTF-8. Campos originais: nm_municip, cd_geocmu, geometriaa, anoderefer, uf, tipo, fonte, shape_Leng, EXECUCAO, CONSISTIDO, Carta_Susc, Shape_Le_1, Shape_Area, encarterel, Mesorregio, ORDEM.

Extensão do derivado EPSG:4326: [-43.13908662174984,-22.989758335079024,-42.95284549672165,-22.853767011938007]. Derivado: data/processed/cprm/limite-pacote.geojson.

### Niterói.shp

399 feições; tipo POLYGONM; CRS original **EPSG:4674**, confirmado pelo próprio PRJ; codificação UTF-8. Campos originais: GEOMETRIA, MUNICIPIO, UF, UnMorfoest, UnMorfoesc, UnGeomorf, PADRAO, COD_REL, OBS, Amplitude, Declividad, Declivid_1, Shape_Leng, Shape_Area, AREA_KM2.

Extensão do derivado EPSG:4326: [-43.13695410999998,-22.98209105099994,-42.95284549699994,-22.853767010999945]. Derivado: data/processed/cprm/padroes-relevo.geojson.

O relevo é SIRGAS 2000 geográfico (EPSG:4674), mesmo que o PDF use UTM. O limite auxiliar é SIRGAS 2000 UTM 23S (EPSG:31983). Não se inferiu projeção pelo PDF. Geometrias originais e transformadas válidas, sem vazias. Todos os 399 polígonos têm MUNICIPIO=Niterói e UF=RJ e coordenadas na extensão municipal. A unidade regional chamada “Morraria de Niterói-São Gonçalo” foi preservada; esse nome não significa importação de geometria de São Gonçalo.

O limite IBGE 2015 do pacote apresenta pequenas diferenças cartográficas: soma de áreas externas 0.00001936607974145519 graus². Não equivale a área métrica nem comprova invasão municipal; nenhuma feição foi recortada. O limite municipal GeoNit existente não foi substituído.

## Processamento reproduzível

scripts/prepare-cprm.py lê o PRJ de cada conjunto, usa pyshp 3.0.3, pyproj 3.7.2 e shapely 2.1.2, transforma com always_xy e allow_ballpark=False para EPSG:4326. Bibliotecas locais em .cache/geospatial, ignoradas pelo Git. Sem simplificação, arredondamento, recorte ou reparo. A medida M de PolygonM não é altitude e não é incluída no GeoJSON 2D. Os atributos permanecem originais; feature.id é índice derivado, não OBJECTID oficial. manifesto.json contém WKT, operação de transformação, precisão declarada, hashes, extensão, contagem e inventário. limite-pacote.geojson é auxiliar de auditoria, sem novo switch.

## Integração e classificações

Padrões de Relevo em Relevo e Altimetria: 399 polígonos, um switch e quatro classificações da mesma geometria: PADRAO (21), UnGeomorf (6), UnMorfoest (4), UnMorfoesc (5). Nenhuma geometria duplicada por classificação. Legenda usa classes, códigos e contagens reais; estilos do portal, sem alegar reprodução da paleta da carta original. Preenchimento de 25%, contorno 1,5 px, linhas contínuas/tracejadas; hover temporário de 3 px restaurado ao sair. Consulta seleciona somente a camada escolhida e funciona por clique no vetor ou teste local de ponto em polígono; não depende de endpoint Esri para o relevo. Ficha, popup, relatório, origem, ano, escala e aviso incorporados.

Campos apresentados: PADRAO, COD_REL, UnMorfoest, UnMorfoesc, UnGeomorf, Amplitude, Declividad, Declivid_1, OBS quando preenchido, MUNICIPIO, UF, Shape_Leng, Shape_Area, AREA_KM2. GEOMETRIA permanece no derivado. AREA_KM2 está zerado em todas as feições e é identificado como tal; Shape_Area e Shape_Leng são valores técnicos originais, sem atribuição de m²/m. Área e perímetro Turf são estimativas separadas. Declividade e amplitude são faixas da classe, não raster atual. Não há CPF, proprietários, nomes pessoais ou contatos nos atributos; créditos de autores são bibliográficos públicos.

Camada geomorfológica de referência, elaborada em 2017. Não substitui mapeamento atualizado de risco, vistoria técnica ou laudo geotécnico.

## Pendências explícitas

ZIP não contém MDE, hipsometria, declividade raster, curvas de 40 m, pontos cotados ou sombreado. Esses itens ficam em integração, sem switch. Sem vetorizar PDF, curvas de São Gonçalo ou derivar rasters fictícios. Logradouros oficiais continuam não integrados; busca de rua não é prometida. Fragilidade recebe apenas contexto físico, com cálculo desabilitado; nenhum peso, pontuação ou classificação de risco foi criado.

## Testes e evidências

61 testes automatizados aprovados, incluindo geometrias reais, CRS, 21/6/4/5 classes, contagem, transparência, rejeição de pacote incompleto/município incorreto, atributos, consulta local mesmo com overlay errado e regressões existentes. Matriz visual: três bases × quatro dimensões (390×844, 768×1024, 1366×768, 1920×1080), tiles carregados, 479 paths (relevo + camadas territoriais), sem overflow horizontal. Ortofoto oficial de 2019 e satélite NASA VIIRS de 29/09/2026 carregaram; satélite permanece de resolução inferior. Consulta real de Colinas em Largo da Batalha, ficha, legenda 21 classes e relatório com imagem/fontes confirmados. Screenshots em docs/testes-geomorfologia.

Regressões automatizadas: busca tolerante, camadas, consulta explícita, geolocalização substituindo marcador, bases e erros, quatro cadastros Defesa Civil 138 feições, cópias/edição/persistência/recovery, medições, privacidade/CSV/QR e catálogo. Lotes e bairros confirmados visualmente sobre o relevo na ortofoto: 836 paths carregados, sem erros de console. Relevo isolado confirmado com exatamente 399 paths, sem limite, bairros ou lotes. As quatro classificações foram selecionadas na interface. Imagem do relatório carregada com 1800 px de largura. A revisão não altera as geometrias oficiais nem os quatro cadastros. GPS físico, impressão nativa/PDF salvo e dispositivo móvel físico não comprovados; testes mobile são em viewport emulado. Nenhuma publicação ou merge.
