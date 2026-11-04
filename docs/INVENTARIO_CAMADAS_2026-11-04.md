# Inventário inicial de camadas ARPIAS360

Fonte: `data/catalogo.json` na ramificação `feature/cinco-modos-visual-20261104`, consultado em 04/11/2026. Nenhum item foi removido ou renomeado.

**Atenção:** o arquivo contém **124 itens**, distribuídos em **14 categorias**, embora a interface atual informe 126. Divergência a verificar antes de atualizar o contador público. Estados `future` e `available` não significam camadas efetivamente carregadas no mapa.

| Categoria | ID | Itens | Integrados | Referenciados | Futuros | Modos prioritários propostos |
|---|---|---:|---:|---:|---:|---|
| Mapas de Referência | `base` | 3 | 3 | 0 | 0 | Todos |
| Riscos e Proteção Civil | `risk` | 11 | 4 | 0 | 7 | Defesa Civil, Forças Armadas, Gestão Pública |
| Estrutura Territorial | `territory` | 10 | 3 | 3 | 4 | Todos |
| Planejamento e Ordenamento Urbano | `planning` | 11 | 2 | 2 | 7 | Mercado Imobiliário, Gestão Pública, Policial |
| Meio Ambiente | `environment` | 10 | 3 | 3 | 4 | Defesa Civil, Gestão Pública, Mercado Imobiliário |
| Clima e Monitoramento | `climate` | 10 | 2 | 0 | 8 | Defesa Civil, Forças Armadas, Gestão Pública |
| Mercado Imobiliário | `market` | 12 | 0 | 6 | 6 | Mercado Imobiliário, Gestão Pública |
| Segurança Pública | `security` | 10 | 0 | 3 | 7 | Policial, Gestão Pública |
| Indicadores Socioespaciais | `social` | 10 | 0 | 0 | 10 | Mercado Imobiliário, Gestão Pública, Policial |
| Infraestrutura e Serviços | `infrastructure` | 9 | 0 | 0 | 9 | Todos |
| Cadastro Territorial | `cadastre` | 8 | 0 | 2 | 6 | Mercado Imobiliário, Gestão Pública |
| Gestão de Desastres | `disaster` | 6 | 0 | 0 | 6 | Defesa Civil, Gestão Pública |
| Fragilidade Urbana | `fragility` | 6 | 0 | 0 | 6 | Defesa Civil, Mercado Imobiliário, Gestão Pública |
| Relevo e Altimetria | `relief` | 8 | 1 | 7 | 0 | Defesa Civil, Forças Armadas, Mercado Imobiliário |

## Regras de preservação

1. A vinculação temática altera somente a ordem de exibição das categorias, nunca as geometrias, fontes, estados, identificadores ou controles.
2. O catálogo integral permanece disponível em todos os modos.
3. As camadas atualmente visíveis não são automaticamente desligadas na troca de modo.
4. Novos mapas de calor e indicadores não devem ser publicados sem dados reais, fonte, período e metodologia.
5. A versão pública `main` não foi alterada nesta etapa.

## Itens por categoria

### Mapas de Referência (`base`)
- Foto Aérea 2019 [integrated] · controle: `base_ortho`
- OpenStreetMap [integrated] · controle: `base_osm`
- Satélite recente [integrated] · controle: `base_recent`

### Riscos e Proteção Civil (`risk`)
- Sirenes de Alerta [integrated] · controle: `layer_sirenes`
- Rede Municipal de Pluviometria [integrated] · controle: `layer_pluviometros`
- NUDECs [integrated] · controle: `layer_nudecs`
- Pontos de Apoio Emergencial [integrated] · controle: `layer_pontos_apoio`
- Obras de Contenção / Obras de Encosta [future]
- Áreas Interditadas [future]
- Ocorrências de Inundação e Alagamento [future]
- Áreas Alagáveis [future]
- Movimentos de Massa [future]
- Danos Informados [future]
- Classes de Declividade [future]

### Estrutura Territorial (`territory`)
- Limite Municipal [integrated] · controle: `layer_limite`
- Limites de Bairros [integrated] · controle: `layer_bairros`
- Regiões Administrativas [available]
- Malha de Logradouros [available]
- Parcelas / Lotes Cadastrais [available]
- Edificações [future]
- Setores Cadastrais [future]
- Quadras Cadastrais [future]
- Hidrografia [integrated] · controle: `layer_hidro`
- Curvas de Nível [future]

### Planejamento e Ordenamento Urbano (`planning`)
- Plano Diretor [available]
- Macrozoneamento [future]
- ZEIS [integrated] · controle: `layer_zeis`
- ZEIA [integrated] · controle: `layer_zeia`
- Uso e Cobertura do Solo [available]
- Zoneamento de Uso e Ocupação do Solo [future]
- Coeficiente de Aproveitamento [future]
- Taxa de Ocupação [future]
- Taxa de Permeabilidade [future]
- Gabarito / Altura Máxima [future]
- Parâmetros Urbanísticos [future]

### Meio Ambiente (`environment`)
- Áreas de Preservação Permanente [integrated] · controle: `layer_appm`
- APP de Topo de Morro [available]
- Áreas de Proteção Ambiental [integrated] · controle: `layer_apa`
- Bacias Hidrográficas [available]
- Hidrografia [integrated] · controle: `layer_hidro`
- Uso e Cobertura do Solo [available]
- Áreas Verdes [future]
- Unidades de Conservação [future]
- Cobertura Vegetal [future]
- Suscetibilidade Ambiental [future]

### Clima e Monitoramento (`climate`)
- Satélite recente [integrated] · controle: `base_recent`
- Rede Municipal de Pluviometria [integrated] · controle: `layer_pluviometros`
- Radar Meteorológico de Niterói [future]
- Cemaden [future]
- Alertas Meteorológicos [future]
- Acumulado de Chuva [future]
- Precipitação [future]
- Temperatura [future]
- Clima Urbano / Ilhas de Calor [future]
- Eventos Extremos [future]

### Mercado Imobiliário (`market`)
- Transações Imobiliárias / ITBI 2020 [available]
- Transações Imobiliárias / ITBI 2021 [available]
- Transações Imobiliárias / ITBI 2022 [available]
- Transações Imobiliárias / ITBI 2023 [available]
- Transações Imobiliárias / ITBI 2024 [available]
- Transações Imobiliárias / ITBI 2025 [available]
- Quantidade de Transações [future]
- Valor Médio [future]
- Valor Mediano [future]
- Distribuição Territorial [future]
- Evolução Temporal [future]
- Indicadores Imobiliários [future]

### Segurança Pública (`security`)
- Circunscrições Integradas de Segurança Pública [available]
- Unidades de Segurança Pública [future]
- Delegacias [available]
- Indicadores ISP [available]
- Ocorrências agregadas por território [future]
- Evolução temporal [future]
- Crimes contra o patrimônio [future]
- Crimes contra a pessoa [future]
- Violência contra a mulher [future]
- Apreensão de armas [future]

### Indicadores Socioespaciais (`social`)
- IBGE [future]
- População Residente [future]
- Densidade Demográfica [future]
- Faixas Etárias [future]
- Renda [future]
- Rendimento Domiciliar [future]
- Escolaridade [future]
- Condições Habitacionais [future]
- Infraestrutura Domiciliar [future]
- Indicadores Sociais [future]

### Infraestrutura e Serviços (`infrastructure`)
- Rede Viária [future]
- Equipamentos de Saúde [future]
- Equipamentos Educacionais [future]
- Transporte Público [future]
- Equipamentos Públicos [future]
- Serviços de Emergência [future]
- Infraestrutura Urbana [future]
- Saneamento [future]
- Drenagem [future]

### Cadastro Territorial (`cadastre`)
- Logradouros [available]
- Lotes Cadastrais [available]
- Edificações [future]
- Quadras [future]
- Setores [future]
- Inscrição Imobiliária Municipal [future]
- CIB / SINTER [future]
- Identificador ARPIAS [future]

### Gestão de Desastres (`disaster`)
- S2ID [future]
- Registros Históricos de Desastres [future]
- Decretos de Situação de Emergência [future]
- Danos e Prejuízos [future]
- Eventos Registrados [future]
- Áreas Recorrentes de Ocorrência [future]

### Fragilidade Urbana (`fragility`)
- Índice ARPIAS de Fragilidade Urbana [future]
- Fragilidade Socioespacial [future]
- Fragilidade Ambiental-Climática [future]
- Fragilidade Institucional [future]
- Fragilidade Imobiliária [future]
- Violência / Segurança Territorial [future]

### Relevo e Altimetria (`relief`)
- Padrões de Relevo [integrated] · controle: `layer_relevo`
- Unidades Geomorfológicas [available]
- Hipsometria [available]
- Declividade [available]
- Curvas de Nível — 40 m [available]
- Pontos Cotados [available]
- Relevo Sombreado [available]
- Modelo Digital de Elevação — TOPODATA / INPE [available]
