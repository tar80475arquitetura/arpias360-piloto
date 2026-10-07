# ARPIAS360 — consulta, edição de trabalho e refinamento de UX

Validação local em 01/10/2026, por HTTP em `127.0.0.1:8080`. Repositório `tar80475arquitetura/arpias360-piloto`, branch exclusiva `codex/gecad-final`. Nenhuma publicação ou merge. As quatro coleções reais da Defesa Civil e o manifesto de fontes permanecem sem alterações.

## Entrega e evidências

| Item solicitado | Resultado e limites da verificação |
| --- | --- |
| 1. Branch | `codex/gecad-final`; push autorizado somente para a mesma branch de origin. |
| 2. Commits | `a853080`: catálogo e tipografia; `54142f4`: consulta, geometria, edição de trabalho e relatório; `ec5268f`: proporções, cabeçalho e busca tolerante. O commit de documentação registra estas evidências. |
| 3. Arquivos | `index.html`, `css/style.css`, `css/ux.css`, `js/app.js`, `js/catalog.js`, `js/search.js`, `js/geometry.js`, `js/reference-labels.js`, `js/tools.js`, `js/report.js`, `js/workspace.js`, bibliotecas locais em `js/vendor`, dependências fixadas, script de montagem, testes e documentação. |
| 4. Visual | Cabeçalho desktop/tablet de 72 px; busca de 46 px, limitada a 460 px no desktop; ficha de 320 px com padding de 14 px. Camadas começam recolhidas para privilegiar o mapa. |
| 5. Bases | Ruas OSM, Foto Aérea 2019 oficial e NASA VIIRS. Carregamento e trocas observados no desktop. Trocas e ortofoto com overlays também exercitados no mobile. VIIRS tem resolução espacial menor e data explícita; não é imagem em tempo real. |
| 6. Catálogo | 13 categorias, 116 referências documentadas e 2 controles existentes preservados: 118 itens na interface. Busca de camadas separada da territorial, incluindo APP, chuva, ITBI e imóvel. |
| 7. Camadas verificadas | Sirenes 37, pluviômetros municipais 38, NUDECs 36, pontos de apoio 27: 138 marcadores simultâneos. Limite e bairros existentes preservados. APP municipal retornou 17 polígonos carregados na vista testada; isso não representa o total do serviço. |
| 8. Em integração | Referências com fonte identificada e ainda sem controle cartográfico adicional comprovado. Informações deixam essa condição explícita. |
| 9. Futuras | Sem geometrias/endpoints específicos comprovados: permanecem referências futuras, sem switches funcionais. Curvas de nível, áreas alagáveis e outras referências não ganham dados fabricados nesta entrega. |
| 10. Consulta | Navegação normal não consulta. Consultar exige ativação e informa modo, orientação e saída. Busca explícita pode selecionar um bairro ou coordenada sem ativar consulta por clique. |
| 11. Lote | Consulta real confirmou lote em Maria Paula/Pendotiba. Seleção âmbar, atributos públicos do serviço, sem proprietário, CPF, contato ou ficha imobiliária inventada. Inscrição técnica não é apresentada como inscrição municipal. |
| 12. Área | Lote observado: 12.104,01 m² / 1,21 ha, estimativa geográfica Turf. Testes analíticos verificam área e subtração de furos. |
| 13. Perímetro | Mesmo lote: 809,73 m. Linhas usam distância geográfica; medições próprias de linha e área foram concluídas pela interface. |
| 14. Ficha | Lateral desktop, drawer tablet e bottom sheet mobile. Resumo mantém ações principais; ações adicionais ficam em “Mais ações do local”. |
| 15. Fachada | Link para Street View próximo às coordenadas. Não é tratado como fotografia cadastral oficial. O serviço de lote consultado não forneceu fotografia registrada. |
| 16. Coordenadas | Latitude/longitude de referência, cópia e URL validada. Centro de massa para polígonos; ponderação por área para multipartes. Não equivale a acesso/entrada do imóvel. |
| 17. Maps | URL usa as coordenadas da seleção; abre em nova aba protegida. Validação automatizada das URLs preservada. |
| 18. Earth | Link usa as mesmas coordenadas e proteção de nova aba. |
| 19. Street View | Não se garante cobertura fotográfica; o destino depende do Google. |
| 20. Compartilhamento | QR Code local de 220 px carregou; link abriu em nova aba com “Local compartilhado” e coordenadas corretas. Não inclui atributos privados. |
| 21. Edição | Entrada confirmada; dados oficiais somente leitura. Ponto, linha e polígono sintéticos criados, ajuste de vértice exercitado, salvamento e recarga confirmados. Exclusão recuperável e restauração funcionaram. A coleção ativa terminou com 0 feições sintéticas; a recuperação local permanece disponível. |
| 22. Relatório | Relatórios de ponto e lote reais geraram imagem da ortofoto, seleção, norte, escala calculada, atributos disponíveis, referências civis próximas e fontes utilizadas. Observações são opcionais e manuais. Incidências se limitam ao ponto e às feições carregadas. |
| 23. Impressão | Botão chama impressão nativa; CSS A4 preparado. A interação de impressão bloqueou a automação do navegador embutido. Paginação final não verificável neste ambiente. |
| 24. PDF | Usa “Salvar como PDF” do navegador. Nenhum PDF final foi confirmado ou gerado por essa interação; requer teste manual em navegador com diálogo de impressão acessível. |
| 25. Testes | 41 testes automatizados aprovados, sem falhas. 21 buscas reais confirmadas. Navegação inspecionada em 12 resoluções; mapa/painel nas 4 resoluções principais sem overflow horizontal. |
| 26. Screenshots | Pasta `testes-master`; exemplos e comparações abaixo. JSONs registram resultados de busca e dimensões verificadas. |
| 27. Correções | Clique involuntário de consulta, foco roubado por resposta assíncrona, seção pessoal removida pelo renderizador do catálogo, atributos de trabalho desatualizados após edição, legenda sem símbolos e ambiguidade entre timeout e ausência de lote. |
| 28. Pendências | PDF/paginação e download final GeoJSON/CSV no navegador comum; GPS real; cobertura fotográfica externa; integração das referências futuras. Serialização e segurança de CSV/GeoJSON foram testadas, mas o navegador embutido não entregou evento de download verificável. |
| 29. Decisões humanas | Confirmar fontes oficiais ainda ausentes, política de atualização e uso administrativo. Nenhum indicador IFUC ou pontuação de fragilidade foi calculado sem dados. |

## Proporções e hierarquia final

Desktop: ARPIAS360 → Buscar → Camadas → Consultar → Minha localização → Mais. Entre 600 e 1199 px, localização migra para Mais. No celular, Buscar/Camadas/Consultar ficam numa segunda linha de 44 px; localização mantém botão direto inferior. O cabeçalho mobile de 108 px organiza essas três ações com texto legível, substituindo os antigos botões inferiores duplicados.

Medir, edição/desenho, compartilhamento, relatório, fontes, ajuda, metodologia, informações do projeto e referências futuras ficam em Mais. Relatório e compartilhamento exigem seleção válida. A navegação não entra em edição silenciosamente.

| Texto | Escala final |
| --- | --- |
| Texto e nomes de camada | 16 px |
| Categorias | 17 px |
| Títulos de painel | 20 px |
| ARPIAS360 | 24 px desktop; 23 px mobile; 22 px até 359 px |
| Botões | 15 px; alvo mínimo 44 px |
| Campos de popup/ficha | 15 px; título 18 px |
| Bairros / municípios | 14 / 16 px, com fundo e halo claros |
| Metadados secundários | 13–14 px |

Surfaces neutras: `#f4f5f1` e branco; textos institucionais `#203e36` / `#172f29`. Cores temáticas preservadas do refinamento visual:

| Categoria | Cor |
| --- | --- |
| Riscos e Proteção Civil | `#9b4d17` |
| Estrutura Territorial | `#806226` |
| Planejamento | `#705484` |
| Meio Ambiente | `#376e4d` |
| Clima e Monitoramento | `#216d79` |
| Mercado Imobiliário | `#77508a` |
| Segurança Pública | `#893b50` |
| Indicadores Socioespaciais | `#4b6487` |
| Infraestrutura | `#536976` |
| Fragilidade Urbana | `#a14d63` |

Cor é combinada com ícone, texto e estado. Contrastes medidos no refinamento anterior: mínimo 4,94:1 nas cores de categoria e 5,49:1 nos metadados. Não se afirma certificação integral WCAG. A comparação de paleta permanece em [REFINAMENTO_VISUAL.md](REFINAMENTO_VISUAL.md).

## Busca territorial tolerante

`ARPIASSearch.normalize` aplica Unicode NFD, remove diacríticos, converte para minúsculas, remove espaços nas extremidades e colapsa espaços repetidos. A mesma normalização é aplicada ao termo e aos nomes do catálogo oficial de bairros obtido em memória; nenhuma coleção local é recriada ou modificada.

Correspondência exata tem preferência. Termos parciais retornam alternativas; `engenho` exibiu Engenho do Mato e Engenhoca, sem trocar silenciosamente a seleção. Ausência de resultado é distinta de falha temporária do serviço. Busca por ruas permanece explicitamente em integração, como antes.

O serviço retornou `Gragoata`. Uma tabela de apresentação usa as grafias conhecidas solicitadas (Gragoatá, Icaraí, São Francisco etc.), preservando o atributo original na feição. Nomes desconhecidos não são corrigidos por suposição.

As 21 combinações reais aprovadas estão em [resultados-busca.json](testes-master/resultados-busca.json): os oito pares obrigatórios com/sem acentos, maiúsculas/espaços extras, francisco, vital, ititioca e jurujuba.

## LEITURA DO USUÁRIO

Esta análise inspeciona coerência entre apresentação e comportamento. A compreensão de pessoas reais em poucos segundos não foi medida em estudo de usabilidade.

| Elemento | Classificação | Interpretação esperada | Interpretação equivocada possível | Público afetado | Gravidade | Correção recomendada / aplicada |
| --- | --- | --- | --- | --- | --- | --- |
| Escala “100 m” | RISCO DE INTERPRETAÇÃO | Distância no terreno equivalente à barra, variável com o zoom | Altitude, altura da câmera, raio ou distância à seleção | Principalmente leigo | Média | Tooltip e nome acessível explicam distância, variação e que não é altitude; relatório também explica. Não foi tratada como erro por variar. |
| Foto Aérea 2019 | RISCO DE INTERPRETAÇÃO | Ortofoto municipal histórica | Imagem atual ou outra base substituída | Ambos | Alta | Ano e fonte explícitos; falha mantém aviso e fallback por escolha. Sem troca silenciosa por OSM. |
| Área sem imagem fora do município | MELHORIA DE COMUNICAÇÃO | Cobertura restrita da ortofoto | Dados apagados ou portal quebrado | Leigo | Média | Metadados explicam cobertura de Niterói. Não carregar imagens de São Gonçalo como se fossem Niterói. |
| Satélite recente | RISCO DE INTERPRETAÇÃO | Imagem VIIRS datada, de menor resolução | Imagem cadastral de alta resolução ou em tempo real | Ambos | Alta | Data, NASA e limite de resolução explícitos nos metadados. |
| ● Funcional / switch ON | RISCO DE INTERPRETAÇÃO | Camada pode carregar / está exibida | Sirene operando, apoio aberto ou pluviômetro transmitindo | Ambos | Alta | Legenda, ficha civil e relatório distinguem cadastro de operação atual. |
| Dados disponíveis / Em integração | RISCO DE INTERPRETAÇÃO | Fonte identificada, ainda não exibida como camada adicional | Switch funcional escondido ou dado já integrado | Ambos | Média | Texto de limitação e ausência de switch adicional; fonte acessível por Informações. |
| Consulta temporariamente indisponível | MELHORIA DE COMUNICAÇÃO | Serviço não respondeu; pode tentar depois | Nenhum lote existente no local | Ambos | Alta | Timeout/falha é separado de resposta válida sem lote. |
| Consultar / Medir / Editar | RISCO DE INTERPRETAÇÃO | Ferramenta ativa muda o comportamento do clique | Clique normal continua livre ou entrou em edição sem perceber | Ambos | Alta | Título, orientação, estado de Consultar e saída explícita; edição confirmada e descarte protegido. |
| Resultado assíncrono durante nova busca | ERRO TÉCNICO | Digitação mantém foco | Entrada perde texto ou busca muda sozinha | Ambos | Média | Corrigido: atualização territorial não reabre resumo nem desloca foco durante digitação. |
| Cabeçalho e ficha volumosos | ERRO DE INTERFACE | Controles proporcionais à informação | Ferramentas dominam o mapa | Ambos | Média | Cabeçalho desktop 72 px, busca 46 px, ficha 320 px, ações secundárias recolhidas, painel inicialmente fechado. |
| Coordenadas da seleção | RISCO DE INTERPRETAÇÃO | Referência geométrica | Entrada exata do prédio ou GPS do usuário | Ambos | Média | “Latitude/longitude de referência”; centroide e estimativa explicados. GPS usa marcador separado. |
| Área e perímetro | RISCO DE INTERPRETAÇÃO | Estimativa geográfica | Medição cadastral/legal certificada | Principalmente técnico | Alta | Rótulo de estimativa e metodologia Turf; sem atribuir significado ao campo bruto V0. |
| Norte no relatório | MELHORIA DE COMUNICAÇÃO | Orientação do mapa sem rotação | Direção até o ponto / câmera | Leigo | Baixa | Símbolo N e nota cartográfica. |
| Marcadores simultâneos | RISCO DE INTERPRETAÇÃO | Cadastros distintos, alguns próximos/coincidentes | Um marcador representa todos os equipamentos ou dado ausente | Ambos | Média | Ícones distintos e legenda; aproximar e filtrar camadas para leitura pontual. Densidade com 138 pontos continua sendo limitação de visão municipal. |
| QR Code / link local | RISCO DE INTERPRETAÇÃO | Reabrir a seleção no endereço do portal | Link localhost é público e abre em qualquer celular | Ambos | Alta | Aviso explícito de que o link local só funciona no mesmo dispositivo. Nenhum endereço público ou publicação foi inventado. |
| Ver fachada | RISCO DE INTERPRETAÇÃO | Street View disponível perto do local | Fotografia oficial cadastrada do imóvel | Ambos | Alta | Link e explicação não afirmam fotografia cadastral; cobertura externa não garantida. |
| Erro de impressão/download no teste | NÃO VERIFICÁVEL | Limitação da interação do navegador embutido | Portal publicado quebrado | Ambos | Média | Registrar falta de evidência; teste manual de PDF/download em navegador comum pendente. |
| GPS real e teclado virtual físico | NÃO VERIFICÁVEL | Dependem de permissões e dispositivo | Validação em viewport equivale a GPS/toque real | Ambos | Média | Não afirmar teste físico; geolocalização simulada está coberta por teste automatizado. |

## Capturas e comparação

| Evidência | Captura |
| --- | --- |
| Desktop antes do ajuste de proporções | [responsivo-1366x768.png](testes-master/responsivo-1366x768.png) |
| Mobile antes do ajuste | [responsivo-390x844.png](testes-master/responsivo-390x844.png) |
| Desktop final, mapa dominante | [inicial-desktop-final.png](testes-master/inicial-desktop-final.png) |
| Mobile com ações principais visíveis | [ux-390x844.png](testes-master/ux-390x844.png) |
| Digitação sem acento | [busca-gragoata-desktop.png](testes-master/busca-gragoata-desktop.png) |
| Resultado Gragoatá | [resultado-gragoata-desktop.png](testes-master/resultado-gragoata-desktop.png) |
| Resultado Icaraí | [resultado-icarai-desktop.png](testes-master/resultado-icarai-desktop.png) |
| Busca ambígua sem escolha automática | [busca-ambigua-engenho.png](testes-master/busca-ambigua-engenho.png) |
| Painel final | [painel-camadas-final-desktop.png](testes-master/painel-camadas-final-desktop.png) |
| Três categorias sobre a ortofoto | [mapa-categorias-final-desktop.png](testes-master/mapa-categorias-final-desktop.png) |
| Satélite real com overlays | [satelite-defesa-civil-desktop.png](testes-master/satelite-defesa-civil-desktop.png) |
| Lote e ficha pública | [ficha-lote-desktop.png](testes-master/ficha-lote-desktop.png) |
| Relatório do lote | [relatorio-lote-real.png](testes-master/relatorio-lote-real.png) |
| Relatório final de Gragoatá | [relatorio-final-gragoata.png](testes-master/relatorio-final-gragoata.png) |
| QR Code | [compartilhamento-qr.png](testes-master/compartilhamento-qr.png) |
| QR Code com aviso local | [compartilhamento-local-final.png](testes-master/compartilhamento-local-final.png) |
| Medição e edição | [medicao-area.png](testes-master/medicao-area.png), [edicao-geometria.png](testes-master/edicao-geometria.png) |

Resoluções finais: 320×568, 360×800, 375×812, 390×844, 412×915, 430×932, 768×1024, 820×1180, 1280×720, 1366×768, 1440×900 e 1920×1080. Medidas registradas em [responsividade-final.json](testes-master/responsividade-final.json). Mapas e painéis com overlays nas quatro resoluções principais têm arquivos `mapa-final-*` e `painel-final-*`.

## Próxima validação recomendada

Testar impressão A4, PDF salvo e downloads GeoJSON/CSV em Chrome/Edge comum, conferindo paginação, imagem, seleção, legendas e observações. Depois, testar GPS e teclado/toque em aparelho físico. Nenhuma funcionalidade dependente dessas verificações é declarada aprovada apenas por existir no código.

## Atualização consolidada

A revisão final e a consulta explícita estão em [REVISAO_CARTOGRAFICA.md](REVISAO_CARTOGRAFICA.md) e [CONSULTA_E_COPIAS.md](CONSULTA_E_COPIAS.md). O catálogo passou de 13 para 14 categorias com Relevo e Altimetria: oito referências sem ativação cartográfica até validação do pacote SGB. Logradouros permanecem pendentes de fonte linear comprovada; consulta cadastral de lotes existente preservada. Fragilidade sem pontuação. Nenhum dado real da Defesa Civil foi alterado.
