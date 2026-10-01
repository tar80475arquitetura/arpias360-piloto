# Índice ARPIAS de Fragilidade Urbana

**Em desenvolvimento metodológico — sem pontuações ou classificação cartográfica.**

A arquitetura declarativa está em `config/fragilidade.json`. O catálogo apresenta a camada analítica experimental, sem switch, geometria, pesos ou valores fictícios. A ação **Como esta pontuação é calculada?** informa que o cálculo ainda não está habilitado e mostra disponibilidade, direção, fontes e limitações por dimensão.

## Viabilidade atual

| Dimensão | Disponibilidade | Possibilidade atual | Limite para cálculo |
|---|---|---|---|
| Unidade territorial | Disponível | Bairros e limite oficiais como candidatos à agregação | Escolha da unidade, escala e compatibilidade ainda não definidas |
| Risco territorial | Futura | Referências no catálogo | Sem alagamentos, encostas ou ocorrências integradas; ZEIS e comunidades não substituem risco |
| Clima | Parcial | 38 localizações de pluviômetros municipais | Sem séries de chuva e eventos; localização não mede precipitação |
| Estrutura urbana | Parcial | Bairros, lotes e comunidades oficiais | Sem medidas comparáveis de serviços, acessibilidade ou ocupação |
| Socioespacial | Futura | Referências previstas | Sem vulnerabilidade calculada; não inferir a partir de comunidades |
| Segurança | Futura | Fontes identificadas no catálogo | Sem séries agregadas compatibilizadas e denominadores populacionais |
| Mercado | Futura | Referências ITBI 2020–2025 | Não há indicadores calculados; interpretar direção exige hipótese e validação |
| Proteção/resposta | Parcial | Cadastros reais de 138 equipamentos/locais | Sem comprovação operacional, capacidade e áreas de cobertura |

Os anos dos cadastros não informados não são substituídos pelo ano de revisão do software. Cadastros não confirmam funcionamento atual. Pluviômetros municipais não são Cemaden.

## Condições para habilitar resultados

Definir unidade territorial, períodos e fontes; validar cobertura e qualidade; documentar a direção de cada variável (aumenta, reduz ou contextualiza); definir normalização, tratamento de ausências e pesos fundamentados; testar sensibilidade e incerteza; revisar a metodologia academicamente. Não somar indiscriminadamente variáveis de risco e capacidade de resposta.

A escala 0–100 e as cinco classes são propostas. Não há limiares, fórmula ou pesos aprovados. Ausência de dados deve aparecer como **sem resultado**, jamais como zero ou baixa fragilidade.

A representação principal futura será por polígonos territoriais, com decomposição da pontuação por dimensão e rastreabilidade de indicadores, pesos, fontes, anos, fórmula e atualização. Heatmap poderá ser complementar, sem substituir essa leitura. Resultados somente poderão aparecer após cálculo real validado.

O índice pretende sintetizar de modo transparente a pergunta de pesquisa: **“O que os dados de mercado imobiliário, segurança pública, clima e território revelam quando passam a ser vistos juntos em um único mapa?”** Coincidência espacial não demonstra causalidade.

Esta arquitetura não é classificação da Prefeitura, laudo, parecer da Defesa Civil ou diagnóstico conclusivo. Última revisão da arquitetura: 01/10/2026.
