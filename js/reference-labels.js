/* Toponymic context only: no neighbouring municipal geometry is fetched. */
const regionalReferences=[
  {name:'São Gonçalo',lat:-22.8216350,lon:-42.9956797,source:'OpenStreetMap / Nominatim · relação 2220792',url:'https://www.openstreetmap.org/relation/2220792'},
  {name:'Maricá',lat:-(22+55/60+10/3600),lon:-(42+49/60+7/3600),source:'Prefeitura Municipal de Maricá · CP 01/2024',url:'https://www.marica.rj.gov.br/wp-content/uploads/2024/09/CP_01-2024.pdf'},
  {name:'Rio de Janeiro',lat:-(22+54/60+23/3600),lon:-(43+10/60+21/3600),source:'Prefeitura da Cidade do Rio de Janeiro · apresentação geográfica',url:'https://www.rio.rj.gov.br/web/guest/exibeconteudo?article-id=87129'}
];
regionalReferences.forEach(reference=>{
  L.tooltip({permanent:true,direction:'center',className:'territory-label municipality-label context-label',interactive:false})
    .setLatLng([reference.lat,reference.lon]).setContent(element('span',reference.name)).addTo(map);
});
map.attributionControl.addAttribution('Contexto municipal: OpenStreetMap / Prefeituras');
scheduleTerritorialLabelLayout();
