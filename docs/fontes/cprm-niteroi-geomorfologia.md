# Base geomorfológica de Niterói — diagnóstico em 01/10/2026

DANTAS, Marcelo E.; COSTA, Lais. Carta geomorfológica: município de Niterói, RJ. CPRM, fevereiro de 2017. Escala 1:30.000. [Registro institucional](https://rigeo.sgb.gov.br/handle/doc/17483).

O registro oferece `mapa_niteroi_rj_geomorf.pdf` (9,18 MB) e `niteroi_padraoderelevo.zip` (1,7 MB). [ZIP oficial](https://rigeo.sgb.gov.br/bitstreams/4b5eeb97-52ea-48db-bc36-a96cd4e7c681/download).

A carta informa SIRGAS 2000 e projeção UTM, meridiano central 45°W; corresponde à zona 23S. Isso identifica a projeção do PDF, **não confirma o .prj do shapefile**. A carta referencia TOPODATA/INPE (2011) para relevo sombreado, hipsometria, declividade e curvas de nível com intervalo de 40 m. [PDF institucional](https://rigeo.sgb.gov.br/bitstreams/c511e30a-d3e7-41fe-a739-3622f6fca1e3/download).

## Conteúdo vetorial: não verificado

Download tentado no ambiente restrito e novamente com autorização de rede. O proxy retornou HTTP 407; o navegador integrado também não conseguiu abrir a página externa no prazo. O leitor web confirmou a publicação, mas não recuperou o ZIP. Não havia ZIP ou shapefile no repositório.

| Verificação | Resultado |
|---|---|
| Arquivos internos / shapefiles / auxiliares | Não verificados |
| .prj / codificação DBF / geometrias | Não verificados |
| Campos e classes efetivamente presentes | Não verificados |
| Contagem / validade / extensão / integridade | Não verificadas |
| Dados pessoais ou sensíveis no DBF | Não verificados |
| Vetores, rasters e pontos cotados disponíveis | Não verificados |
| Processamento executado | Nenhum; original não obtido nem alterado |
| Camadas geradas | Nenhuma |

## Preparação realizada

Categoria Relevo e Altimetria com oito referências. Padrões de Relevo, Unidades Geomorfológicas, Hipsometria, Declividade, Curvas de Nível — 40 m, Pontos Cotados, Relevo Sombreado e MDE permanecem **Fonte identificada / em integração**, sem switch e fora do seletor Consultar. A arquitetura de fragilidade registra a fonte como contextual futura; nenhum peso ou índice foi calculado.

“Camada geomorfológica de referência, elaborada em 2017. Não substitui mapeamento atualizado de risco, vistoria técnica ou laudo geotécnico.”

## Próxima validação necessária

Obter o ZIP institucional, registrar SHA-256, inventariar todos os membros sem sobrescrever o original, validar SHP/SHX/DBF/PRJ e codificação, contar feições, listar campos/classes, conferir extensão de Niterói e dados sensíveis. Converter uma cópia para GeoJSON WGS84 preservando os campos e registrar a transformação. Somente então integrar legenda por classes reais, consultas, relatório, busca de unidades e testes visuais nas três bases e nos quatro tamanhos. Não vetorizar o PDF; não importar curvas de São Gonçalo. Ausência de raster impede derivar hipsometria, declividade ou sombreado nesta rodada.

## Verificação local solicitada no último prompt

Nova busca por ZIP, shapefiles e nomes de Niterói no projeto: nenhum pacote vetorial encontrado. O anexo mais recente contém somente `Texto colado.txt`. Para viabilizar a inspeção, o arquivo deve ser colocado exatamente em:

`C:\Users\tar_p\arpias360-piloto\data\raw\cprm\niteroi_padraoderelevo.zip`

O PDF pode receber o caminho `C:\Users\tar_p\arpias360-piloto\data\raw\cprm\mapa_niteroi_rj_geomorf.pdf`. A pasta de destino existe; não foi criado ZIP vazio, substituto ou derivado. Nenhuma nova pesquisa externa foi feita após essa orientação. Integração funcional bloqueada pela ausência local do ZIP.
