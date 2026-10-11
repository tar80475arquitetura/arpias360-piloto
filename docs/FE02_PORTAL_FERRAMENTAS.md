# FE-02 — Portal de ferramentas

## Como acessar

Na versão desta branch, abra a URL principal: o portal pergunta **“Qual ferramenta você deseja utilizar?”**. Escolha Resiliência Ambiental, Ordem Territorial, Análise Integrada ou Mapa Livre. **Pular apresentação · Mapa Livre** entra diretamente no WebGIS. Não há cadastro nem uma segunda tela obrigatória.

O portal aparece novamente ao abrir a URL principal, mesmo com preferências salvas. Assim, o QR público da feira continua apresentando as quatro escolhas. O botão **Continuar em …** e o cartão destacado lembram a última opção. O perfil é opcional: Cidadão, Gestor público, Empresa ou Pesquisador; não concede privilégios nem restringe dados.

No mapa, use o botão com quatro quadrados no cabeçalho para voltar ao portal. No painel Camadas, o mesmo botão fica ao lado de **Trocar ferramenta**; funciona também quando o painel é modal no celular. O seletor troca diretamente de contexto. Em tela cheia, há um botão **Portal de ferramentas** na área cartográfica. **Sobre este contexto** explica o tema sem ocupar permanentemente o conteúdo do painel.

Os temas colocam suas categorias primeiro e destacam sua borda em verde. Mapa Livre restaura a ordem original. Mapas de Referência, Camada de trabalho e Minhas camadas continuam acessíveis. As 14 categorias e os 126 itens permanecem completos. A escolha não ativa camadas, não muda opacidade ou maturidade e não abre/fecha painéis. O mapa Leaflet, a seleção, os desenhos, as consultas, as medições e suas preferências são preservados durante as trocas.

## Links e persistência

Links reconhecidos pelo contrato existente (`lat`, `lon`, `zoom`) abrem o mapa diretamente, mantendo a URL e a seleção compartilhada. Coordenadas inválidas mantêm a validação e a notificação original do WebGIS; mensagens posteriores de indisponibilidade de fontes podem substituir o aviso transitório. Parâmetros desconhecidos não são descartados e não dispensam o portal. Não existe contrato de compartilhamento por identificador de feição implementado nesta versão; não foi criado um destino fictício.

Somente ferramenta e perfil são guardados na chave separada `arpias360.portal.v1`, com versão e valores validados. Falhas de leitura, JSON malformado e bloqueio/quota de armazenamento não impedem a navegação. Falhas de gravação aparecem ao voltar ao portal. As chaves de preferências cartográficas e desenhos continuam independentes.

## Implementação e limites

- `js/portal.js`: configuração dos quatro contextos, categorias, validação, persistência e reconhecimento dos links.
- `js/portal-ui.js`: cartões, navegação, foco, bloqueio do fundo, retorno da tela cheia e reordenação dos nós existentes do catálogo. Nenhuma instância de mapa é recriada.
- `css/portal.css` e `index.html`: apresentação, SVGs próprios, seletor compacto, retorno permanente e responsividade.
- Os contratos de `publicStatus()`, `data-state`, fontes, geometria, privacidade cadastral, relatórios e métodos científicos não são alterados. O IFUC permanece experimental. A Jornada Territorial 001 é futura e não foi implementada.
- Sem novas dependências. Tipografia do sistema, cores do ARPIAS360, foco visível, fundo inerte durante a apresentação, ciclo de Tab e Escape sem efeitos no mapa coberto.

## Base e convivência com PR #5

`main` foi confirmado em `a02dabd2e89ae9b77e0c9e4d5275066cb204102a`. O PR #5 estava aberto e mergeable, com head `6133c1f0409de9056319cf1ea573959a94c27b23`. A branch `codex/fe02-portal-ferramentas` deriva desse head, preservando integralmente seus painéis móveis e histórico.

O PR FE-02 tem base `main` e depende do PR #5. Enquanto #5 permanecer aberto, a comparação com main também inclui seu commit. A comparação com `codex/painels-moveis` isola as mudanças FE-02. Um merge normal de #5 mantém seu commit como ancestral e deixa o diff posterior focado no portal, sem force-push ou reescrita. Nenhum PR foi mesclado nesta rodada; Pages e main não foram alterados.

## Verificação reproduzível

Com dependências existentes instaladas e servidor local em execução na porta 8080:

```sh
npm test
python tests/browser-operations.py
python tests/browser-round2.py
```

O script operacional executa também FE-01A, mobilidade e `browser-portal.py`, incluindo a nova suíte na CI já existente. O helper de entrada dos testes antigos escolhe explicitamente Mapa Livre; suas expectativas cartográficas continuam intactas. A suíte exclusiva testa a apresentação antes dessa entrada.

Resultados locais finais: **111 testes unitários aprovados**, sem falhas ou ignorados; **37 grupos de navegador aprovados** (14 operacionais, 11 Rodada 02, 4 FE-01A, 2 mobilidade, 6 portal). O portal cobre as quatro opções, mesmo mapa, preservação de estado, opacidade zero, catálogo completo e ordem, perfil, preferências, QR raiz, links válidos/inválidos, armazenamento indisponível, teclado, contraste de textos ≥ 4,5:1 e retorno da tela cheia. Tamanhos: 1920×1080, 1366×768, 1024×768, 768×1024, 390×844 e 320×568. A regressão FE-01A inclui zoom nativo 200%.

As capturas e JSON estão em [tests/evidence/fe02](../tests/evidence/fe02/README.md). Foram gerados no frontend local com Chromium real, CDN obtido com TLS normal e fontes GIS externas respondendo **503 simulado**. Isso verifica navegação, dados locais, falhas e controles; não homologa serviços GIS reais, GPS físico ou site publicado. A CI do PR deve ser acompanhada antes da aprovação; seu resultado final é informado no PR e na entrega, sem antecipar sucesso.

## Próximas melhorias propostas

1. Homologação presencial do portal e seus nomes com os quatro perfis, incluindo leitor de tela.
2. Exemplos orientados de leitura com fontes já integradas, sem criar indicadores artificiais.
3. Definição futura do contrato de links por feição e contexto, com validação e privacidade explícitas.
