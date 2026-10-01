# Fase 1 — implementação e testes

Data: 01/10/2026. Repositório: `tar80475arquitetura/arpias360-piloto`.
Branch: `codex/gecad-final`. Sem merge, push ou commits locais nesta fase.

## Implementação

- Grupo Defesa Civil com quatro controles independentes, inicialmente desligados, símbolos SVG locais, status de carregamento e botão de informação.
- Leitura dos GeoJSON existentes com verificação de HTTP, JSON, FeatureCollection, features, contagens e coordenadas. Falhas isoladas por camada e possibilidade de nova tentativa.
- Metadados apresentados a partir de `data/fontes-recuperadas.json`.
- Popups criados com elementos DOM e `textContent`, inclusive os serviços territoriais preexistentes. Ações externas usam a coordenada da feature e proteção `noopener noreferrer`.
- Consulta por clique/toque, com um marcador temporário. Nova consulta substitui a anterior.
- Busca com limites de latitude/longitude, feedback assíncrono de clipboard, um único marcador de geolocalização e redimensionamento observado após alterações do painel.
- Ferramentas essenciais preservadas no mobile. Quando um popup está aberto, os controles flutuantes que poderiam cobri-lo ficam temporariamente ocultos; a barra principal permanece disponível, inclusive Camadas e a busca no painel. Fechar o popup restaura os controles flutuantes.
- Limpar mapa fecha popup, remove consultas, localização e destaques, desativa todas as sobreposições selecionáveis, mantém a base e enquadra Niterói. Ver Niterói apenas reenquadra, preservando camadas.
- Catálogo verifica HTTP e estrutura e apresenta mensagem em caso de erro.
- Bases possuem status determinado por eventos de tiles. NASA preserva a base anterior durante o carregamento e retorna a ela em caso de falha; existe limite de espera. Ortofoto indisponível usa OSM como alternativa.
- Corrigido fechamento de bloco CSS móvel que estava ausente no arquivo original.

## Dados preservados

Os quatro GeoJSON, o manifesto de fontes e `docs/DADOS_RECUPERADOS.md` não foram modificados.

| Camada | Marcadores confirmados no navegador |
|---|---:|
| Sirenes de alerta | 37 |
| Pluviômetros municipais | 38 |
| NUDECs | 36 |
| Pontos de apoio | 27 |
| Total | 138 |

Fonte: **Prefeitura de Niterói / GeoNit / Defesa Civil**.
Pluviômetros municipais permanecem separados de Cemaden e sem medições atuais.
O campo cadastral `operacional` dos NUDECs é exibido sem conversão para confirmação de operação atual. Endereços nulos são omitidos. Pontos de apoio não são apresentados como atualmente abertos.

A validação estrutural e de intervalos das coordenadas está concluída. A conferência de cada ponto contra o polígono administrativo oficial de Niterói permanece pendente pela falha de certificado externo já registrada.

## Testes

Servidor utilizado: `http://127.0.0.1:8080`, executado com `node scripts/serve.cjs`. Nenhum teste por `file://`.

| Verificação | Resultado |
|---|---|
| Inicialização e console final do ARPIAS360 | Sem erro ou aviso na sessão final |
| Quatro camadas locais | Carregamento, controles, símbolos e contagens confirmados |
| Popups das quatro camadas | Conteúdo, fonte, coordenadas e avisos conferidos |
| Limite municipal e bairros | Carregaram no navegador |
| Busca de Icaraí | Retornou geometria e popup do bairro |
| Coordenadas inválidas | `91, -43` rejeitado com mensagem compreensível |
| Busca por coordenadas | Popup correto; consultas sucessivas mantiveram somente um marcador |
| Consulta por clique/toque | Popup LOCAL SELECIONADO com ações |
| Clipboard | Sucesso verificado no navegador; rejeição e espera da Promise testadas automaticamente |
| Geolocalização | Substituição do marcador testada automaticamente; aquisição real pelo dispositivo e permissão do sistema não foram exercitadas |
| Painel | Abrir/fechar e redimensionamento verificados |
| Ver Niterói | Preservou as 38 estações selecionadas; contagem final das quatro camadas também preservada |
| Limpar mapa | Zero sobreposições selecionadas e zero marcadores de consulta/Defesa Civil; base preservada |
| OSM | Tiles renderizados |
| Ortofoto 2019 | Carregamento parcial/intermitente; erros de tiles acionaram OSM sem erro JavaScript |
| NASA GIBS/VIIRS | Tiles de 29/09/2026 carregados e renderizados, com dimensão natural de 256 × 256; baixa resolução observada |
| Google Maps | URL abriu resultado com as coordenadas do ponto de apoio testado |
| Ver fachada | URL abriu a aplicação Street View; cobertura e correspondência de fachada não garantidas |
| Google Earth | URL correta abriu o site; cena 3D não confirmada no navegador de teste; avisos de fonte no próprio site externo |
| Mobile | Viewport 390 × 844: ferramentas, busca, consulta, camadas, Sobre, retorno e limpeza conferidos; viewport restaurado ao final |

Comandos de verificação:

```text
node --check js/app.js
node --test tests/core.test.cjs
git diff --check
git diff --exit-code -- data/processed/defesa-civil data/fontes-recuperadas.json docs/DADOS_RECUPERADOS.md
```

**10 testes automatizados passaram**, cobrindo dados reais, coordenadas, coleções inválidas, falhas HTTP/JSON, valores de popup como texto, clipboard, links, recuperação de camada, substituição de geolocalização e fallback do satélite.

Evidências: [desktop](testes-fase1/desktop.png), [mobile](testes-fase1/mobile.png), [satélite](testes-fase1/satelite.png).

## Arquivos

Modificados: `index.html`, `css/style.css`, `js/app.js`, `data/camadas.json`.

Criados: `scripts/serve.cjs`, `tests/core.test.cjs`, este relatório e as três imagens em `docs/testes-fase1/`.

Nenhuma integração da Fase 2 foi adicionada. Nenhuma decisão técnica exige aprovação para manter esta implementação local; publicação/merge seguem aguardando autorização. Alterações estão disponíveis para revisão na branch de trabalho.
