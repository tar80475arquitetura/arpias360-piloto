const NITEROI_BOUNDS=L.latLngBounds([[-23.01,-43.17],[-22.83,-42.94]]);
const map=L.map('map',{zoomControl:true,minZoom:10,maxZoom:23,preferCanvas:true});
map.fitBounds(NITEROI_BOUNDS,{padding:[18,18]});

const URLS={
  ortho2019:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/Imagens/Mosaico_2019_mapservice/MapServer',
  limite:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/Aplicacoes/LIM_POL_MUN_mapservice/MapServer/70',
  bairros:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/PlanoDiretor/FeatureServer/310',
  hidro:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/PlanoDiretor/FeatureServer/35',
  zeis:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/PlanoDiretor/FeatureServer/105',
  zeia:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/PlanoDiretor/FeatureServer/115',
  appm:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/PlanoDiretor/FeatureServer/270',
  apa:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/PlanoDiretor/FeatureServer/275',
  lotes:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/AS_SMF_CLIN_CULT_EDUC_LIMPOL/MapServer/15',
  comunidades:'https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/AS_SMF_CLIN_CULT_EDUC_LIMPOL/MapServer/70'
};

function utcDateOffset(days){const d=new Date();d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
const recentDate=utcDateOffset(-2);

const baseOSM=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,
  attribution:'&copy; OpenStreetMap contributors'
});

const ortho2019=L.esri.tiledMapLayer({
  url:URLS.ortho2019,
  minZoom:0,
  maxZoom:23,
  zIndex:1,
  bounds:L.latLngBounds(
    L.CRS.EPSG3857.unproject(L.point(-4803407.779879997,-2631366.8937283764)),
    L.CRS.EPSG3857.unproject(L.point(-4778732.753760434,-2613536.7069099215))
  ),
  attribution:'Prefeitura Municipal de Niterói / SIGeo · Ortofoto 2019'
});

const recentSatellite=L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${recentDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,{
  minZoom:1,
  maxNativeZoom:9,
  maxZoom:19,
  zIndex:1,
  attribution:`NASA GIBS / VIIRS · ${recentDate}`
});

const baseDefs=[
  {id:'ortho',name:'Foto Aérea 2019',layer:ortho2019,desc:'Ortofoto oficial de Niterói. Imagem histórica de 2019; cobertura restrita ao município, sem representação atual.'},
  {id:'osm',name:'Mapa de ruas',layer:baseOSM,desc:'OpenStreetMap para referência viária e toponímica.'},
  {id:'recent',name:`Satélite recente · ${recentDate}`,layer:recentSatellite,desc:'NASA GIBS / VIIRS. Atualidade temporal complementar, com menor resolução espacial.'}
];

// Leaflet may receive a delayed image error after a base has been removed.
// Ignore callbacks from an earlier attachment rather than touching a detached map.
function protectTileLifecycle(layer){
  const create=layer.createTile;let epoch=0;
  layer.on('remove',()=>{epoch++;});
  layer.createTile=function(coords,done){const current=epoch;return create.call(this,coords,(error,tile)=>{if(current===epoch&&map.hasLayer(layer))done(error,tile);});};
}
baseDefs.forEach(d=>protectTileLifecycle(d.layer));
ortho2019.addTo(map);
let activeBase=ortho2019;
let activeBaseDef=baseDefs[0];


function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>el.classList.remove('show'),2600);
}

function updateStatus(def,msg){
  document.getElementById('mapStatus').setAttribute('data-state',def.state||'Carregando');
  document.getElementById('activeBaseLabel').textContent=def.name;
  document.getElementById('statusMessage').textContent=msg||def.desc;
}

function safeName(p){const name=p.tx_nome||p.NOME||p.Nome||p.COMUNIDADE||p.Classifica||p.Layer||p.tx_obs||`Elemento ${p.OBJECTID||''}`;return typeof ARPIASSearch==='undefined'?name:ARPIASSearch.displayName(name);}
function popupHTML(feature,label,source){return content(safeName(feature.properties||{}),[['Camada',label],['Fonte',source]]);}
const cartographicRenderer=L.svg({padding:.5});
function feature(url,style,label,source,options={}){
  const lyr=L.esri.featureLayer({url,renderer:cartographicRenderer,bubblingMouseEvents:false,simplifyFactor:options.simplifyFactor??.35,precision:5,minZoom:options.minZoom,style,onEachFeature:(f,layer)=>{
    if(url===URLS.bairros)bindTerritorialName({feature:f,layer},'neighborhood-label');
  }});
  return lyr;
}

const limite=feature(URLS.limite,()=>ARPIASCartography.style('limite'),'Limite municipal','Prefeitura Municipal de Niterói');
const bairros=feature(URLS.bairros,()=>ARPIASCartography.style('bairros'),'Bairro','Prefeitura Municipal de Niterói · Plano Diretor');
const hidro=feature(URLS.hidro,()=>ARPIASCartography.style('hidro'),'Hidrografia','Prefeitura Municipal de Niterói · Plano Diretor');
const zeis=feature(URLS.zeis,()=>ARPIASCartography.style('zeis'),'Zona Especial de Interesse Social','Prefeitura Municipal de Niterói · Plano Diretor');
const zeia=feature(URLS.zeia,()=>ARPIASCartography.style('zeia'),'Zona de Especial Interesse Ambiental','Prefeitura Municipal de Niterói · Plano Diretor');
const appm=feature(URLS.appm,()=>ARPIASCartography.style('appm'),'Área de Proteção Permanente Municipal','Prefeitura Municipal de Niterói · Plano Diretor');
const apa=feature(URLS.apa,()=>ARPIASCartography.style('apa'),'Área de Proteção Ambiental Municipal','Prefeitura Municipal de Niterói · Plano Diretor');
const comunidades=feature(URLS.comunidades,()=>ARPIASCartography.style('comunidades'),'Comunidades · base pública municipal','Prefeitura Municipal de Niterói · Dados Abertos');
const lotes=feature(URLS.lotes,()=>ARPIASCartography.style('lotes'),'Lote · base pública municipal','Prefeitura Municipal de Niterói · Dados Abertos',{minZoom:16,simplifyFactor:.2});

limite.addTo(map);
bairros.addTo(map);

function bindTerritorialName(event,className){
  const name=event.feature?.properties?.tx_nome||event.layer?.feature?.properties?.tx_nome;
  if(typeof name!=='string'||!name.trim())return;
  const layer=event.layer;
  if(!layer?.bindTooltip)return;
  const label=typeof ARPIASSearch==='undefined'?name:ARPIASSearch.displayName(name);
  layer.bindTooltip(element('span',label),{permanent:true,direction:'center',className:`territory-label ${className}`,interactive:false});
}
bairros.on('createfeature',e=>bindTerritorialName(e,'neighborhood-label'));
limite.on('load',()=>{
  let largest=null,largestArea=0;
  limite.eachFeature(layer=>{
    if(!layer.getBounds)return;
    const bounds=layer.getBounds(),area=(bounds.getNorth()-bounds.getSouth())*(bounds.getEast()-bounds.getWest());
    if(area>largestArea){largestArea=area;largest=layer;}
  });
  if(largest)bindTerritorialName({layer:largest},'municipality-label');
});
function updateTerritorialLabels(){document.getElementById('map').classList.toggle('show-neighborhood-labels',map.getZoom()>=13);}
map.on('zoomend',updateTerritorialLabels);updateTerritorialLabels();

// Keep larger territorial captions readable without overlapping one another.
let labelLayoutFrame;
function scheduleTerritorialLabelLayout(){
  cancelAnimationFrame(labelLayoutFrame);
  labelLayoutFrame=requestAnimationFrame(()=>{
    const frame=document.getElementById('map').getBoundingClientRect();
    const labels=[...document.querySelectorAll('#map .territory-label')];
    labels.forEach(label=>{label.style.visibility='';});
    const candidates=labels.map(label=>({label,rect:label.getBoundingClientRect()})).filter(item=>item.rect.width&&item.rect.height);
    const priority=label=>label.classList.contains('municipality-label')?(label.classList.contains('context-label')?1:2):0;
    candidates.sort((a,b)=>priority(b.label)-priority(a.label));
    const placed=[...document.querySelectorAll('.floating-search,.map-status,.coords,.edge-tools,.leaflet-control-zoom,.leaflet-control-attribution,.leaflet-control-scale,.leaflet-popup,.query-sheet:not([hidden])')]
      .filter(node=>getComputedStyle(node).visibility!=='hidden')
      .map(node=>node.getBoundingClientRect()).filter(rect=>rect.width&&rect.height);
    const names=new Set();
    candidates.forEach(({label,rect})=>{
      const name=label.textContent.trim();
      const outside=rect.left<frame.left+4||rect.right>frame.right-4||rect.top<frame.top+4||rect.bottom>frame.bottom-4;
      const overlaps=placed.some(other=>rect.left<other.right+5&&rect.right>other.left-5&&rect.top<other.bottom+5&&rect.bottom>other.top-5);
      if(outside||overlaps||names.has(name)){label.style.visibility='hidden';return;}
      names.add(name);placed.push(rect);
    });
  });
}
map.on('moveend zoomend resize tooltipopen popupopen popupclose',scheduleTerritorialLabelLayout);
bairros.on('load',scheduleTerritorialLabelLayout);
limite.on('load',scheduleTerritorialLabelLayout);

const overlayDefs=[
  {id:'limite',name:'Limite municipal',layer:limite,group:'Território',desc:'Contorno oficial do município.'},
  {id:'bairros',name:'Bairros oficiais',layer:bairros,group:'Território',desc:'Divisões territoriais do Plano Diretor.'},
  {id:'lotes',name:'Lotes',layer:lotes,group:'Território',desc:'Exibidos a partir do zoom 16.'},
  {id:'hidro',name:'Hidrografia',layer:hidro,group:'Território',desc:'Rede hidrográfica oficial.'},
  {id:'zeis',name:'ZEIS',layer:zeis,group:'Áreas sensíveis',desc:'Zona Especial de Interesse Social.'},
  {id:'comunidades',name:'Comunidades',layer:comunidades,group:'Áreas sensíveis',desc:'Base pública municipal. Não equivale a classificação automática de risco.'},
  {id:'zeia',name:'Interesse ambiental',layer:zeia,group:'Ambiente',desc:'Zona de Especial Interesse Ambiental.'},
  {id:'appm',name:'Proteção permanente municipal',layer:appm,group:'Ambiente',desc:'Área de Proteção Permanente Municipal.'},
  {id:'apa',name:'Proteção ambiental municipal',layer:apa,group:'Ambiente',desc:'Área de Proteção Ambiental Municipal.'}
];

const graphicScale=L.control.scale({metric:true,imperial:false,position:'bottomright'}).addTo(map);
graphicScale.getContainer().title='Escala gráfica: distância no terreno correspondente à barra. Varia com o zoom; não indica altitude.';
graphicScale.getContainer().setAttribute('aria-label','Escala gráfica: distância no terreno correspondente à barra; varia com o zoom.');

// All values from datasets and remote services enter the DOM as text.
function element(tag, text, className){
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=String(text);
  if(className)node.className=className;
  return node;
}
function content(title,rows,note){
  const root=element('div');
  root.append(element('div',title,'popup-title'));
  const list=element('dl',undefined,'popup-fields');
  rows.forEach(([label,value])=>{
    if(value===null||value===undefined||value==='')return;
    list.append(element('dt',label),element('dd',value));
  });
  root.append(list);
  if(note)root.append(element('p',note,'popup-note'));
  return root;
}
function validCoordinates(lat,lng){return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;}
function appendOpacity(box,d,isBase=false){
  const label=element('label',undefined,'opacity-control');label.append(element('span','Opacidade da camada'));
  const range=element('input');range.type='range';range.min='0';range.max='100';range.value=String(Math.round((d.opacity??1)*100));range.setAttribute('aria-label',`Opacidade: ${d.name}`);
  const output=element('output',`${range.value}%`);label.append(range,output);box.append(label);
  if(!isBase&&!d.originalStyle)d.originalStyle=d.layer.options.style;
  range.addEventListener('input',()=>{
    d.opacity=Number(range.value)/100;output.textContent=`${range.value}%`;
    if(isBase)d.layer.setOpacity(d.opacity);
    else if(d.id==='relevo')d.layer.setStyle(reliefStyle);
    else d.layer.setStyle(f=>{const style=typeof d.originalStyle==='function'?d.originalStyle(f):d.originalStyle||{};return {...style,opacity:d.opacity,fillOpacity:(style.fillOpacity??.2)*d.opacity};});
  });
}
function showOverlayInfo(d){
  let count=0,geometry=null;d.layer.eachFeature(layer=>{count++;geometry??=layer.feature?.geometry?.type;});
  const box=content(d.name,[['Fonte','Prefeitura Municipal de Niterói / GeoNit'],['Geometria',geometry||'Ainda não carregada'],['Quantidade carregada',count],['Status',d.status.textContent],['Atualização','Não informada no catálogo'],['Referência',d.layer.options.url]],`${d.desc} Quantidade refere-se às feições carregadas, não ao total do serviço.`);
  appendOpacity(box,d);box.firstChild.id='infoTitle';document.getElementById('infoBody').replaceChildren(box);document.getElementById('layerInfo').showModal();
}
async function copyCoordinates(latlng){
  try{
    if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
    toast('Coordenadas copiadas.');
  }catch(error){toast('Não foi possível copiar automaticamente.');}
}
function coordinateActions(root,latlng){
  const pair=`${latlng.lat.toFixed(6)},${latlng.lng.toFixed(6)}`;
  const actions=element('div',undefined,'popup-actions');
  const links=[
    ['Abrir visualização de rua',`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${pair}`],
    ['Google Maps',`https://www.google.com/maps/search/?api=1&query=${pair}`],
    ['Abrir no Google Earth',`https://earth.google.com/web/search/${pair}/`]
  ];
  links.forEach(([label,url])=>{
    const a=element('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';
    if(label==='Abrir visualização de rua')a.title='Abre o Google Street View; a cobertura no ponto depende do serviço.';
    actions.append(a);
  });
  const copy=element('button','Copiar coordenadas');copy.type='button';copy.addEventListener('click',()=>copyCoordinates(latlng));actions.append(copy);
  const share=element('button','Compartilhar ponto','share-point');share.type='button';
  share.addEventListener('click',()=>sharePoint(root,latlng));actions.append(share);
  root.append(actions,element('p','Visualização de rua disponível próxima ao ponto selecionado.','popup-note'));
  const future=element('details',undefined,'future-module');
  future.append(element('summary','Identificação territorial'),content('Integração futura',[
    ['Inscrição municipal','Dado ainda não integrado'],['Identificador ARPIAS','Integração futura']
  ]));
  root.append(future);
  return root;
}
async function sharePoint(root,latlng){
  const url=ARPIASLocation.build(location.href,latlng.lat,latlng.lng,map.getZoom());
  let input=root.querySelector('.share-link');
  if(!input){input=element('input',undefined,'share-link');input.readOnly=true;input.setAttribute('aria-label','Link deste ponto para compartilhar');root.append(input);}
  input.value=url;
  try{
    if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url);toast('Link do ponto copiado. Cole onde quiser compartilhar.');
  }catch(error){input.focus({preventScroll:true});input.select();toast('Não foi possível copiar automaticamente. Copie o link exibido.');}
}
function popupOptions(){
  return {maxWidth:300,offset:[0,-18],autoPan:!matchMedia('(max-width:599px)').matches,autoPanPaddingTopLeft:[12,80],autoPanPaddingBottomRight:[12,80]};
}
async function readJSON(url){
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

const baseControl=document.getElementById('baseControl');
const baseMeta=document.getElementById('baseMeta');
let previousBaseDef=baseDefs[1];
let baseGeneration=0;
let baseTimer;
function baseState(def,state){def.state=state;if(def.statusNode){def.statusNode.textContent=state==='Disponível'?'● DISPONÍVEL NO MAPA':state==='Indisponível'?'× Temporariamente indisponível':state;def.statusNode.setAttribute('data-state',state);}}
function selectBase(def){
  clearTimeout(baseTimer);baseGeneration++;
  if(activeBaseDef!==def)previousBaseDef=activeBaseDef;
  activeBaseDef=def;activeBase=def.layer;
  document.getElementById('baseFallback').hidden=true;
  map.setMaxZoom(def.id==='ortho'?23:19);
  // Keep the previous base underneath while NASA tiles are being checked.
  baseDefs.forEach(d=>{if(d!==def&&!(def.id==='recent'&&d===previousBaseDef)&&map.hasLayer(d.layer))map.removeLayer(d.layer);});
  if(!map.hasLayer(def.layer))def.layer.addTo(map);
  document.getElementById(`base_${def.id}`).checked=true;
  baseMeta.textContent=def.desc;baseMeta.classList.add('visible');
  updateStatus(def,'Carregando base cartográfica…');baseState(def,'Carregando');
  if(def.loaded&&!def.layer.isLoading()){
    if(def.id==='recent')baseDefs.forEach(other=>{if(other!==def&&map.hasLayer(other.layer))map.removeLayer(other.layer);});
    baseState(def,'Disponível');updateStatus(def,def.desc);return;
  }
  const generation=baseGeneration;
  baseTimer=setTimeout(()=>{if(generation===baseGeneration&&!def.loaded)baseFailure(def);},15000);
}
function baseFailure(def){
  def.loaded=false;
  baseState(def,'Indisponível');
  if(activeBaseDef!==def)return;
  if(def.id==='ortho'){
    clearTimeout(baseTimer);
    updateStatus(def,'Foto Aérea 2019 indisponível no momento. Use o mapa de ruas ou selecione a foto aérea novamente.');
    document.getElementById('activeBaseLabel').textContent='Foto Aérea 2019 · indisponível';
    document.getElementById('baseFallback').hidden=false;
    toast('Foto Aérea 2019 indisponível no momento.');return;
  }
  const fallback=baseDefs[1];
  if(fallback===def){updateStatus(def,'Mapa de ruas temporariamente indisponível.');return;}
  selectBase(fallback);
  updateStatus(fallback,`${def.name} indisponível. Exibindo ${fallback.name}.`);
  toast(`${def.name} temporariamente indisponível.`);
}
function settleBase(def){if(activeBaseDef===def&&!def.loaded)baseFailure(def);}
baseDefs.forEach(d=>{
  const label=element('label',undefined,'control-item');
  const radio=element('input');radio.type='radio';radio.name='base';radio.id=`base_${d.id}`;radio.checked=d===activeBaseDef;
  radio.setAttribute('aria-label',d.name);
  const text=element('span',undefined,'base-detail');
  const heading=element('span',undefined,'base-name-row');
  const shortNames={ortho:'Foto aérea · 2019',osm:'Ruas',recent:'Satélite'};
  d.statusNode=element('span','DISPONÍVEL NO MAPA','status');
  heading.append(element('span',shortNames[d.id],'name'),d.statusNode);text.append(heading);
  text.append(element('small',d.id==='ortho'?'Imagem histórica oficial':d.id==='osm'?'OpenStreetMap':`NASA VIIRS · ${recentDate}`));
  label.append(radio,text);baseControl.append(label);
  const info=element('button','ⓘ','info-button');info.type='button';info.setAttribute('aria-label',`Informações: ${d.name}`);
  info.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const box=content(d.name,[['Fonte',d.id==='ortho'?'Prefeitura Municipal de Niterói / SIGeo':d.id==='osm'?'OpenStreetMap':'NASA GIBS / VIIRS'],['Geometria','Raster'],['Status',d.statusNode.textContent],['Atualização',d.id==='ortho'?'2019':d.id==='recent'?recentDate:'Não informada']],d.desc);appendOpacity(box,d,true);box.firstChild.id='infoTitle';document.getElementById('infoBody').replaceChildren(box);document.getElementById('layerInfo').showModal();});label.append(info);
  radio.addEventListener('change',()=>{if(radio.checked)selectBase(d);});
  radio.addEventListener('click',()=>{if(radio.checked&&d.state==='Indisponível')selectBase(d);});
  d.layer.on('loading',()=>{d.loaded=false;d.failedTiles=0;if(activeBaseDef===d)baseState(d,'Carregando');});
  d.layer.on('tileload',()=>{
    if(activeBaseDef!==d)return;
    d.loaded=true;
    document.getElementById('baseFallback').hidden=true;
    if(d.id==='recent')baseDefs.forEach(other=>{if(other!==d&&map.hasLayer(other.layer))map.removeLayer(other.layer);});
    clearTimeout(baseTimer);baseState(d,'Disponível');updateStatus(d,d.desc);
  });
  // The official mosaic returns 404 for uncached/no-data tiles outside its footprint.
  // A single missing tile must not discard other successfully rendered aerial tiles.
  d.layer.on('tileerror',()=>{d.failedTiles=(d.failedTiles||0)+1;});
  d.layer.on('load',()=>settleBase(d));
});
document.getElementById('baseFallback').addEventListener('click',()=>selectBase(baseDefs[1]));
selectBase(baseDefs[0]);

// Local SVG paths: no external icon requests or dataset HTML interpolation.
const symbols={
  sirenes:'M7 16V10a5 5 0 0 1 10 0v6M5 17h14v3H5zM12 1v2M2 7l2 1M22 7l-2 1',
  pluviometros:'M5 13a4 4 0 1 1 1-8 6 6 0 0 1 11 2 3 3 0 1 1 1 6H5M7 16l-1 4M12 16l-1 4M17 16l-1 4',
  nudecs:'M9 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0M5 20v-3a7 7 0 0 1 14 0v3M2 9a2 2 0 1 0 4 0M18 9a2 2 0 1 0 4 0',
  pontos_apoio:'M3 11l9-8 9 8M5 10v11h14V10M10 21v-7h4v7',
  limite:'M4 4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M4 9V4',
  bairros:'M3 4h8v8H3zM13 4h8v5h-8zM3 14h8v6H3zM13 11h8v9h-8z',
  lotes:'M3 3h18v18H3zM3 11h18M11 3v18M17 11v10',
  hidro:'M6 2c10 5-5 7 4 11s-2 8 4 9',
  zeis:'M3 11l6-6 6 6M5 10v10h8V10M14 4h7v16h-6M17 8h1M17 12h1',
  comunidades:'M3 12l5-5 5 5M5 11v9h6v-9M12 8l4-4 5 5M15 8v12h4V8',
  zeia:'M5 20C2 7 10 3 20 3c0 12-5 18-15 17M5 20l10-11',
  appm:'M5 20V10l7-7 7 7v10H5M12 7v10M8 12l4 3 4-3',
  apa:'M3 20l6-14 5 10 3-7 4 11H3M8 20v-4'
};
function symbol(id){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',symbols[id]);svg.append(path);return svg;
}
function layerControl(d,state,onChange,info){
  const row=element('div',undefined,'layer-control');d.row=row;
  const label=element('label',undefined,'layer-label');
  const icon=element('span',undefined,`layer-icon ${d.symbolId||d.id}`);icon.append(symbol(d.symbolId||d.id));
  const text=element('span',undefined,'layer-name');text.append(element('span',d.name,'name'));
  d.status=element('small',state,'layer-status');text.append(d.status);
  const control=element('span',undefined,'switch');
  d.input=element('input');d.input.type='checkbox';d.input.id=`layer_${d.id}`;
  d.input.setAttribute('role','switch');d.input.setAttribute('aria-label',d.name);
  d.input.checked=!!d.layer&&map.hasLayer(d.layer);
  const track=element('span',undefined,'switch-track');track.setAttribute('aria-hidden','true');
  const word=element('span',undefined,'switch-word');word.setAttribute('aria-hidden','true');
  control.append(d.input,track,word);label.append(icon,text,control);row.append(label);
  if(info){const button=element('button','ⓘ','info-button');button.type='button';button.setAttribute('aria-label',`Informações: ${d.name}`);button.addEventListener('click',info);row.append(button);}
  d.input.addEventListener('change',onChange);
  return row;
}
overlayDefs.forEach(d=>{
  const target=d.group==='Ambiente'?'environmentControl':d.group==='Áreas sensíveis'?'sensitiveControl':'territoryControl';
  const row=layerControl(d,'DISPONÍVEL NO MAPA',()=>{
    if(d.input.checked){d.status.textContent='Carregando';d.layer.addTo(map);toast(`${d.name} ativada.`);}
    else{map.removeLayer(d.layer);toast(`${d.name} ocultada.`);}
  },()=>showOverlayInfo(d));
  document.getElementById(target).append(row);
  d.layer.on('loading',()=>{d.status.textContent='Carregando';row.setAttribute('aria-busy','true');});
  d.layer.on('load',()=>{d.status.textContent='Disponível';row.setAttribute('aria-busy','false');});
  d.layer.on('requesterror',()=>{
    d.status.textContent='Indisponível';d.input.checked=false;row.setAttribute('aria-busy','false');map.removeLayer(d.layer);toast('Não foi possível carregar esta camada.');
  });
});
const civilDefs=[
  {id:'sirenes',name:'Sirenes de alerta',title:'Sirene de alerta',file:'sirenes.geojson',count:37},
  {id:'pluviometros',name:'Pluviômetros municipais',title:'Pluviômetro municipal',file:'pluviometros.geojson',count:38},
  {id:'nudecs',name:'NUDECs',title:'Núcleo Comunitário de Defesa Civil',file:'nudecs.geojson',count:36},
  {id:'pontos_apoio',name:'Pontos de apoio',title:'Ponto de apoio',file:'pontos-apoio.geojson',count:27}
];
const civilMessage=document.getElementById('civilMessage');
const metadataPromise=readJSON('data/fontes-recuperadas.json').then(m=>{
  if(!Array.isArray(m.datasets))throw new Error('Manifesto inválido');return m;
}).catch(error=>{console.error('Metadados da Defesa Civil:',error);return null;});
function civilPopup(d,f,latlng){
  const p=f.properties;
  const rows=[['Nome',p.nome]];
  if(d.id==='sirenes')rows.push(['Tipo',p.tipo==='sirene'?'Sirene de alerta':p.tipo]);
  if(d.id==='nudecs')rows.push(['Localidade',p.localidade],['Bairro',p.bairro],['Endereço',p.endereco],['Valor cadastral de operação',p.operacional]);
  if(d.id==='pontos_apoio')rows.push(['Endereço',p.endereco]);
  rows.push(['Identificação',p.id]);
  if(d.id==='pluviometros')rows.push(['Órgão',p.orgao]);
  rows.push(['Fonte',p.fonte],['Coordenadas',`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`]);
  const note=d.id==='pluviometros'?'Cadastro de localização; sem leitura pluviométrica atual.':d.id==='nudecs'?'Estado cadastral; sem confirmação de operação atual.':d.id==='pontos_apoio'?'Cadastro de localização; sem confirmação de abertura ou disponibilidade atual.':undefined;
  return coordinateActions(content(d.title,rows,note),latlng);
}
async function showCivilInfo(d){
  const dialog=document.getElementById('layerInfo');const body=document.getElementById('infoBody');
  const m=await metadataPromise;const meta=m?.datasets.find(x=>x.id===d.id);
  const box=content(d.name,meta?[['Fonte',meta.source],['Registros',meta.count],['Geometria',meta.geometry],['Status',d.status.textContent],['Atualização','Não informada no catálogo'],['Sistema de coordenadas',meta.crs],['Sistema original',meta.original_crs],['Observações',meta.notes]]:[],meta?'Cadastro de localização; não confirma operação atual. Conferência ponto a ponto contra o limite administrativo oficial pendente.':'Metadados temporariamente indisponíveis.');
  box.firstChild.id='infoTitle';body.replaceChildren(box);if(!dialog.open)dialog.showModal();
}
function validateCollection(g,d){
  if(g?.type!=='FeatureCollection'||!Array.isArray(g.features)||g.features.length!==d.count)throw new Error('Coleção ou contagem inesperada');
  g.features.forEach(f=>{
    const c=f.geometry?.coordinates;
    if(f.type!=='Feature'||f.geometry?.type!=='Point'||!Array.isArray(c)||c.length!==2||!validCoordinates(c[1],c[0])||!f.properties||typeof f.properties!=='object'||Array.isArray(f.properties))throw new Error('Feature inválida');
  });
}
async function loadCivil(d){
  if(d.layer)return d.layer;
  if(d.loading)return d.loading;
  d.status.textContent='Carregando';civilMessage.textContent=`Carregando ${d.name.toLowerCase()}…`;
  d.row?.setAttribute('aria-busy','true');
  d.loading=(async()=>{
    try{
      const g=await readJSON(`data/processed/defesa-civil/${d.file}`);validateCollection(g,d);
      d.layer=L.geoJSON(g,{
        pointToLayer:(f,ll)=>{
          const icon=element('div',undefined,`civil-marker ${d.id}`);icon.append(symbol(d.id));
          return L.marker(ll,{icon:L.divIcon({html:icon,className:'civil-div-icon',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-16]}),bubblingMouseEvents:false,title:f.properties.nome});
        },
        onEachFeature:(f,layer)=>layer.on('click',e=>{
          if(typeof ARPIASUI!=='undefined'&&ARPIASUI.mode()==='consult')ARPIASUI.query(e.latlng,{layerId:d.id,feature:f});
        })
      });
      d.status.textContent='Disponível';civilMessage.textContent=`${d.name}: ${g.features.length} pontos carregados.`;
      if(d.input.checked){d.layer.addTo(map);toast(`${d.name}: camada ativada · ${g.features.length} pontos`);}
      return d.layer;
    }catch(error){
      console.error(`Defesa Civil / ${d.id}:`,error);d.status.textContent='Indisponível';d.input.checked=false;
      civilMessage.textContent='Não foi possível carregar esta camada.';toast('Não foi possível carregar esta camada.');return null;
    }finally{d.loading=null;d.row?.setAttribute('aria-busy','false');}
  })();
  return d.loading;
}
civilDefs.forEach(d=>{
  const row=layerControl(d,'DISPONÍVEL NO MAPA',()=>{
    if(d.input.checked){if(d.layer){d.layer.addTo(map);toast(`${d.name}: camada ativada · ${d.count} pontos`);}else loadCivil(d);}
    else{if(d.layer)map.removeLayer(d.layer);toast(`${d.name}: camada ocultada`);}
  },()=>showCivilInfo(d));
  document.getElementById('civilControl').append(row);
});
document.getElementById('closeInfo').addEventListener('click',()=>document.getElementById('layerInfo').close());
const reliefDefs=[{id:'relevo',name:'Padrões de Relevo',source:ARPIASGeomorphology.source,field:'PADRAO',ready:false}];
symbols.relevo='M2 20L8 7l5 9 4-12 5 16H2';
const relief=reliefDefs[0];
const reliefRow=layerControl(relief,'DISPONÍVEL NO MAPA',async()=>{
  if(!relief.input.checked){if(relief.layer)map.removeLayer(relief.layer);return;}
  const layer=await loadRelief();if(layer&&relief.input.checked)layer.addTo(map);
},showReliefInfo);
const reliefMessage=element('p',undefined,'popup-note');reliefMessage.hidden=true;reliefMessage.setAttribute('role','alert');reliefRow.append(reliefMessage);
function reliefStyle(f){return ARPIASGeomorphology.style(relief.data,relief.field,f,relief.opacity??1);}
function showReliefInfo(){
  infoModal('Padrões de Relevo — CPRM/SGB',[['Fonte',relief.source],['Autores','Marcelo E. Dantas; Lais Costa'],['Publicação','Fevereiro de 2017 · escala 1:30.000'],['Polígonos','399'],['CRS original','SIRGAS 2000 · EPSG:4674'],['Derivado','EPSG:4326 · sem simplificação'],['Campos',Object.keys(relief.data?.features[0].properties||ARPIASGeomorphology.fields).join(', ')],['Arquivo','niteroi_padraoderelevo.zip'],['Referência',ARPIASGeomorphology.url]],ARPIASGeomorphology.warning);
  if(relief.layer)appendOpacity(document.getElementById('infoBody'),relief);
}
const classification=element('select');classification.id='reliefClassification';classification.setAttribute('aria-label','Classificação do relevo');
Object.entries(ARPIASGeomorphology.fields).forEach(([value,label])=>{const option=element('option',label);option.value=value;classification.append(option);});
classification.disabled=true;reliefRow.append(classification);document.getElementById('territoryControl').append(reliefRow);
classification.addEventListener('change',()=>{relief.field=classification.value;relief.layer.setStyle(reliefStyle);});
const fetchRelief=ARPIASGeomorphology.createLoader(()=>readJSON('data/processed/cprm/padroes-relevo.geojson'));
async function loadRelief(){
  if(relief.layer)return relief.layer;
  if(relief.loading)return relief.loading;
  relief.status.textContent='Carregando…';reliefRow.setAttribute('aria-busy','true');reliefMessage.hidden=true;
  relief.loading=fetchRelief().then(data=>{
  data.features.forEach(f=>ARPIASGeometry.validateGeometry(f.geometry));relief.data=data;
  relief.layer=L.geoJSON(data,{renderer:cartographicRenderer,bubblingMouseEvents:false,style:reliefStyle,onEachFeature:(f,layer)=>{
    layer.on('click',e=>{L.DomEvent.stopPropagation(e.originalEvent);if(typeof ARPIASUI!=='undefined')ARPIASUI.query(e.latlng,{layerId:'relevo',feature:f});});
    layer.on('mouseover',()=>layer.setStyle({weight:3}));layer.on('mouseout',()=>layer.setStyle(reliefStyle(f)));
  }});relief.ready=true;classification.disabled=false;relief.status.textContent='DISPONÍVEL NO MAPA';if(typeof ARPIASUI!=='undefined')ARPIASUI.refreshQueryable();return relief.layer;
}).catch(error=>{relief.status.textContent='EM INTEGRAÇÃO';relief.input.checked=false;reliefMessage.textContent='Não foi possível carregar a camada de relevo.';reliefMessage.hidden=false;toast(reliefMessage.textContent);console.error('Relevo:',error);return null;}).finally(()=>{relief.loading=null;reliefRow.setAttribute('aria-busy','false');});
  return relief.loading;
}
const catalogHost=document.getElementById('catalogGroups');
const catalogSearch=document.getElementById('layerSearch');
const catalogSearchStatus=document.getElementById('catalogSearchStatus');
const catalogEntries=[];
const catalogSections=[];
function catalogBadge(item){
  return ARPIASCatalog.publicStatus(item);
}
function operationalStatus(text){
  return ARPIASCatalog.operationalStatus(text);
}
function filterCatalog(){
  const query=catalogSearch.value;
  let found=0;
  catalogEntries.forEach(({item,group,row})=>{
    row.hidden=!ARPIASCatalog.matches(item,group,query);
    if(!row.hidden)found++;
  });
  catalogSections.forEach(({section,rows})=>{
    section.hidden=rows.every(row=>row.hidden);
    if(query.trim()&&!section.hidden)section.open=true;
    else if(!query.trim()&&section.dataset.wasOpen!==undefined)section.open=section.dataset.wasOpen==='true';
  });
  catalogSearchStatus.textContent=query.trim()?`${found} itens encontrados`:`${catalogSections.length} categorias · ${found} itens no catálogo`;
}
catalogSearch.addEventListener('input',()=>{
  if(catalogSearch.value.trim()&&!catalogSearch.dataset.searching){
    catalogSections.forEach(({section})=>{section.dataset.wasOpen=String(section.open);});catalogSearch.dataset.searching='true';
  }
  filterCatalog();
  if(!catalogSearch.value.trim()){delete catalogSearch.dataset.searching;catalogSections.forEach(({section})=>{delete section.dataset.wasOpen;});}
});
readJSON('data/catalogo.json').then(ARPIASCatalog.validate).then(catalog=>{
  catalog.groups.flatMap(group=>group.items).filter(item=>item.control).forEach(item=>{
    if(!document.getElementById(item.control))throw Error(`Controle ausente: ${item.control}`);
  });
  const claimed=new Set();
  const oldSections=[...document.querySelectorAll('.panel-scroll > .accordion:not(#baseAccordion):not(#workAccordion)')];
  const category={base:'territory',risk:'civil',cadastre:'territory',disaster:'civil'};
  catalog.groups.forEach(group=>{
    const isBase=group.id==='base';
    const section=isBase?document.getElementById('baseAccordion'):element('details',undefined,'accordion');
    if(!isBase){
      section.dataset.category=category[group.id]||group.id;section.dataset.group=group.id;section.open=group.id==='risk';
      const summary=element('summary',group.title);summary.append(element('small',`${group.items.length} itens`));section.append(summary);catalogHost.append(section);
    }
    const body=isBase?section.querySelector('.accordion-body'):element('div',undefined,'accordion-body control-list');
    if(!isBase)section.append(body);
    const rows=[];
    group.items.forEach(item=>{
      let row;
      const input=item.control?document.getElementById(item.control):null;
      if(item.state==='integrated'&&!input)throw Error(`Controle ausente: ${item.control}`);
      if(input&&!claimed.has(item.control)){
        claimed.add(item.control);row=input.closest('.layer-control,.control-item');
        row.querySelector('.name').textContent=item.name;input.setAttribute('aria-label',item.name);
        if(!isBase)body.append(row);
        const status=row.querySelector('.layer-status');
        // Presentation follows actual load/error events, without changing layer state.
        if(status){
          const badge=element('small',undefined,'catalog-operational');status.after(badge);status.hidden=true;
          const sync=()=>{badge.textContent=operationalStatus(status.textContent)+(item.count?` · ${item.count} pontos`:'');};
          new MutationObserver(sync).observe(status,{childList:true,characterData:true,subtree:true});sync();
        }
      }else{
        if(input&&input.type!=='radio'){
          const originalRow=input.closest('.layer-control');
          const original=originalRow.querySelector('.layer-status');
          const proxy={id:`alias_${group.id}_${item.control}`,symbolId:item.control.replace('layer_',''),name:item.name};
          const sync=()=>{proxy.input.checked=input.checked;proxy.status.textContent=operationalStatus(original.textContent)+(item.count?` · ${item.count} pontos`:'');proxy.row.setAttribute('aria-busy',originalRow.getAttribute('aria-busy')||'false');};
          row=layerControl(proxy,'◐ Em integração',()=>{if(proxy.input.checked!==input.checked)input.click();sync();},()=>originalRow.querySelector('.info-button')?.click());
          new MutationObserver(sync).observe(original,{childList:true,characterData:true,subtree:true});
          new MutationObserver(sync).observe(originalRow,{attributes:true,attributeFilter:['aria-busy']});
          input.addEventListener('change',sync);['clearBtn','clearLayersBtn'].forEach(id=>document.getElementById(id).addEventListener('click',()=>requestAnimationFrame(sync)));sync();body.append(row);
          rows.push(row);catalogEntries.push({item,group,row});return;
        }
        row=element('div',undefined,'planned-entry catalog-entry');row.append(element('strong',item.name));
        const badge=element('small',catalogBadge(item),'catalog-badge');row.append(badge);
        if(input){
          const original=input.closest('.layer-control,.control-item').querySelector('.layer-status,.status');
          const button=element('button',undefined,'catalog-select');button.type='button';
          const sync=()=>{
            badge.textContent=operationalStatus(original.textContent)+(item.count?` · ${item.count} pontos`:'');
            button.textContent=input.type==='radio'?(input.checked?'Base selecionada':'Selecionar base'):(input.checked?'Ocultar camada':'Ativar camada');
            button.setAttribute('aria-pressed',String(input.checked));
          };
          new MutationObserver(sync).observe(original,{childList:true,characterData:true,subtree:true});sync();
          input.addEventListener('change',sync);
          if(input.type==='radio')document.querySelectorAll('input[name="base"]').forEach(radio=>radio.addEventListener('change',sync));
          document.getElementById('clearLayersBtn').addEventListener('click',()=>requestAnimationFrame(sync));
          document.getElementById('clearBtn').addEventListener('click',()=>requestAnimationFrame(sync));
          button.addEventListener('click',()=>{if(input.type==='radio'){if(!input.checked)input.click();}else input.click();sync();toast(`${item.name}: ${input.checked?'selecionada':'ocultada'}.`);});row.append(button);
        }
        row.append(element('small',`Fonte: ${item.source}`),element('small',item.note));
        const info=element('button','ⓘ Informações','catalog-select');info.type='button';if(item.analysis==='fragility')info.textContent='Como esta pontuação é calculada?';
        info.addEventListener('click',()=>{
          if(item.analysis==='fragility'){showFragilityMethodology();return;}
          const box=content(item.name,[['Status',badge.textContent],['Fonte',item.source],['Referência',item.url]],item.note);box.firstChild.id='infoTitle';
          document.getElementById('infoBody').replaceChildren(box);document.getElementById('layerInfo').showModal();
        });row.append(info);body.append(row);
      }
      rows.push(row);catalogEntries.push({item,group,row});
    });
    catalogSections.push({section,rows});
    if(group.id==='risk')body.append(civilMessage);
    // Preserve existing experimental controls as explicit extra entries.
    if(group.id==='cadastre'||group.id==='planning'){
      const id=group.id==='cadastre'?'lotes':'comunidades';
      const row=document.getElementById(`layer_${id}`).closest('.layer-control');body.append(row);
      const item={name:group.id==='cadastre'?'Lotes · controle experimental':'Comunidades · base pública municipal',keywords:[]};
      row.querySelector('.name').textContent=item.name;rows.push(row);catalogEntries.push({item,group,row});
      const status=row.querySelector('.layer-status'),badge=element('small',undefined,'catalog-operational');
      status.after(badge);status.hidden=true;
      const sync=()=>{badge.textContent=operationalStatus(status.textContent);};
      new MutationObserver(sync).observe(status,{childList:true,characterData:true,subtree:true});sync();
      section.querySelector('summary small').textContent=`${rows.length} itens`;
    }
  });
  oldSections.forEach(section=>section.remove());filterCatalog();
  // These four unchanged implementations and collections were visually validated.
  // Preserve lazy loading; current request failures still override their status.
  civilDefs.forEach(d=>{d.status.textContent='Disponível';});
}).catch(error=>{
  console.error('Catálogo:',error);catalogSearchStatus.textContent='Catálogo temporariamente indisponível.';
  catalogHost.replaceChildren(element('p','Não foi possível carregar o catálogo. Tente novamente.','sidebar-note'));
});

const panel=document.getElementById('panel');
const shell=document.querySelector('.app-shell');
const mapwrap=document.querySelector('.mapwrap');
const aboutPanel=document.getElementById('aboutPanel');
const moreMenu=document.getElementById('moreMenu');
const querySheet=document.getElementById('querySheet');
const queryBody=document.getElementById('queryBody');
const compactMedia=matchMedia('(max-width:899px)');
const mobileMedia=matchMedia('(max-width:599px)');
let panelOpener=null,currentPopup=null,popupNode=null;
function resizeMap(){map.invalidateSize({pan:false});}
function scheduleResize(){requestAnimationFrame(resizeMap);clearTimeout(scheduleResize.timer);scheduleResize.timer=setTimeout(resizeMap,220);}
mapwrap.addEventListener('transitionend',resizeMap);
panel.addEventListener('transitionend',resizeMap);
new ResizeObserver(resizeMap).observe(mapwrap);
function closeMore(focus=false){moreMenu.hidden=true;document.getElementById('moreBtn').setAttribute('aria-expanded','false');if(focus)document.getElementById('moreBtn').focus();}
function configurePanel(){
  const open=!panel.classList.contains('hidden');
  const modal=compactMedia.matches&&open;
  shell.classList.toggle('layers-open',open);panel.inert=!open;
  document.getElementById('panelBackdrop').hidden=!modal;
  document.querySelector('.topbar').inert=modal;mapwrap.inert=modal;
  document.querySelector('.mobile-actions').inert=modal;
  panel.setAttribute('aria-hidden',String(!open));
  if(modal){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');}
  else{panel.removeAttribute('role');panel.removeAttribute('aria-modal');}
  ['layersBtn','togglePanel','mobileLayersBtn'].forEach(id=>{
    const button=document.getElementById(id);button.setAttribute('aria-expanded',String(open));button.classList.toggle('active',open);
  });
  scheduleResize();
}
function closeAbout(){aboutPanel.hidden=true;document.getElementById('aboutBtn').classList.remove('active');}
function openLayers(){
  panelOpener=document.activeElement;closeMore();closeAbout();
  if(mobileMedia.matches)map.closePopup();
  panel.classList.remove('hidden');configurePanel();
  if(compactMedia.matches)document.getElementById('closePanel').focus({preventScroll:true});
}
function closeLayers(restoreFocus=false){
  panel.classList.add('hidden');configurePanel();
  if(restoreFocus&&panelOpener?.isConnected)panelOpener.focus({preventScroll:true});
}
function dismissSheetOnSwipe(handle,close){
  let startY=null;
  handle.addEventListener('pointerdown',e=>{if(!mobileMedia.matches)return;startY=e.clientY;handle.setPointerCapture(e.pointerId);});
  handle.addEventListener('pointerup',e=>{if(startY!==null&&e.clientY-startY>=48)close();startY=null;});
  handle.addEventListener('pointercancel',()=>{startY=null;});
}
dismissSheetOnSwipe(panel.querySelector('.sheet-handle'),()=>closeLayers(true));
dismissSheetOnSwipe(querySheet.querySelector('.sheet-handle'),()=>map.closePopup());
['togglePanel','layersBtn','mobileLayersBtn'].forEach(id=>document.getElementById(id).addEventListener('click',()=>panel.classList.contains('hidden')?openLayers():closeLayers(true)));
['closePanel','panelBackdrop'].forEach(id=>document.getElementById(id).addEventListener('click',()=>closeLayers(true)));
panel.addEventListener('keydown',e=>{
  if(e.key!=='Tab'||!compactMedia.matches)return;
  const nodes=[...panel.querySelectorAll('button,input,a[href],summary')].filter(node=>!node.disabled&&node.getClientRects().length);
  const first=nodes[0],last=nodes.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
document.getElementById('moreBtn').addEventListener('click',()=>{
  const open=moreMenu.hidden;if(open){closeLayers();closeAbout();}moreMenu.hidden=!open;document.getElementById('moreBtn').setAttribute('aria-expanded',String(open));
});
document.getElementById('moreBtn').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();moreMenu.hidden=false;document.getElementById('moreBtn').setAttribute('aria-expanded','true');moreMenu.querySelector('button').focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.more-wrap'))closeMore();});
document.getElementById('aboutBtn').addEventListener('click',()=>{closeMore();closeLayers();aboutPanel.hidden=false;document.getElementById('closeAbout').focus({preventScroll:true});});
document.getElementById('closeAbout').addEventListener('click',()=>{closeAbout();document.getElementById('moreBtn').focus();});
async function showFragilityMethodology(){
  closeMore();
  try{const model=await readJSON('config/fragilidade.json');
    const rows=[['Status','METODOLOGIA EM DESENVOLVIMENTO'],['Cálculo','Não habilitado; nenhuma pontuação produzida'],['Unidade territorial',model.territorialUnit],['Escala','0–100: proposta metodológica não validada'],['Pesos / normalização / fórmula','Ainda não definidos'],['Última revisão da arquitetura',model.reviewedAt]];
    const box=content(model.name,rows,model.warning);box.firstChild.id='infoTitle';
    const labels={available:'Disponível',partial:'Parcialmente disponível',future:'Futuro'};
    model.dimensions.forEach(d=>box.append(content(d.name,[['Disponibilidade',labels[d.availability]],['Direção',d.direction],['Fonte',d.source],['Ano dos dados',d.year||'Não informado']],d.limitation)));
    document.getElementById('infoBody').replaceChildren(box);document.getElementById('layerInfo').showModal();
  }catch(error){toast('Metodologia temporariamente indisponível. Nenhum índice foi calculado.');}
}
document.getElementById('fragilityBtn').addEventListener('click',showFragilityMethodology);
document.getElementById('fullBtnTop').addEventListener('click',async()=>{
  closeMore();try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen();}catch(error){toast('Tela cheia indisponível neste navegador.');}
});
document.addEventListener('fullscreenchange',scheduleResize);
function presentPopup(popup){
  currentPopup=popup;popupNode=popup.getContent();
  if(typeof popupNode==='string')popupNode=content(popupNode,[]);
  if(mobileMedia.matches){
    popup.options.autoPan=false;closeLayers();closeMore();closeAbout();
    queryBody.replaceChildren(popupNode);querySheet.hidden=false;shell.classList.add('has-query');
    requestAnimationFrame(()=>{
      if(currentPopup!==popup||querySheet.hidden)return;
      document.getElementById('queryHeading').focus({preventScroll:true});
      const visibleHeight=mapwrap.clientHeight-querySheet.offsetHeight;
      const point=map.latLngToContainerPoint(popup.getLatLng());
      const targetY=Math.max(90,visibleHeight/2);
      if(point.y>visibleHeight-25)map.panBy([0,Math.max(0,point.y-targetY)],{animate:false});
    });
  }else{
    querySheet.hidden=true;shell.classList.remove('has-query');popup.options.autoPan=true;
    popup.setContent(popupNode);
  }
}
map.on('popupopen',e=>presentPopup(e.popup));
map.on('popupclose',()=>{currentPopup=null;popupNode=null;querySheet.hidden=true;shell.classList.remove('has-query');queryBody.replaceChildren();});
document.getElementById('closeQuery').addEventListener('click',()=>{map.closePopup();document.getElementById('layersBtn').focus({preventScroll:true});});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||document.getElementById('layerInfo').open)return;
  if(!moreMenu.hidden){closeMore(true);return;}
  if(compactMedia.matches&&!panel.classList.contains('hidden')){closeLayers(true);return;}
  if(!aboutPanel.hidden){closeAbout();document.getElementById('moreBtn').focus();return;}
  map.closePopup();
});
function adaptViewport(){
  ['searchMirror','searchInput'].forEach(id=>document.getElementById(id).placeholder=mobileMedia.matches?'Bairro ou coordenada':'Buscar bairro, local ou coordenada');
  closeLayers();
  if(currentPopup)presentPopup(currentPopup);
  scheduleResize();
}
compactMedia.addEventListener('change',adaptViewport);
mobileMedia.addEventListener('change',()=>{configurePanel();adaptViewport();});

const pointRenderer=L.svg();
let queryMarker=null,userMarker=null;
const highlights=new Set();
function selectLocation(latlng,detail){
  if(typeof ARPIASUI!=='undefined'){ARPIASUI.select({type:'Feature',geometry:{type:'Point',coordinates:[latlng.lng,latlng.lat]},properties:{}},'Coordenada da busca',{origin:'search'},latlng);return;}
  if(queryMarker)map.removeLayer(queryMarker);
  const root=content('Local selecionado',[['Latitude',latlng.lat.toFixed(6)],['Longitude',latlng.lng.toFixed(6)]]);
  if(detail)root.append(detail);
  queryMarker=L.circleMarker(latlng,{renderer:pointRenderer,className:'query-marker',radius:6,color:'#203e36',weight:3,fillColor:'#fff',fillOpacity:1}).addTo(map).bindPopup(coordinateActions(root,latlng),popupOptions()).openPopup();
  document.getElementById('coords').textContent=`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
}
map.on('click',e=>{if(typeof ARPIASUI!=='undefined'&&ARPIASUI.mode()==='consult')ARPIASUI.query(e.latlng);});
overlayDefs.forEach(d=>d.layer.on('click',e=>{
  if(typeof ARPIASUI==='undefined'||ARPIASUI.mode()!=='consult')return;
  if(!e.latlng)return;
  if(e.originalEvent)L.DomEvent.stopPropagation(e.originalEvent);
  const f=e.layer?.feature||e.propagatedFrom?.feature;
  ARPIASUI.query(e.latlng,{layerId:d.id,feature:f});
}));
function viewNiteroi(){closeMore();map.closePopup();placeResults.hidden=true;if(typeof ARPIASUI!=='undefined')ARPIASUI.closeTerritorial();map.fitBounds(NITEROI_BOUNDS,{padding:[18,18]});}
['homeBtn','menuHome'].forEach(id=>document.getElementById(id).addEventListener('click',viewNiteroi));
['locateBtn','mobileLocateBtn','menuLocate'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{closeMore();map.closePopup();map.locate({setView:true,maxZoom:16,enableHighAccuracy:true});}));
map.on('locationfound',e=>{if(userMarker)map.removeLayer(userMarker);userMarker=L.circleMarker(e.latlng,{renderer:pointRenderer,className:'user-location-marker',radius:9,weight:4,color:'#203e36',fillColor:'#a7c7a5',fillOpacity:1}).addTo(map).bindPopup(()=>coordinateActions(content('Sua localização aproximada',[['Latitude',e.latlng.lat.toFixed(6)],['Longitude',e.latlng.lng.toFixed(6)]]),e.latlng),popupOptions()).openPopup();});
map.on('locationerror',()=>toast('Não foi possível obter sua localização.'));
let searchGeneration=0;
let neighborhoodSearchPromise=null;
const placeResults=document.getElementById('placeResults');
function neighborhoodSearchData(){
  if(!neighborhoodSearchPromise)neighborhoodSearchPromise=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Serviço de bairros temporariamente indisponível.')),15000);
    L.esri.query({url:URLS.bairros}).where('1=1').run((error,fc)=>{clearTimeout(timer);if(error||!Array.isArray(fc?.features)||fc.exceededTransferLimit)reject(Error('Serviço de bairros temporariamente indisponível ou com resposta incompleta.'));else resolve(fc.features);});
  }).catch(error=>{neighborhoodSearchPromise=null;throw error;});
  return neighborhoodSearchPromise;
}
function chooseNeighborhood(result,generation){
  if(generation!==searchGeneration)return;
  placeResults.hidden=true;clearHighlights();closeLayers();
  const fc={type:'FeatureCollection',features:result.features};
  const shape=L.geoJSON(fc);map.fitBounds(shape.getBounds(),{padding:[28,28],maxZoom:15});
  if(typeof ARPIASUI!=='undefined')ARPIASUI.select(result.features[0],result.name,{source:'Prefeitura Municipal de Niterói / GeoNit',layerId:'bairros',origin:'search'});
  else L.popup(popupOptions()).setLatLng(shape.getBounds().getCenter()).setContent(content(result.name,[['Seleção','Bairro'],['Fonte','Prefeitura Municipal de Niterói']])).openOn(map);
}
function clearHighlights(){highlights.forEach(l=>map.removeLayer(l));highlights.clear();}
function closeKeyboard(){if(document.activeElement instanceof HTMLInputElement)document.activeElement.blur();}
function searchLocation(raw){
  if(typeof ARPIASUI!=='undefined'&&['edit','measure'].includes(ARPIASUI.mode())){ARPIASUI.request('navigate').then(ok=>{if(ok)searchLocation(raw);});return;}
  raw=raw.trim();placeResults.hidden=true;if(!raw){searchGeneration++;toast('Digite um bairro ou coordenadas para buscar. Busca por ruas em integração.');return;}
  const generation=++searchGeneration;closeKeyboard();
  const match=raw.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*[,;\s]\s*([+-]?\d+(?:\.\d+)?)\s*$/);
  if(match){
    const lat=Number(match[1]),lng=Number(match[2]);
    if(!validCoordinates(lat,lng)){toast('Coordenadas inválidas: latitude entre −90 e 90 e longitude entre −180 e 180.');return;}
    closeLayers();map.setView([lat,lng],Math.min(17,map.getMaxZoom()));selectLocation(L.latLng(lat,lng));return;
  }
  placeResults.replaceChildren(element('p','Buscando bairros oficiais…'));placeResults.hidden=false;
  neighborhoodSearchData().then(features=>{
    if(generation!==searchGeneration)return;
    const results=ARPIASSearch.matches(features,raw);
    if(!results.length){placeResults.replaceChildren(element('p','Nenhum local encontrado. Busca por ruas ainda em integração.'));return;}
    if(results.length===1){chooseNeighborhood(results[0],generation);return;}
    placeResults.replaceChildren(element('p',`${results.length} bairros encontrados. Escolha um resultado:`));
    results.forEach(result=>{const button=element('button',result.name);button.type='button';button.addEventListener('click',()=>chooseNeighborhood(result,generation));placeResults.append(button);});
  }).catch(error=>{if(generation===searchGeneration)placeResults.replaceChildren(element('p',`${error.message} Tente buscar novamente.`));});
}
document.getElementById('headerSearchBtn').addEventListener('click',()=>{closeMore();closeLayers();document.getElementById('searchMirror').focus();});
[['searchInput','searchBtn'],['searchMirror','searchMirrorBtn']].forEach(([field,button])=>{
  const input=document.getElementById(field);const run=()=>searchLocation(input.value);
  input.addEventListener('input',()=>{searchGeneration++;placeResults.hidden=true;});
  document.getElementById(button).addEventListener('click',run);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run();}});
});
function clearLayers(){
  map.stopLocate();
  closeMore();searchGeneration++;placeResults.hidden=true;map.closePopup();if(queryMarker)map.removeLayer(queryMarker);queryMarker=null;
  if(userMarker)map.removeLayer(userMarker);userMarker=null;clearHighlights();
  overlayDefs.forEach(d=>{map.removeLayer(d.layer);d.input.checked=false;});
  reliefDefs.forEach(d=>{d.input.checked=false;if(d.layer)map.removeLayer(d.layer);});
  civilDefs.forEach(d=>{d.input.checked=false;if(d.layer)map.removeLayer(d.layer);});
  if(typeof ARPIASUI!=='undefined')ARPIASUI.clearSelection();
  document.getElementById('coords').textContent='Ative Consultar para investigar um local';toast('Camadas limpas. Mapa-base preservado.');
}
['clearBtn','clearLayersBtn'].forEach(id=>document.getElementById(id).addEventListener('click',clearLayers));
window.addEventListener('resize',scheduleResize);
window.visualViewport?.addEventListener('resize',scheduleResize);
if(matchMedia('(max-width:1199px)').matches)document.getElementById('baseAccordion').open=false;
adaptViewport();
const initialLocation=ARPIASLocation.parse(new URLSearchParams(location.search));
if(initialLocation?.error)toast(initialLocation.error);
else if(initialLocation){
  map.setView([initialLocation.lat,initialLocation.lon],Math.min(initialLocation.zoom,map.getMaxZoom()));
  selectLocation(L.latLng(initialLocation.lat,initialLocation.lon));
}
scheduleResize();
