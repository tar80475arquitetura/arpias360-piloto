# Trabalho noturno — ARPIAS360

Data: 01/10/2026. Branch: `codex/gecad-final`.
Repositório: `tar80475arquitetura/arpias360-piloto`.

## Entrega e commits

Base da Fase 1: `cf04cc65a0c640bd33e75a3c425c2c75d6f1d45f`.
Implementação: `9272238` — `feat: adapta interface responsiva e compartilha pontos por coordenadas`.
Documentação e capturas: commit com título `docs: registra testes e auditoria visual do trabalho noturno`; o hash final está no histórico Git e no relatório da conversa.

Destino autorizado: somente `origin codex/gecad-final`. Sem merge, produção ou alterações de configuração do GitHub Pages.
A referência local `main` permaneceu em `1a4d3eae7a576dc66a7f81b4102ae919556aaa8e`.

## Arquivos

- `index.html`: estrutura responsiva, categorias, menus e painéis.
- `css/style.css`: identidade territorial, variáveis, breakpoints e controles acessíveis.
- `js/app.js`: apresentação das camadas, consulta, foco, compartilhamento e adaptação do mapa.
- `js/location.js`: novo módulo pequeno de validação e construção de URLs.
- `tests/core.test.cjs`: adaptação do ambiente de testes e cobertura de compartilhamento.
- `tests/location.test.cjs`: novos testes de parâmetros e links.
- `docs/TRABALHO_NOTURNO.md` e `docs/testes-noturnos/`: relatório, capturas e medidas.

Os quatro GeoJSON, o manifesto de fontes e `docs/DADOS_RECUPERADOS.md` não foram alterados. Nenhuma biblioteca adicional foi introduzida. Conteúdo conceitual e metodologia preservados.

## Experiência por dispositivo

Desktop, a partir de 1200px: painel lateral de 332px, recolhível, mapa dominante, categorias expansíveis e informações simultâneas. Busca principal sobre o mapa; busca duplicada no painel escondida nessa faixa.

Notebook, 900–1199px: painel de 290px, cabeçalho e controles compactos; ferramentas secundárias agrupadas em Mais. Verificação adicional em 1024x768 cobre essa faixa, além das dimensões obrigatórias.

Tablet, 600–899px: drawer temporário com fundo modal, rolagem interna, controles para toque e mapa ocupando toda a largura quando fechado.

Mobile, até 599px: cabeçalho compacto, busca grande, ações Camadas e Minha localização na base da tela. Camadas em bottom sheet com rolagem interna e rodapé fixo. Consulta do ponto em outro bottom sheet, com espaço reservado e reposicionamento do ponto para ficar visível.

A identidade usa verde-petróleo, grafite esverdeado, verde territorial e âmbar, com cores centralizadas. Estados também têm texto e símbolos. Controles possuem nomes acessíveis, foco visível e áreas de toque ampliadas. O painel modal impede interação com o fundo; Escape fecha e devolve foco ao acionador. CSS respeita redução de movimento. Isso não equivale a uma certificação WCAG ou teste completo com leitor de tela.

## Funções implementadas

- Camadas organizadas em Defesa Civil, Território, Meio Ambiente e Áreas Sensíveis; catálogo futuro distribuído nas demais categorias solicitadas.
- Switches ON/OFF com linha de rótulo ampla e ícones distintos, estados de carregamento, sucesso e falha.
- Carregamento sob demanda das quatro camadas locais e manutenção dos serviços territoriais existentes.
- Seleção exclusiva de mapa-base. Fallback existente preservado.
- Limpar camadas remove camadas temáticas, consulta e marcadores temporários; preserva mapa-base e enquadramento. Ver Niterói é a ação separada para reenquadrar.
- Consulta no mapa por clique/toque e coordenadas; popup no desktop e bottom sheet no celular.
- Google Maps, Street View e Earth usam coordenadas do ponto, links com proteção de nova aba e conteúdo construído como texto seguro.
- Copiar coordenadas aguarda a conclusão do clipboard e comunica falha quando necessário.
- URL `?lat=-22.942424&lon=-43.055849&zoom=15` abre consulta no ponto. Latitude e longitude são obrigatórias em conjunto e numéricas; parâmetros repetidos ou inválidos são rejeitados. Zoom é inteiro de 10 a 23; sem zoom usa 17.
- Compartilhar ponto gera link da origem e caminho atuais contendo somente latitude, longitude e zoom. Remove demais parâmetros, fragmentos e credenciais. Copia o link e oferece campo manual quando a cópia falha.
- Busca por bairros e coordenadas preservada; seleção encerra foco do campo para favorecer fechamento do teclado virtual. Não foi testado teclado físico de um telefone real.

Em localhost, o link compartilhado só funciona no dispositivo que serve a aplicação. Compartilhamento entre pessoas depende de uma origem acessível já autorizada pelo responsável. Esta sessão não realizou publicação.

## Estruturas apenas preparadas

Identificação territorial apresenta inscrição municipal como “Dado ainda não integrado” e identificador ARPIAS como “Integração futura”. Não há cadastro inventado ou inferido.

Pontuação de Fragilidade apresenta “Integração futura” e o texto autorizado. Não existem pesos, faixas, pontuação, classificação automática ou IFUC.

ITBI, ISP, Radar Niterói, Cemaden, S2ID, GeoReDUS, fontes adicionais do IBGE, SINTER, CIB e 3D interno continuam sem nova integração. A busca por ruas está explicitamente identificada como futura.

## Validação e resultados

`node --test tests/core.test.cjs tests/location.test.cjs`: **16 testes aprovados, zero falhas**. Incluem contagens e coordenadas dos dados, rejeição de coleções inválidas, HTTP/JSON com falha, proteção de conteúdo externo, clipboard assíncrono com erro, links Google, falha isolada e nova tentativa de camada, substituição de marcador de geolocalização, restauração de base após falha de satélite, compartilhamento e parâmetros de URL inválidos/duplicados.

`node --check js/app.js` e `node --check js/location.js`: aprovados. `git diff --check`: aprovado; apenas avisos de normalização LF/CRLF do Git. Diff dos dados recuperados e sua documentação: vazio.

No navegador local, quatro switches ativados renderizaram exatamente **37 sirenes, 38 pluviômetros municipais, 36 NUDECs e 27 pontos de apoio**, total **138**. Contagem efetuada nos elementos renderizados do mapa. Todos alcançaram Disponível após carregar. Limpar camadas resultou em zero marcadores civis e zero switches civis ativos.

Fonte preservada: Prefeitura de Niterói / GeoNit / Defesa Civil. Pluviômetros são municipais, sem atribuição ao Cemaden e sem medições atuais adicionadas. Atributos operacionais não são interpretados como garantia de funcionamento atual.

Consulta por toque exibiu coordenadas e bairro existente; clipboard retornou as mesmas coordenadas. Consultas sucessivas mantiveram somente um marcador temporário. Escape devolveu foco a Camadas. Link válido abriu consulta; compartilhar removeu um parâmetro de teste e fragmento. Latitude 91 produziu aviso e nenhum marcador. Não houve mensagens de erro ou aviso no console consultado ao final desses fluxos.

Todas as dimensões obrigatórias foram verificadas: **360x800, 390x844, 412x915, 768x1024, 1366x768 e 1920x1080**, mais **1024x768**. A largura de rolagem do documento coincidiu com a viewport em todas. O mapa ajustou largura e altura e o painel iniciou oculto nas faixas compactas e aberto nas faixas largas. Medidas em `testes-noturnos/resolucoes.json`. As capturas registram a inspeção visual e os fluxos adicionais de abertura/fechamento.

## Capturas

- `testes-noturnos/viewport-1920x1080.png`: desktop com painel.
- `testes-noturnos/viewport-1366x768.png`: tela intermediária obrigatória.
- `testes-noturnos/viewport-1024x768.png`: notebook no breakpoint dedicado.
- `testes-noturnos/viewport-768x1024.png`: tablet, mapa.
- `testes-noturnos/tablet-drawer.png`: tablet, drawer aberto.
- `testes-noturnos/viewport-360x800.png`, `viewport-390x844.png`, `viewport-412x915.png`: mobile, mapa sem camadas civis.
- `testes-noturnos/mobile-camadas.png`: bottom sheet de camadas.
- `testes-noturnos/mobile-defesa-civil.png`: camadas reais ativas.
- `testes-noturnos/mobile-consulta.png`: consulta do ponto.
- `testes-noturnos/mobile-fragilidade.png`: módulo futuro.

## Correções e limites

Corrigidos painel desktop comprimido no celular, controles pequenos, duplicação da busca em desktop, apresentação de consulta sobreposta às ações mobile, persistência de múltiplos pontos de consulta e links compartilhados contendo parâmetros alheios ao ponto. Melhorados foco, feedback, organização e clareza dos estados.

Ortofoto de 2019 foi observada renderizando na visão municipal. A cobertura deixa espaços fora do município, e o serviço pode falhar em certos enquadramentos; fallback de ruas continua disponível. Não houve mudança estrutural no serviço. O teste automático do fallback de satélite é simulado e não comprova disponibilidade contínua dos serviços externos.

Busca por ruas continua pendente. Permissão e precisão de geolocalização real, teclado virtual, leitor de tela e navegador de telefone físico precisam de teste humano. O teste automático cobre substituição do marcador; não houve concessão automatizada de permissão de localização nesta sessão.

Validação territorial estrita contra polígono oficial ainda permanece pendente da auditoria anterior; não se declara concluída nesta entrega. Serviços públicos externos continuam sujeitos à disponibilidade e certificados da origem.

## Avaliação humana e próximo prompt

Revisar identidade visual e ergonomia em telefone real; confirmar conteúdo e prioridade das categorias futuras; decidir uma origem de homologação para testar links entre dispositivos; avaliar política de busca por ruas e continuidade da ortofoto. Integrar cadastro, novos indicadores ou pontuação exige decisão específica e validação metodológica.

Para a manhã: revisar esta branch e as capturas, testar geolocalização/teclado/acessibilidade em dispositivos reais, resolver a verificação territorial pendente e definir a próxima integração com fonte e escopo explícitos. A entrega encerra aqui; não inicia nova fase, merge ou publicação.
