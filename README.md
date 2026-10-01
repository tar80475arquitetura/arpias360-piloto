# ARPIAS360 | Piloto Niterói/RJ

Portal WebGIS público e experimental do **ARPIAS360 — Avaliação de Riscos e Planejamento Integrado de Áreas Sensíveis**.

## Objetivo
Integrar e visualizar, em uma única interface, dados públicos territoriais, ambientais, climáticos, imobiliários, de segurança pública e de riscos e desastres, preservando a distinção entre dados funcionais, parciais e planejados.

## Decisões cartográficas
- **Território-piloto:** Niterói/RJ.
- **Ortofoto principal:** mosaico oficial de 2019 da Prefeitura de Niterói/SIGeo, usado como base cartográfica de alta resolução e sempre identificado como histórico.
- **Satélite recente:** NASA GIBS/VIIRS, usado apenas como referência temporal complementar, com resolução inferior à ortofoto.
- **TopoVision:** referência conceitual de arquitetura e organização de camadas; não é fonte territorial do piloto.

## Camadas funcionais no protótipo
- Ortofoto Niterói 2019.
- Limite municipal oficial.
- Bairros oficiais.
- Lotes públicos, carregados a partir do zoom 16.
- Hidrografia.
- ZEIS.
- Comunidades.
- Zona de Especial Interesse Ambiental.
- Área de Proteção Permanente Municipal.
- Área de Proteção Ambiental Municipal.
- OpenStreetMap e mapa claro.
- Busca de bairro, coordenadas, retorno ao enquadramento municipal, geolocalização opcional e tela cheia.

## Em integração
- ITBI 2020–2025: fonte oficial validada; a integração cartográfica requer geocodificação e/ou agregação territorial.
- Indicadores ISP, Cemaden e S2ID.
- IPTU/SINTER/CIB somente em desenho futuro que preserve sigilo, finalidade e proteção de dados.

## Segurança de publicação
Este repositório contém somente a versão pública do portal. Não devem ser incluídos tokens, chaves privadas, credenciais, dados pessoais, dados fiscais individualizados, bases internas, manuscritos de trabalho ou arquivos de desenvolvimento restritos.

## Aviso metodológico
O ARPIAS360 é um protótipo científico e tecnológico. As informações apresentadas não substituem sistemas oficiais, levantamentos de campo, vistorias, laudos técnicos ou decisões das autoridades competentes. Bases com períodos, metodologias e escalas distintos devem ser interpretadas com cautela; coincidência espacial não implica causalidade.

## Publicação
O portal foi estruturado como site estático para publicação via GitHub Pages a partir da branch `main` e da pasta raiz `/`.
