# Consulta por camada e cópias locais

Branch exclusiva: codex/gecad-final. Nenhum merge ou publicação.

Antes, cliques em feições podiam selecionar qualquer camada sobreposta e cliques no mapa tentavam lote automaticamente. Agora Consultar inicia sem escolha, consulta apenas o alvo explícito e abre uma ficha. Bairros, limite, lotes, hidrografia, ZEIS, ZEIA, APP, APA, comunidades e os quatro cadastros municipais são consultáveis. Lotes exigem zoom ≥16. Mapas-base, futuros e fontes sem geometria validada não são opções.

A visibilidade não escolhe o alvo. A seleção anterior é limpa ao trocar alvo, ao sair ou ao iniciar outro modo; a geração lógica impede resposta atrasada. Erro e ausência de feição têm feedback distinto, sem marcador fictício. Busca é independente.

## Edição controlada

A ficha de lote com Polygon simples oferece Criar cópia de trabalho. A base oficial permanece somente leitura. A cópia guarda camada, id real quando presente, origem, geometria original e atributos públicos existentes com seus nomes originais em `arpiasOrigin`; a interface não inventa cadastro. Campos pessoais são excluídos por lista permitida. Campos locais são editáveis; os atributos de origem ficam separados e não editáveis. `arpiasHistory` registra criação, edição, exclusão e restauração local; não há versionamento remoto ou undo/redo.

Restaurar geometria original atua somente na cópia. Exclusão tem recuperação. Persistência é localStorage e exportação GeoJSON; gravação física do download não verificada no navegador integrado. Multipartes não são copiados nesta fase: Leaflet.draw não os edita diretamente e nenhum componente é descartado silenciosamente. Divisão de lotes, conexão de linhas, KML e importação não foram adicionadas.

## Logradouros

Não havia vetor linear de logradouros validado no repositório. Consulta do diretório oficial AS_SMF_CLIN_CULT_EDUC_LIMPOL/MapServer tentada no terminal e novamente com autorização: proxy HTTP 407. Leitor web retornou 502; navegador externo atingiu timeout. Nenhum endpoint de logradouros foi inventado. Busca de ruas, seleção de linha oficial, combinação lote/rua e edição de cópia de logradouro permanecem pendentes de fonte comprovada. A lógica de cópia aceita LineString validado, mas isso não constitui integração operacional de logradouros.

## Evidências

52 testes passaram após a consulta explícita; foram acrescentados testes de cópia, privacidade, restauração, persistência e referências não integradas. Resultado final na execução do checkpoint. Screenshots e JSON estão em `docs/revisao-cartografica/`. Matriz global: `docs/REVISAO_CARTOGRAFICA.md`. Fonte geomorfológica: `docs/fontes/cprm-niteroi-geomorfologia.md`.

## Checkpoint verificado

56 testes automatizados aprovados, sem falhas. Testes visuais: consulta sem escolha, troca de alvo, sobreposição de pontos/bairros, quatro cadastros municipais, lote real, três bases, fluxo mobile e quatro resoluções com dimensões efetivas e modo confirmado. Cópia real de lote id 61405: criada, vértices ativados, ajuste, salvamento, restauração da geometria original, recarga persistente, ficha e relatório não oficiais. Cópia de teste excluída de forma recuperável; grupo terminou com zero feições. GeoJSON das cópias utiliza coordenadas sem arredondamento adicional na serialização. QR real 220×220. Relatório com imagem real 781×1472 no mobile; impressão/PDF e gravação física de download continuam NÃO VERIFICADOS.
