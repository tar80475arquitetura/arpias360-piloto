# Rodada 02 — correções e critérios de homologação

Base: `e148903d0c31e61d4dbb9ac8904af5f9fa35c8e6`, branch `codex/arpias360-next`.
Trabalho preservado em 08/10 e concluído localmente em 09/10/2026. O SHA de entrega é o commit que inclui este documento; a comparação completa e os resultados de CI ficam no PR.

## Correções

- **R01:** a captura usa o mesmo renderer de seleção do mapa, acessado por `map.getPane('arpiasSelection')`. Desenha cada superfície uma vez, depois dos marcadores. A cópia SVG perde apenas a transformação de posicionamento do elemento raiz: a posição já é aplicada por `drawImage`, evitando aplicar a translação duas vezes. Símbolos, caminhos e atributos não são substituídos. A geração não reenquadra o mapa nem ativa a origem oculta. Seleção fora da vista exige a ação explícita Enquadrar; ausência de tiles ou erro de captura impede impressão com mensagem explícita. PDF permanece uma impressão do navegador.
- **R02:** `ARPIASSearch.selectionFeature` valida e copia todas as partes Polygon/MultiPolygon. Não faz união, reparo ou recorte. Preserva anéis internos e usa somente atributos comuns na geometria composta, evitando atribuir a todo o bairro o identificador de uma parte. Área soma áreas das partes descontando furos; perímetro soma todos os contornos, inclusive internos, sem dissolver limites compartilhados. Sobreposições preexistentes não são resolvidas por essa operação. Enquadramento, destaque, métricas e relatório usam a mesma feição. A proteção de cópia/edição multipartes oficial permanece.
- **R03:** `infoModal` é uma API explícita de `ARPIASUI`. Informações do relevo continuam acessíveis sem download bem-sucedido. Fonte CPRM/SGB, 2017, 1:30.000, 399 polígonos, quatro classificações e advertências preservados.
- **R04:** maturidade e estado operacional são independentes, inclusive nas bases e aliases. Eventos de carregamento não promovem maturidade. Não existe mais a atribuição de sucesso às coleções civis ao montar o catálogo. Estado `load` posterior a erro da mesma carga não apaga a falha. Checkbox não comprova carregamento; presença no mapa e opacidade zero são explicitadas.

## Maturidade: caminho para DISPONÍVEL

O registro `validations` em `js/catalog.js` é deliberadamente vazio. Não promover entradas com base em URL, controle ou testes com fontes simuladas.

Para adicionar uma homologação, um revisor deve conferir e registrar, na chave do controle:

- `control`: identificador exato; o item precisa ser `integrated` e ter controle real;
- `sha`: 40 caracteres hexadecimais do commit efetivamente homologado;
- `date`: data ISO da homologação;
- `scope: 'end-to-end'` e `result: 'passed'`;
- `report`: URL HTTPS de evidência reproduzível com resultados, capturas e condições;
- `reviewer`: responsável pela revisão.

A evidência deve cobrir carregamento, conteúdo/geometria, fonte/data, visibilidade, consulta, metadados, falha e recuperação. Para serviço remoto, incluir validação real datada; para arquivo local, validar o recurso publicado e o fluxo no navegador. Um teste com serviço interceptado não satisfaz a homologação remota. Registrar limitações e invalidar/revisar a entrada quando mudar código de integração, fonte, dado ou contrato relevante. O código valida a estrutura do registro; a veracidade e aplicabilidade do relatório exigem revisão humana. Nenhuma entrada foi promovida nesta rodada.

PLANEJADO prevalece para `future`; sem evidência completa os outros itens permanecem EM INTEGRAÇÃO. Após homologação, uma falha temporária continua sendo falha de carregamento, sem revogar ou fabricar a maturidade.

## Contagens antes/depois

| Universo | Antes | Depois |
|---|---:|---:|
| Categorias | 14 | 14 |
| Registros JSON | 124 | 124 |
| Entradas de interface | 126 | 126 |
| Camadas distintas implementadas | 17 | 17 |
| Registros com control / controles distintos no JSON | 18 / 15 | 18 / 15 |
| Planejados | 80 | 80 |

A classificação da auditoria tinha 19 implementados não validados + 25 em integração. Ambos convergem para a maturidade pública EM INTEGRAÇÃO nesta regra de três estados: **44 EM INTEGRAÇÃO, 80 PLANEJADO e 0 DISPONÍVEL**. Isso altera o vocabulário, não os registros ou suas geometrias. Os 19 são os 18 registros com controle e Unidades Geomorfológicas, que reutiliza a classificação do relevo. Os outros 25 são os demais registros `available`. Dois controles adicionais (lotes e comunidades) explicam 126 entradas. Os três aliases não criam camadas. `data/camadas.json` é inventário histórico, não determina status operacional nem constitui homologação atual; foi preservado junto com os dados científicos.

## Testes e reprodução

Validação inicial da retomada: **92/92 aprovados**, sem mudanças nas expectativas. Validação final Node: **97/97 aprovados**. Em relação à base auditada, são 12 novos casos (9 em round2 e 3 em report). Os cenários antigos foram preservados; a expectativa de maturidade em stabilization foi ajustada ao contrato intencional da Rodada 02, não para encobrir falha.

- `tests/round2.test.cjs`: partes únicas/compostas, furos reais, métricas, imutabilidade, enquadramento, rejeição explícita, proteção oficial, maturidade/evidência, opacidade e contagens.
- `tests/report.test.cjs`: atributos públicos, fontes, dados pessoais excluídos, base vazia, captura rejeitada e seleção fora da vista. Harness simulado, não prova pixels.
- `tests/browser-round2.py`: **11 grupos**, Leaflet/DOM/canvas reais; ponto/linha/polígono/multipartes com origem visível e oculta; comparação de pixels com/sem seleção, contagem de superfícies desenhadas, mapa/atributos preservados, menu de relatório, PDF Chromium, erro de captura, clique nas informações do relevo antes/depois de falha e quatro classificações; aliases, carregamento, falha e opacidade zero.
- `tests/browser-operations.py`: **14 grupos**, incluindo camada de trabalho, seleção durável, preferências, desenho/medição, arraste e seis resoluções: 1920×1080, 1366×768, 1024×768, 768×1024, 390×844 e 320×568.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
python -m pip install playwright==1.62.0
python -m playwright install chromium
# Verificar primeiro se já há servidor em 8080; não duplicar o processo.
node scripts/serve.cjs --port=8080
# Em outro terminal, ARPIAS_CHROMIUM vazio usa Chromium instalado pelo Playwright:
ARPIAS_CHROMIUM='' ARPIAS_TEST_OUTPUT=/tmp/arpias-browser python tests/browser-operations.py
ARPIAS_CHROMIUM='' ARPIAS_TEST_OUTPUT=/tmp/arpias-browser python tests/browser-round2.py
```

Localmente foi reutilizado o servidor existente, Node 24 e Chromium do sistema com Playwright 1.62.0. O CI usa Node 22, Python 3.12 e Chromium do Playwright. Job browser tem timeout de 15 minutos e publica capturas, PDF e JSON em artefato vinculado ao SHA. Os JSON registram SHA, worktree modificada ou limpa, horário UTC e ID de execução GitHub. Execuções locais anteriores ao commit aparecem como dirty; não devem ser confundidas com uma execução do commit final no CI.

## Limites e riscos

As bibliotecas CDN são obtidas com TLS verificado. Serviços GIS são interceptados com falhas controladas. Dados locais civis/CPRM são reais; geometrias e tile dos testes de captura são explicitamente sintéticos e não entram no produto. O PDF de teste comprova impressão Chromium, não mapas municipais disponíveis. Não houve validação atual de GeoNit/NASA/OSM, GPS físico, Safari/Firefox, leitor de tela ou impressão física. Esses itens continuam exigindo homologação própria.

Riscos principais: composição SVG, regras de agregação sem dissolução, estado assíncrono de aliases e formatos de evidência. Coberturas anteriores de preferências, armazenamento independente, proteção oficial, exportação, links, consultas obsoletas e opacidade permanecem na suíte. Não foram modificados dados científicos, geometrias oficiais, dependências de produção, identidade visual ou integrações temáticas.

Main, configurações Pages e publicação não são alterados por esta rodada. O PR requer revisão e autorização específica para merge.
