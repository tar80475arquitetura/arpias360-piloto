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
  attribution:'Prefeitura Municipal de Niterói / SIGeo · Ortofoto 2019'
});

const recentSatellite=L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${recentDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,{
  minZoom:1,
  maxNativeZoom:9,
  maxZoom:19,
  attribution:`NASA GIBS / VIIRS · ${recentDate}`
});

const baseDefs=[
  {id:'ortho',name:'Ortofoto Niterói 2019',layer:ortho2019,desc:'Imagem aérea oficial de alta resolução. Base histórica, não representa necessariamente a situação atual.'},
  {id:'osm',name:'Mapa de ruas',layer:baseOSM,desc:'OpenStreetMap para referência viária e toponímica.'},
  {id:'recent',name:`Satélite recente · ${recentDate}`,layer:recentSatellite,desc:'NASA GIBS / VIIRS. Atualidade temporal complementar, com menor resolução espacial.'}
];

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
  document.getElementById('activeBaseLabel').textContent=def.name;
  document.getElementById('statusMessage').textContent=msg||def.desc;
}

function safeName(p){return p.tx_nome||p.NOME||p.Nome||p.COMUNIDADE||p.Classifica||p.Layer||p.tx_obs||`Elemento ${p.OBJECTID||''}`}
function popupHTML(feature,label,source){return content(safeName(feature.properties||{}),[['Camada',label],['Fonte',source]]);}
function feature(url,style,label,source,options={}){
  const lyr=L.esri.featureLayer({url,simplifyFactor:options.simplifyFactor??.35,precision:5,minZoom:options.minZoom,style});
  lyr.bindPopup(l=>popupHTML(l.feature,label,source));
  return lyr;
}

const limite=feature(URLS.limite,()=>({color:'#ef6d5c',weight:3,fillOpacity:0,dashArray:'8 5'}),'Limite municipal','Prefeitura Municipal de Niterói');
const bairros=feature(URLS.bairros,()=>({color:'#e7a83e',weight:1.25,fillColor:'#e7a83e',fillOpacity:.035}),'Bairro','Prefeitura Municipal de Niterói · Plano Diretor');
const hidro=feature(URLS.hidro,()=>({color:'#3388aa',weight:2,opacity:.9}),'Hidrografia','Prefeitura Municipal de Niterói · Plano Diretor');
const zeis=feature(URLS.zeis,()=>({color:'#8c63b8',weight:1.2,fillColor:'#a77bcc',fillOpacity:.22}),'Zona Especial de Interesse Social','Prefeitura Municipal de Niterói · Plano Diretor');
const zeia=feature(URLS.zeia,()=>({color:'#4f8d57',weight:1.2,fillColor:'#75ad7b',fillOpacity:.18}),'Zona de Especial Interesse Ambiental','Prefeitura Municipal de Niterói · Plano Diretor');
const appm=feature(URLS.appm,()=>({color:'#3e7647',weight:1.1,fillColor:'#4f965b',fillOpacity:.18}),'Área de Proteção Permanente Municipal','Prefeitura Municipal de Niterói · Plano Diretor');
const apa=feature(URLS.apa,()=>({color:'#718c43',weight:1.1,fillColor:'#95b467',fillOpacity:.15}),'Área de Proteção Ambiental Municipal','Prefeitura Municipal de Niterói · Plano Diretor');
const comunidades=feature(URLS.comunidades,()=>({color:'#cf7a33',weight:1.1,fillColor:'#e7a15f',fillOpacity:.2}),'Comunidades · base pública municipal','Prefeitura Municipal de Niterói · Dados Abertos');
const lotes=feature(URLS.lotes,()=>({color:'#f4f0e8',weight:.55,fillOpacity:0}),'Lote · base pública municipal','Prefeitura Municipal de Niterói · Dados Abertos',{minZoom:16,simplifyFactor:.2});

limite.addTo(map);
bairros.addTo(map);

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

L.control.scale({metric:true,imperial:false,position:'bottomright'}).addTo(map);

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
    ['Ver fachada',`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${pair}`],
    ['Google Maps',`https://www.google.com/maps/search/?api=1&query=${pair}`],
    ['Abrir no Google Earth',`https://earth.google.com/web/search/${pair}/`]
  ];
  links.forEach(([label,url])=>{
    const a=element('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';
    if(label==='Ver fachada')a.title='Visualização de rua disponível próxima ao ponto selecionado.';
    actions.append(a);
  });
  const copy=element('button','Copiar coordenadas');copy.type='button';copy.addEventListener('click',()=>copyCoordinates(latlng));actions.append(copy);
  root.append(actions,element('p','Visualização de rua disponível próxima ao ponto selecionado.','popup-note'));
  return root;
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
function baseState(def,state){if(def.statusNode)def.statusNode.textContent=state;}
function selectBase(def){
  clearTimeout(baseTimer);baseGeneration++;
  if(activeBaseDef!==def)previousBaseDef=activeBaseDef;
  activeBaseDef=def;activeBase=def.layer;
  map.setMaxZoom(def.id==='ortho'?23:19);
  // Keep the previous base underneath while NASA tiles are being checked.
  baseDefs.forEach(d=>{if(d!==def&&!(def.id==='recent'&&d===previousBaseDef)&&map.hasLayer(d.layer))map.removeLayer(d.layer);});
  if(!map.hasLayer(def.layer))def.layer.addTo(map);
  document.getElementById(`base_${def.id}`).checked=true;
  baseMeta.textContent=def.desc;baseMeta.classList.add('visible');
  updateStatus(def,'Carregando base cartográfica…');baseState(def,'Carregando');
  if(def.loaded&&!def.layer.isLoading()){
    baseState(def,'Disponível');updateStatus(def,def.desc);return;
  }
  const generation=baseGeneration;
  baseTimer=setTimeout(()=>{if(generation===baseGeneration&&def.layer.isLoading())baseFailure(def);},15000);
}
function baseFailure(def){
  def.loaded=false;
  baseState(def,'Indisponível');
  if(activeBaseDef!==def)return;
  const fallback=previousBaseDef!==def&&previousBaseDef.id!=='recent'?previousBaseDef:baseDefs[1];
  if(fallback===def){updateStatus(def,'Mapa de ruas temporariamente indisponível.');return;}
  selectBase(fallback);
  updateStatus(fallback,`${def.name} indisponível. Exibindo ${fallback.name}.`);
  toast(`${def.name} temporariamente indisponível.`);
}
baseDefs.forEach(d=>{
  const label=element('label',undefined,'control-item');
  const radio=element('input');radio.type='radio';radio.name='base';radio.id=`base_${d.id}`;radio.checked=d===activeBaseDef;
  const text=element('span');text.append(element('span',d.name,'name'),element('small',d.desc));
  d.statusNode=element('span','Teste pendente','status partial');label.append(radio,text,d.statusNode);baseControl.append(label);
  radio.addEventListener('change',()=>{if(radio.checked)selectBase(d);});
  d.layer.on('tileload',()=>{
    if(activeBaseDef!==d)return;
    d.loaded=true;
    if(d.id==='recent')baseDefs.forEach(other=>{if(other!==d&&map.hasLayer(other.layer))map.removeLayer(other.layer);});
    clearTimeout(baseTimer);baseState(d,'Disponível');updateStatus(d,d.desc);
  });
  d.layer.on('tileerror',()=>baseFailure(d));
});
selectBase(baseDefs[0]);

const layerControl=document.getElementById('layerControl');
let currentGroup='';
overlayDefs.forEach(d=>{
  if(d.group!==currentGroup){currentGroup=d.group;layerControl.append(element('div',currentGroup,'group-label'));}
  const label=element('label',undefined,'control-item');
  const input=element('input');input.type='checkbox';input.id=`layer_${d.id}`;input.checked=map.hasLayer(d.layer);d.input=input;
  const text=element('span');text.append(element('span',d.name,'name'),element('small',d.desc));
  const status=element('span','Teste pendente','status partial');
  label.append(input,text,status);layerControl.append(label);
  input.addEventListener('change',()=>{if(input.checked){status.textContent='Carregando';d.layer.addTo(map);}else map.removeLayer(d.layer);});
  d.layer.on('loading',()=>{status.textContent='Carregando';});
  d.layer.on('load',()=>{status.textContent='Disponível';});
  d.layer.on('requesterror',()=>{status.textContent='Indisponível';toast(`${d.name}: serviço temporariamente indisponível.`);});
});

// Local SVG paths: no external icon requests or dataset HTML interpolation.
const symbols={
  sirenes:'M7 16V10a5 5 0 0 1 10 0v6M5 17h14v3H5zM12 1v2M2 7l2 1M22 7l-2 1',
  pluviometros:'M5 13a4 4 0 1 1 1-8 6 6 0 0 1 11 2 3 3 0 1 1 1 6H5M7 16l-1 4M12 16l-1 4M17 16l-1 4',
  nudecs:'M9 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0M5 20v-3a7 7 0 0 1 14 0v3M2 9a2 2 0 1 0 4 0M18 9a2 2 0 1 0 4 0',
  pontos_apoio:'M3 11l9-8 9 8M5 10v11h14V10M10 21v-7h4v7'
};
function symbol(id){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',symbols[id]);svg.append(path);return svg;
}
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
  const box=content(d.name,meta?[['Fonte',meta.source],['Registros',meta.count],['Geometria',meta.geometry],['Sistema de coordenadas',meta.crs],['Sistema original',meta.original_crs],['Observações',meta.notes]]:[],meta?'Validação estrutural concluída. Conferência ponto a ponto contra o limite administrativo oficial pendente.':'Metadados temporariamente indisponíveis.');
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
  d.loading=(async()=>{
    try{
      const g=await readJSON(`data/processed/defesa-civil/${d.file}`);validateCollection(g,d);
      d.layer=L.geoJSON(g,{
        pointToLayer:(f,ll)=>{
          const icon=element('div',undefined,`civil-marker ${d.id}`);icon.append(symbol(d.id));
          return L.marker(ll,{icon:L.divIcon({html:icon,className:'civil-div-icon',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-16]}),bubblingMouseEvents:false,title:f.properties.nome});
        },
        onEachFeature:(f,layer)=>layer.bindPopup(()=>civilPopup(d,f,layer.getLatLng()))
      });
      d.status.textContent='Disponível';civilMessage.textContent=`${d.name}: ${g.features.length} pontos carregados.`;
      if(d.input.checked)d.layer.addTo(map);
      return d.layer;
    }catch(error){
      console.error(`Defesa Civil / ${d.id}:`,error);d.status.textContent='Indisponível';d.input.checked=false;
      civilMessage.textContent='Camada temporariamente indisponível.';toast('Camada temporariamente indisponível.');return null;
    }finally{d.loading=null;}
  })();
  return d.loading;
}
civilDefs.forEach(d=>{
  const row=element('div',undefined,'civil-control');
  const label=element('label',undefined,'civil-label');
  d.input=element('input');d.input.type='checkbox';d.input.id=`layer_${d.id}`;
  const icon=element('span',undefined,`civil-symbol ${d.id}`);icon.append(symbol(d.id));
  const text=element('span');text.append(element('span',d.name,'name'));
  d.status=element('small','Dados validados / teste pendente','civil-status');text.append(d.status);
  label.append(d.input,icon,text);
  const info=element('button','i','info-button');info.type='button';info.title=`Informações: ${d.name}`;info.setAttribute('aria-label',info.title);info.addEventListener('click',()=>showCivilInfo(d));
  row.append(label,info);document.getElementById('civilControl').append(row);
  d.input.addEventListener('change',()=>{
    if(d.input.checked){if(d.layer)d.layer.addTo(map);else loadCivil(d);}
    else if(d.layer)map.removeLayer(d.layer);
  });
});
document.getElementById('closeInfo').addEventListener('click',()=>document.getElementById('layerInfo').close());
readJSON('data/camadas.json').then(meta=>{
  if(!Array.isArray(meta.parciais)||!Array.isArray(meta.planejadas))throw new Error('Catálogo inválido');
  meta.parciais.concat(meta.planejadas).forEach(x=>{const pill=element('span',x.nome,'planned-pill');pill.title=x.status;document.getElementById('plannedList').append(pill);});
}).catch(error=>{console.error('Catálogo:',error);document.getElementById('plannedList').textContent='Catálogo temporariamente indisponível.';});

const panel=document.getElementById('panel');
const aboutPanel=document.getElementById('aboutPanel');
function resizeMap(){map.invalidateSize({pan:false});}
function scheduleResize(){requestAnimationFrame(resizeMap);clearTimeout(scheduleResize.timer);scheduleResize.timer=setTimeout(resizeMap,250);}
document.querySelector('.mapwrap').addEventListener('transitionend',resizeMap);
panel.addEventListener('transitionend',resizeMap);
new ResizeObserver(resizeMap).observe(document.querySelector('.mapwrap'));
function openLayers(){panel.classList.remove('hidden');aboutPanel.classList.remove('open');document.getElementById('layersBtn').classList.add('active');document.getElementById('aboutBtn').classList.remove('active');scheduleResize();}
function closeLayers(){panel.classList.add('hidden');document.getElementById('layersBtn').classList.remove('active');scheduleResize();}
['togglePanel','layersBtn'].forEach(id=>document.getElementById(id).addEventListener('click',()=>panel.classList.contains('hidden')?openLayers():closeLayers()));
document.getElementById('closePanel').addEventListener('click',closeLayers);
document.getElementById('aboutBtn').addEventListener('click',()=>{aboutPanel.classList.toggle('open');closeLayers();document.getElementById('aboutBtn').classList.toggle('active',aboutPanel.classList.contains('open'));});
document.getElementById('closeAbout').addEventListener('click',()=>{aboutPanel.classList.remove('open');document.getElementById('aboutBtn').classList.remove('active');});
document.getElementById('fullBtnTop').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.mapwrap').requestFullscreen();}catch(error){toast('Tela cheia indisponível neste navegador.');}
});
document.addEventListener('fullscreenchange',scheduleResize);
map.on('popupopen',()=>document.querySelector('.mapwrap').classList.add('has-popup'));
map.on('popupclose',()=>document.querySelector('.mapwrap').classList.remove('has-popup'));

const pointRenderer=L.svg();
let queryMarker=null,userMarker=null;
const highlights=new Set();
function selectLocation(latlng,detail){
  if(queryMarker)map.removeLayer(queryMarker);
  const root=content('LOCAL SELECIONADO',[['Latitude',latlng.lat.toFixed(6)],['Longitude',latlng.lng.toFixed(6)]]);
  if(detail)root.append(detail);
  queryMarker=L.circleMarker(latlng,{renderer:pointRenderer,className:'query-marker',radius:6,color:'#163f4b',weight:3,fillColor:'#fff',fillOpacity:1}).addTo(map).bindPopup(coordinateActions(root,latlng)).openPopup();
  document.getElementById('coords').textContent=`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
}
map.on('click',e=>selectLocation(e.latlng));
// A territorial feature click also selects a location, preserving its details.
overlayDefs.forEach(d=>d.layer.on('click',e=>{
  if(!e.latlng)return;
  if(e.originalEvent)L.DomEvent.stopPropagation(e.originalEvent);
  const f=e.layer?.feature||e.propagatedFrom?.feature;
  selectLocation(e.latlng,f?popupHTML(f,d.name,'Prefeitura Municipal de Niterói'):undefined);
}));
document.getElementById('homeBtn').addEventListener('click',()=>map.fitBounds(NITEROI_BOUNDS,{padding:[18,18]}));
document.getElementById('locateBtn').addEventListener('click',()=>map.locate({setView:true,maxZoom:16,enableHighAccuracy:true}));
map.on('locationfound',e=>{if(userMarker)map.removeLayer(userMarker);userMarker=L.circleMarker(e.latlng,{renderer:pointRenderer,className:'user-location-marker',radius:7,weight:3,color:'#2fa89f',fillColor:'#56cfc3',fillOpacity:.35}).addTo(map).bindPopup('Sua localização aproximada').openPopup();});
map.on('locationerror',()=>toast('Não foi possível obter sua localização.'));
let searchGeneration=0;
function clearHighlights(){highlights.forEach(l=>map.removeLayer(l));highlights.clear();}
function searchLocation(raw){
  raw=raw.trim();if(!raw)return;
  const generation=++searchGeneration;
  const match=raw.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*[,;\s]\s*([+-]?\d+(?:\.\d+)?)\s*$/);
  if(match){
    const lat=Number(match[1]),lng=Number(match[2]);
    if(!validCoordinates(lat,lng)){toast('Coordenadas inválidas: latitude entre −90 e 90 e longitude entre −180 e 180.');return;}
    closeLayers();map.setView([lat,lng],17);selectLocation(L.latLng(lat,lng));return;
  }
  const term=raw.replace(/'/g,"''");
  L.esri.query({url:URLS.bairros}).where(`UPPER(tx_nome) LIKE UPPER('%${term}%') OR UPPER(tx_obs) LIKE UPPER('%${term}%')`).run((err,fc)=>{
    if(generation!==searchGeneration)return;
    if(err||!fc?.features?.length){toast('Bairro não encontrado ou serviço oficial indisponível.');return;}
    clearHighlights();const highlight=L.geoJSON(fc,{style:{color:'#43bfb5',weight:4,fillOpacity:.12}}).addTo(map);highlights.add(highlight);
    closeLayers();map.fitBounds(highlight.getBounds(),{padding:[50,50],maxZoom:15});
    L.popup().setLatLng(highlight.getBounds().getCenter()).setContent(content(safeName(fc.features[0].properties||{}),[['Seleção','Bairro'],['Fonte','Prefeitura Municipal de Niterói']])).openOn(map);
    setTimeout(()=>{map.removeLayer(highlight);highlights.delete(highlight);},12000);
  });
}
[['searchInput','searchBtn'],['searchMirror','searchMirrorBtn']].forEach(([field,button])=>{
  const input=document.getElementById(field);const run=()=>searchLocation(input.value);
  document.getElementById(button).addEventListener('click',run);input.addEventListener('keydown',e=>{if(e.key==='Enter')run();});
});
document.getElementById('clearBtn').addEventListener('click',()=>{
  searchGeneration++;map.closePopup();if(queryMarker)map.removeLayer(queryMarker);queryMarker=null;
  if(userMarker)map.removeLayer(userMarker);userMarker=null;clearHighlights();
  overlayDefs.forEach(d=>{map.removeLayer(d.layer);d.input.checked=false;});
  civilDefs.forEach(d=>{d.input.checked=false;if(d.layer)map.removeLayer(d.layer);});
  document.getElementById('coords').textContent='Clique no mapa para obter coordenadas';map.fitBounds(NITEROI_BOUNDS,{padding:[18,18]});toast('Mapa limpo.');
});
window.addEventListener('resize',scheduleResize);
if(matchMedia('(max-width:700px)').matches)closeLayers();
scheduleResize();
