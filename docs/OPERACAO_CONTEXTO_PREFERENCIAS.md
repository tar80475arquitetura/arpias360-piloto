# Camada de trabalho, preferências e seleção — 07/10/2026

Branch: `codex/arpias360-next`. Base desta rodada: `35b1f7d301dd1e661bd578cc63f6b0079e344be7`.

## Auditoria inicial

O código já tinha barra Buscar/Camadas/Consultar/Minha localização/Mais, catálogo com busca por acentos/sinônimos/categorias, busca territorial com escolha de resultados ambíguos, três mapas-base, consulta explícita por camada, ficha territorial, seleção, opacidade em metadados de polígonos, medição, geolocalização, desenhos locais protegidos e painéis arrastáveis. Havia 74 testes Node aprovados após `npm ci`.

O catálogo tem 14 categorias e apresenta 126 itens, incluindo referências futuras e controles adicionais. Isso **não** representa 126 camadas cartográficas. Mantidos os nove overlays ArcGIS existentes, quatro coleções reais da Defesa Civil (138 pontos) e relevo CPRM/SGB; nenhum dado, endpoint ou integração nova foi acrescentado.

Lacunas confirmadas: escolher o nome de uma camada alternava sua visibilidade; faltava um contexto operacional comum para consultar/opacidade/enquadramento; localStorage só persistia desenhos; alternar o modo Consultar apagava seleção; o destaque podia ficar abaixo dos marcadores; a ficha não oferecia Enquadrar diretamente; os painéis podiam competir no tablet; o CSS misturava textos claros e superfícies claras.

## Quatro melhorias

1. **Camada de trabalho.** Nome selecionável sem alterar o switch. Um bloco contextual oferece ativar/ocultar, consultar, enquadrar, informações e opacidade percentual. Funciona também com pontos da Defesa Civil e relevo. Enquadramento local usa a extensão da coleção real; ArcGIS consulta a extensão do serviço, com timeout de 12 s e mensagem para nova tentativa. O botão Consultar prioriza a camada de trabalho; a opção automática consulta somente a feição visível clicada. Não faz inferência silenciosa em clique vazio.
2. **Preferências validadas.** Chave separada `arpias360.preferences.v1`: mapa-base, camadas visíveis, opacidade, camada de trabalho, categorias, painel Camadas e posições das duas janelas arrastáveis. IDs conhecidos, booleanos e números finitos são validados. Falha de armazenamento não bloqueia a interface. Restaurar preferências em Mais preserva os desenhos de `workspace.v1`. A abertura automática do painel é aplicada apenas fora do modo compacto. Os filtros temporários não substituem a expansão original das categorias.
3. **Seleção e resultado duráveis.** Trocar ferramenta, alvo de consulta ou mapa-base não apaga a seleção. Nova consulta/seleção ou limpeza explícita a substitui. Pane exclusivo fica acima dos marcadores, sem capturar cliques. A ficha oferece Enquadrar/Copiar/Limpar; Mais permite reabrir o resultado. Respostas atrasadas de contexto não reabrem outra janela nem roubam foco.
4. **Painéis e legibilidade.** Camadas com 320 px no desktop, Info com 350 px. Abaixo de 1200 px, abrir Camadas fecha a ficha sem apagar o resultado. No mobile, sheets limitados a 68% da viewport e seleção posicionada na área de mapa visível. Posições arrastadas são limitadas novamente ao mudar o tamanho do mapa/janela. Contraste de títulos, nomes, categorias e estados ajustado; ações contextuais têm alvos de pelo menos 44 px.

## Arquivos

- `index.html`: bloco contextual, reabertura de resultado e restauração de preferências.
- `js/app.js`: controle de opacidade comum, nome separado do switch, eventos do catálogo e limites das janelas.
- `js/tools.js`: prioridade de consulta, modo automático explícito, seleção independente e ações da ficha.
- `js/operations.js`: integra os controles existentes ao contexto e às preferências.
- `js/preferences.js`: validação e armazenamento isolados dos desenhos.
- `css/ux.css`: estados operacionais, contraste, dimensões e layout compacto.
- Testes de preferências, opacidade, consulta, contexto assíncrono e navegador; esta documentação e capturas.

## Validação

| Grupo | Resultado |
| --- | --- |
| `npm test` | 85 aprovados, zero falhas, zero ignorados (74 anteriores + 11 regressões) |
| JavaScript | `node --check` em todos os módulos próprios |
| Dados | 11 JSON/GeoJSON de `data` e `config` válidos; arquivos preservados |
| HTML | Parser HTML5 estrito; IDs únicos e referências ARIA conferidas; `infoTitle` é criado ao abrir o modal |
| Catálogo/busca | 14 categorias/126 itens; testes de acentos, sinônimos, termos parciais e múltiplos resultados existentes preservados |
| Navegador | 14 grupos aprovados, zero erros JS; consulta sobre as 37 sirenes reais, opacidade, extensão, cópia, persistência, limpeza, medição e GPS simulado |
| Responsividade | 1920×1080, 1366×768, 1024×768, 768×1024, 390×844, 320×568; sem overflow horizontal; folhas móveis ≤70%; seleção acima da ficha |
| Serviços reais | CDN Leaflet/Esri 200; ruas OSM carregadas e inspecionadas visualmente; NASA capabilities 200; GeoNit/ortofoto e consultas municipais retornaram 503 |

O teste de navegador reproduz falhas externas com HTTP 503 de propósito. Ele usa as coleções locais reais, e **não** comprova disponibilidade municipal ou NASA. A validação viva foi executada separadamente. A primeira tentativa de OSM por urllib sem os cabeçalhos originais recebeu imagens de bloqueio apesar de status 200; repetida com cabeçalhos do navegador preservados, exibiu ruas reais nas capturas abaixo.

O Chromium nativo não reconheceu a CA do proxy deste ambiente. Nenhuma verificação TLS foi desativada. Para a validação, as respostas HTTPS foram obtidas por urllib com a confiança já instalada no sistema e encaminhadas ao navegador. A tentativa de modificar permanentemente a confiança do Chromium foi rejeitada pela revisão automática e não foi aplicada.

### Reproduzir

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
node scripts/serve.cjs --port=8080
```

Em outro terminal, com Python Playwright e `/usr/bin/chromium` disponíveis:

```sh
python3 tests/browser-operations.py
```

O teste não escreve dados de aplicação: usa contextos descartáveis do navegador e salva evidências em `/tmp/arpias-operations` (ou `ARPIAS_TEST_OUTPUT`). As bibliotecas CDN são obtidas com verificação TLS do sistema; não é necessário reconstruir os vendors, que não foram alterados.

## Capturas

- [Desktop: camada de trabalho e ruas reais](operacao-20261007/desktop-camadas.png)
- [Desktop: consulta e ficha territorial](operacao-20261007/desktop-info.png)
- [Mobile: seleção acima da ficha](operacao-20261007/mobile-info.png)
- [Tablet: Camadas com falha externa simulada](operacao-20261007/tablet-camadas-falha-simulada.png)
- [Grupos do teste de navegador](operacao-20261007/resultados-browser.json)

## Limites

- Consulta/enquadramento remoto municipal e ortofoto precisam de nova validação quando o serviço sair do 503. A integração foi preservada.
- NASA foi verificada no endpoint de capabilities; não se afirma validação visual de imagens recentes nesta rodada.
- GPS foi simulado; permissões/toque/teclado em aparelho físico e impressão PDF continuam dependendo de verificação específica.
- Seleção é mantida durante a sessão, não restaurada após recarregar. Preferências ficam neste navegador, sem sincronização entre dispositivos.
- O modo automático depende de uma feição visível receber o clique; para procurar feições de uma camada oculta, escolha o alvo explicitamente.

Nenhum merge em `main` ou publicação GitHub Pages foi realizado. A branch é destinada à revisão antes de um futuro PR.
