# Revisão cartográfica — ARPIAS360

Branch: `codex/gecad-final`. Inventário realizado antes das alterações desta revisão, em 01/10/2026.

## Inventário inicial

| Grupo | Camadas ou controles existentes | Geometria / estado inicial |
|---|---|---|
| Bases | Ruas OpenStreetMap; Foto Aérea 2019 oficial de Niterói; Satélite NASA GIBS/VIIRS | Tiles; seleção exclusiva; carregamento e falha explícitos. VIIRS possui resolução espacial reduzida. |
| Estrutura territorial | Limite municipal, bairros, municípios do entorno | Polígonos oficiais de Niterói; referências pontuais com rótulos de Rio, São Gonçalo e Maricá, sem limites inventados. Bairros com borda 1,25px e preenchimento 0,035. |
| Planejamento | ZEIS, ZEIA | Polígonos oficiais, bordas 1,2px. |
| Meio ambiente / clima | Hidrografia, APP municipal, APA municipal | Linhas e polígonos oficiais; bordas 1,1–2px. Pluviômetros municipais são distintos de Cemaden. |
| Ocupação / cadastro | Comunidades, lotes públicos | Polígonos oficiais; lotes apenas a partir de zoom 16, borda clara 0,55px. |
| Defesa Civil | 37 sirenes, 38 pluviômetros, 36 NUDECs, 27 pontos de apoio | 138 pontos reais, quatro ícones próprios. Cadastro não comprova operação atual. |
| Catálogo | 13 categorias, 116 referências | 17 entradas integradas, incluindo aliases de camadas existentes; 19 fontes disponíveis para integração e 80 referências futuras. Não são 116 camadas operacionais. |
| Referências futuras | Curvas de nível, áreas alagáveis, fragilidade, mercado, segurança, indicadores, infraestrutura e demais referências | Sem geometria operacional quando não integrada; sem ativação cartográfica fictícia. |
| Trabalho do usuário | Pontos, linhas, polígonos; atributos próprios; edição de vértices; exclusão recuperável; restauração; exportação | Grupo isolado das bases oficiais, persistência local. Contorno violeta 3px, preenchimento 0,16. |
| Medições | Distância, área, perímetro, vértices, rótulos, manter/limpar | Turf geográfico; geometria temporária ou mantida; contorno 3px, preenchimento 0,16. |
| Seleções | Consulta de ponto, lote ou feição; resultado de busca; local compartilhado | Destaque âmbar igual para busca e consulta; necessita distinção de estado. |
| Busca | Bairros tolerantes a acentos/caixa/espaços; resultados ambíguos; coordenadas | Geometria real de bairro ou ponto informado; ruas ainda não integradas. |
| Localização | GPS aproximado | Marcador separado; depende de permissão e dispositivo. |
| Interface | Buscar, Camadas, Consultar, Minha localização, Mais; zoom; escala variável; status da base; coordenadas | Cabeçalho principal reduzido; ações secundárias em Mais. |
| Informação | Rótulos, tooltips, popups, ficha territorial, legenda, fontes, metodologia, ajuda, compartilhamento QR e relatório | Rótulos com fundo claro; popup compacto; ficha lateral/mobile; legenda ainda usa ícone de categoria para polígonos, sem amostra fiel do contorno. |
| Ferramentas | Consulta, medida, desenho/edição | Painel centralizado no desktop: problema confirmado na inspeção de CSS. |

## Limitações de verificação anteriores

Impressão/PDF nativo e gravação física de downloads não foram verificáveis no navegador integrado. GPS real depende de dispositivo/permissão. Não interpretar essas limitações como confirmação de sucesso ou como falha comprovada do portal.

## Matriz e evidências

Os registros de carregamento e capturas individuais estão em [camadas-bases.json](revisao-cartografica/camadas-bases.json): 13 camadas × 3 bases × desktop/mobile = 78 verificações. As contagens de vetores remotos representam a extensão carregada, não o total do serviço. As quatro coleções municipais mantêm 37/38/36/27 registros.

| Camada | Geometria | Base testada | Normal / seleção | Contraste / rótulo | Popup / ficha | Mobile | Problema → correção | Status final |
|---|---|---|---|---|---|---|---|---|
| Limite municipal | Polígonos | Ruas, Foto 2019, NASA | 3,5px sem preenchimento / 4,5px leve | Halo; município com fundo | Fonte pública | Verificado | Contorno discreto → traço e halo | Operacional, somente leitura |
| Bairros | Polígonos | Três bases | 2,5px e preenchimento 0,04 / 4,5px e preenchimento 0,04 | Rótulos a partir do zoom adequado | Consulta explícita, bairro real | Verificado | Seleção invasiva → baixo preenchimento | Operacional, somente leitura |
| Lotes | Polígonos | Três bases | 2,5px / 4,5px e preenchimento 0,14 | Halo, zoom mínimo 16; sem nomes de proprietários | Campos públicos existentes, área estimada | Verificado | Clique adivinhava alvo → seletor explícito | Operacional; cópia simples editável |
| Hidrografia | Linhas | Três bases | 3px / 4,5px | Halo; sem nomes inventados | Atributos públicos disponíveis | Verificado | Linha fraca → reforço | Operacional, somente leitura |
| ZEIS | Polígonos | Três bases | 3px, traço 8/3, fill 0,22 / leve | Roxo e padrão | Campos reais | Verificado | Confusão com risco → categoria de planejamento | Operacional, não é risco |
| ZEIA | Polígonos | Três bases | 3px, traço 3/4, fill 0,20 / leve | Verde e padrão | Campos reais | Verificado | Contraste → halo | Operacional, somente leitura |
| APP municipal | Polígonos | Três bases | 3px, fill 0,22 / leve | Verde; legenda correspondente | Geometria real selecionada | Verificado | Opacidade e fronteira → reforço | Operacional, somente leitura |
| APA municipal | Polígonos | Três bases | 3px, traço composto, fill 0,18 / leve | Padrão distinto | Campos reais | Verificado | Confusão com APP → cor e traço | Operacional, somente leitura |
| Comunidades | Polígonos | Três bases | 3px, fill 0,22 / leve | Terracota e traço | Campos reais | Verificado | Não inferir vulnerabilidade/risco | Operacional, somente leitura |
| Sirenes | 37 pontos | Três bases | Símbolo próprio / halo externo vazio 20px | Forma, ícone, contorno branco | Cadastro, sem confirmação de operação | Verificado | Destaque escondido → anel externo | Operacional como cadastro |
| Pluviômetros municipais | 38 pontos | Três bases | Símbolo próprio / halo vazio | Forma e ícone próprios | Sem chuva atual; não Cemaden | Verificado | Fonte confundível → aviso explícito | Operacional como cadastro |
| NUDECs | 36 pontos | Três bases | Símbolo próprio / halo vazio | Forma e ícone próprios | Estado cadastral, sem confirmação atual | Verificado | Status operacional → ressalva | Operacional como cadastro |
| Pontos de apoio | 27 pontos | Três bases | Símbolo próprio / halo vazio | Forma e ícone próprios | Sem confirmação de abertura | Verificado | Presença ≠ disponibilidade | Operacional como cadastro |
| Trabalho | Ponto, linha, polígono simples | Três bases | Violeta tracejado / edição 5px | Ponto quadrado ✎; vértices com área de toque | Não oficial, persistência local | Verificado | Confusão com oficial → símbolo e aviso | Grupo isolado |
| Medição | Linha / polígono | Três bases | 4px; manter com traço e ponto | Rótulo conectado, contraste | Estimativa Turf | Verificado | Painel central → canto/recolhível | Operacional |
| Logradouros | Linha pretendida | Não verificado | Sem geometria integrada | Não aplicável | Não disponível | Não verificado | Catálogo municipal inacessível nesta investigação | Pendente; não declarado funcional |
| Relevo CPRM e derivados | Geometria ainda não verificada | Não verificado | Sem camada ativa | Não aplicável | Metadados institucionais | Catálogo verificado | ZIP bloqueado → referências sem switches | Fonte identificada / em integração |
| Fragilidade | Arquitetura futura | Não aplicável | Sem valores ou mapa fictício | Metodologia explícita | Sem pontuação | Modal verificado | Pesos inexistentes → cálculo desabilitado | Em desenvolvimento metodológico |

As fontes oficiais dos nove vetores e seus endpoints estão no inventário acima e em `js/app.js`; anos não informados permanecem desconhecidos. Nenhuma fonte municipal foi sobrescrita. A referência CPRM de 2017 está em [documentação técnica](fontes/cprm-niteroi-geomorfologia.md).

## Consulta explícita

Visibilidade, consultabilidade e alvo escolhido são estados independentes. O seletor oferece nove vetores municipais e quatro cadastros da Defesa Civil; mapas-base, catálogo futuro e referências geomorfológicas não verificadas ficam fora. Sem escolha, clique não cria seleção. Troca limpa a seleção anterior; resposta assíncrona antiga é descartada; ausência de feição não fabrica ponto. Erro de serviço tem mensagem própria. Cliques em uma sobreposição consultam o alvo escolhido, e a ficha identifica a camada. Busca continua independente. Consultar, Medir e Editar são exclusivos.

Polígonos de consulta têm preenchimento 0,04; lotes 0,14; pontos usam anel sem preenchimento. Hover é apenas CSS, sem recriar camadas nem persistir seleção. Encerrar preserva a visibilidade e não altera deliberadamente zoom/posição. O painel é recolhível; no mobile, a ficha usa bottom sheet. Quatro resoluções sem overflow: 390×844, 768×1024, 1366×768 e 1920×1080. Evidência: `consulta-explicita-resultados.json` e `consulta-painel-*.png`.

## LEITURA DO USUÁRIO

| Elemento | Leitura esperada | Risco de interpretação | Público | Gravidade / classe | Correção |
|---|---|---|---|---|---|
| Consultar | Escolher explicitamente o alvo | Camada visível confundida com alvo | Todos | Alta / ERRO DE INTERFACE | Seletor independente, instrução e camada na ficha |
| Ortofoto | Imagem oficial histórica de 2019 | Situação atual ou fallback silencioso | Todos | Alta / RISCO DE INTERPRETAÇÃO | Ano, fonte, erro e fallback voluntário |
| NASA VIIRS | Imagem datada, baixa resolução espacial | Confundir com fotografia cadastral | Todos | Alta / MELHORIA DE COMUNICAÇÃO | Data e limitação explícitas |
| Defesa Civil | Localização cadastrada | Funcionamento presumido | Público / técnicos | Alta / RISCO DE INTERPRETAÇÃO | Cadastro não confirma operação ou abertura |
| Área / distância | Estimativa geográfica | Valor oficial cadastral | Técnicos | Alta / RISCO DE INTERPRETAÇÃO | Unidade, método e ressalva |
| Escala | Distância no terreno variável | Altitude | Todos | Média / MELHORIA DE COMUNICAÇÃO | Ajuda e escala gráfica |
| Cópia local | Geometria não oficial | Alteração da base da Prefeitura | Técnicos | Alta / RISCO DE INTERPRETAÇÃO | Original preservado, tracejado e proveniência |
| Relevo | Fonte histórica de referência | Risco atual ou vetores já carregados | Todos | Alta / RISCO DE INTERPRETAÇÃO | Em integração, sem switches |
| PDF / download / GPS | Resultado ainda não confirmado | Teste automático tomado por sucesso real | Técnicos | NÃO VERIFICÁVEL | Limitação registrada |
| Tile removido | Não atualizar camada removida | Erro de interação | Todos | ERRO TÉCNICO | Guarda por geração de anexação |

Impressão/PDF nativo, gravação de downloads, GPS real, aparelho físico e teclado virtual permanecem NÃO VERIFICADOS. Serviços externos podem ter falhas transitórias. HTTP local foi utilizado; falha via file:// não foi atribuída à versão HTTP. Capturas históricas de seleções anteriores documentam etapas; as capturas `consulta-explicita-*` representam o novo fluxo.


## Checkpoint final

56/56 testes automatizados aprovados. `responsividade-checkpoint.json` confirma modo ativo, nenhum diálogo de confirmação aberto, dimensões reais, 13 opções de consulta e ausência de overflow. `consulta-ortofoto-final-desktop.png` mostra 20 tiles reais da ortofoto e 138 marcadores municipais. As capturas finais substituem tentativas transitórias feitas enquanto serviços ou diálogos ainda respondiam. Relatório cartográfico e QR foram verificados; PDF/download/GPS reais não foram.
