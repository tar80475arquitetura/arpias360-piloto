(function(root){
  const turf=typeof module==='object'&&module.exports?require('@turf/turf'):root.ARPIASTurf;
  function validPosition(p){return Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;}
  function validateGeometry(geometry){
    if(!geometry||!['Point','LineString','Polygon','MultiPolygon','MultiLineString'].includes(geometry.type))throw Error('Geometria não suportada');
    let count=0;
    const walk=value=>{if(Array.isArray(value)&&typeof value[0]==='number'){if(!validPosition(value))throw Error('Coordenadas inválidas');count++;}else if(Array.isArray(value)&&value.length)value.forEach(walk);else throw Error('Geometria vazia');};
    walk(geometry.coordinates);if(count>50000)throw Error('Geometria excessivamente grande');
    if(geometry.type==='Point'&&!validPosition(geometry.coordinates))throw Error('Ponto inválido');
    if(geometry.type==='LineString'&&!geometry.coordinates.every(validPosition))throw Error('Linha inválida');
    if(geometry.type==='MultiLineString'&&!geometry.coordinates.every(line=>line.length>=2&&line.every(validPosition)))throw Error('Linha inválida');
    if(geometry.type==='LineString'&&count<2)throw Error('Linha incompleta');
    const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:[];
    polygons.forEach(poly=>poly.forEach(ring=>{if(ring.length<4||!ring.every(validPosition)||ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])throw Error('Anel de polígono inválido');}));
    return geometry;
  }
  function metrics(feature){
    validateGeometry(feature.geometry);
    let center=turf.centroid(feature).geometry.coordinates;
    if(feature.geometry.type==='Polygon')center=turf.centerOfMass(feature).geometry.coordinates;
    if(feature.geometry.type==='MultiPolygon'){
      let total=0,x=0,y=0;feature.geometry.coordinates.forEach(coordinates=>{const part={type:'Feature',geometry:{type:'Polygon',coordinates},properties:{}},area=turf.area(part),p=turf.centerOfMass(part).geometry.coordinates;total+=area;x+=p[0]*area;y+=p[1]*area;});if(total>0)center=[x/total,y/total];
    }
    const result={type:feature.geometry.type,lat:center[1],lon:center[0]};
    if(/Polygon/.test(result.type)){result.area=turf.area(feature);result.perimeter=turf.length(feature,{units:'meters'});}
    else if(/LineString/.test(result.type))result.length=turf.length(feature,{units:'meters'});
    return result;
  }
  function distance(a,b){return turf.distance(turf.point(a),turf.point(b),{units:'meters'});}
  const groups={
    'Identificação':{OBJECTID:'Identificação da feição',tx_insct:'Inscrição técnica do lote',inscricao:'Inscrição imobiliária',inscricao_cartografica:'Inscrição cartográfica',setor:'Setor',quadra:'Quadra',lote:'Lote',numero:'Número',si_nroport:'Número de porta',complemento:'Complemento',unidade:'Unidade'},
    'Características':{utilizacao:'Utilização',padrao_construcao:'Padrão construtivo',tipologia:'Tipologia',idade_aparente:'Idade aparente',alinhamento:'Alinhamento',cobertura:'Cobertura',conservacao:'Conservação',estrutura:'Estrutura',parede:'Parede',revestimento_externo:'Revestimento externo',situacao_construcao:'Situação da construção',situacao_no_lote:'Situação no lote',topografia:'Topografia',implantacao:'Implantação',calcada:'Calçada',limitacao:'Limitação',nivel:'Nível',ocupacao:'Ocupação',situacao_lote:'Situação do lote'},
    'Áreas':{area_total_lote:'Área total do lote',area_construida_total:'Área construída total',area_construida_unidade:'Área construída da unidade'},
    'Localização':{bairro:'Bairro',regiao_administrativa:'Região administrativa',logradouro:'Logradouro',tx_logrado:'Logradouro cadastrado',endereco:'Endereço'},
    'Cadastro público':{nome:'Nome',localidade:'Localidade',tipo:'Tipo',id:'Identificação',orgao:'Órgão',operacional:'Valor cadastral de operação',fonte:'Fonte'},
    'Camada de trabalho':{titulo:'Título',categoria:'Categoria',descricao:'Descrição',data:'Data',status:'Status',prioridade:'Prioridade',source:'Fonte',observacoes:'Observações'}
  };
  const normalize=key=>key.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function publicProperties(properties={}){const keys=new Set(Object.values(groups).flatMap(g=>Object.keys(g).map(normalize)));return Object.fromEntries(Object.entries(properties).filter(([key,value])=>keys.has(normalize(key))&&['string','number','boolean'].includes(typeof value)));}
  function publicAttributes(properties={}){
    const values=new Map(Object.entries(properties).map(([key,value])=>[normalize(key),value]));
    return Object.entries(groups).map(([title,fields])=>({title,rows:Object.entries(fields).flatMap(([key,label])=>{
      const value=values.get(normalize(key));return value!==undefined&&value!==null&&value!==''&&['string','number','boolean'].includes(typeof value)?[[label,String(value)]]:[];
    })})).filter(group=>group.rows.length);
  }
  function csv(collection){
    const quote=value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
    return [['Título','Categoria','Tipo','Latitude de referência','Longitude de referência','Área (m²)','Perímetro (m)','Comprimento (m)'],...collection.features.map(feature=>{const m=metrics(feature);return [feature.properties.titulo,feature.properties.categoria,m.type,m.lat,m.lon,m.area??'',m.perimeter??'',m.length??''];})].map(row=>row.map(quote).join(',')).join('\r\n');
  }
  const api={validPosition,validateGeometry,metrics,distance,publicProperties,publicAttributes,csv};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASGeometry=api;
})(typeof window==='object'?window:globalThis);
