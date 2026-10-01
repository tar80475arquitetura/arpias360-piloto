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
  {id:'ortho',name:'Ortofoto Niterói 2019',layer:ortho2019,desc:'Imagem aérea oficial de alta resolução. Base histórica, não representa necessariamente a situação atual.',status:'functional'},
  {id:'osm',name:'Mapa de ruas',layer:baseOSM,desc:'OpenStreetMap para referência viária e toponímica.',status:'functional'},
  {id:'recent',name:`Satélite recente · ${recentDate}`,layer:recentSatellite,desc:'NASA GIBS / VIIRS. Atualidade temporal complementar, com menor resolução espacial.',status:'partial'}
];

ortho2019.addTo(map);
let activeBase=ortho2019;
let activeBaseDef=baseDefs[0];
let orthoErrors=0;
let orthoFallbackDone=false;

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

ortho2019.on('tileerror',()=>{
  orthoErrors++;
  if(orthoErrors>=8&&!orthoFallbackDone&&activeBase===ortho2019){
    orthoFallbackDone=true;
    map.removeLayer(ortho2019);
    baseOSM.addTo(map);
    activeBase=baseOSM;
    activeBaseDef=baseDefs[1];
    document.getElementById('base_osm').checked=true;
    updateStatus(activeBaseDef,'Ortofoto indisponível no momento. Exibindo mapa de ruas.');
    toast('Ortofoto oficial indisponível. Mapa de ruas ativado automaticamente.');
  }
});

function safeName(p){return p.tx_nome||p.NOME||p.Nome||p.COMUNIDADE||p.Classifica||p.Layer||p.tx_obs||`Elemento ${p.OBJECTID||''}`}
function popupHTML(feature,label,source){const p=feature.properties||{};return `<div class="popup-title">${safeName(p)}</div><div>${label}</div><div class="popup-source">Fonte: ${source}</div>`}
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

const baseControl=document.getElementById('baseControl');
const baseMeta=document.getElementById('baseMeta');
updateStatus(activeBaseDef,'Base oficial selecionada');

baseDefs.forEach((d,i)=>{
  const id=`base_${d.id}`;
  baseControl.insertAdjacentHTML('beforeend',`<label class="control-item"><input type="radio" name="base" id="${id}" ${i===0?'checked':''}><span><span class="name">${d.name}</span><small>${d.desc}</small></span><span class="status ${d.status==='partial'?'partial':''}">${d.status==='partial'?'complementar':'funcional'}</span></label>`);
  document.getElementById(id).addEventListener('change',()=>{
    if(!document.getElementById(id).checked)return;
    if(map.hasLayer(activeBase))map.removeLayer(activeBase);
    d.layer.addTo(map);
    d.layer.bringToBack?.();
    activeBase=d.layer;
    activeBaseDef=d;
    updateStatus(d,d.id==='ortho'?'Ortofoto oficial de 2019':d.desc);
    baseMeta.innerHTML=d.id==='ortho'?'<strong>Ortofoto oficial · 2019</strong><br>Alta resolução espacial. Use as camadas recentes apenas como complemento temporal. <span class="ortho-warning">Não interpretar a imagem de 2019 como situação atual.</span>':d.desc;
    baseMeta.classList.add('visible');
  });
});

const layerControl=document.getElementById('layerControl');
let currentGroup='';
overlayDefs.forEach(d=>{
  if(d.group!==currentGroup){currentGroup=d.group;layerControl.insertAdjacentHTML('beforeend',`<div class="group-label">${currentGroup}</div>`)}
  const id=`layer_${d.id}`;
  const checked=map.hasLayer(d.layer)?'checked':'';
  layerControl.insertAdjacentHTML('beforeend',`<label class="control-item"><input type="checkbox" id="${id}" ${checked}><span><span class="name">${d.name}</span><small>${d.desc}</small></span><span class="status">funcional</span></label>`);
  document.getElementById(id).addEventListener('change',e=>{
    if(e.target.checked){d.layer.addTo(map);toast(`${d.name} ativada`)}else{map.removeLayer(d.layer)}
  });
});

fetch('data/camadas.json').then(r=>r.json()).then(meta=>{
  const el=document.getElementById('plannedList');
  meta.parciais.concat(meta.planejadas).forEach(x=>el.insertAdjacentHTML('beforeend',`<span class="planned-pill" title="${x.status}">${x.nome}</span>`));
}).catch(()=>{});

function searchLocation(){
  const raw=document.getElementById('searchInput').value.trim();
  if(!raw)return;
  const coordMatch=raw.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if(coordMatch){
    const lat=parseFloat(coordMatch[1]),lng=parseFloat(coordMatch[2]);
    if(Number.isFinite(lat)&&Number.isFinite(lng)){
      map.setView([lat,lng],17);
      L.popup().setLatLng([lat,lng]).setContent(`<div class="popup-title">Coordenadas</div><div>${lat.toFixed(6)}, ${lng.toFixed(6)}</div>`).openOn(map);
      document.getElementById('panel').classList.add('hidden');
      return;
    }
  }
  const term=raw.replace(/'/g,"''");
  L.esri.query({url:URLS.bairros}).where(`UPPER(tx_nome) LIKE UPPER('%${term}%') OR UPPER(tx_obs) LIKE UPPER('%${term}%')`).run((err,fc)=>{
    if(err||!fc?.features?.length){toast('Bairro não encontrado ou serviço oficial indisponível.');return}
    const highlight=L.geoJSON(fc,{style:{color:'#43bfb5',weight:4,fillColor:'#43bfb5',fillOpacity:.12}}).addTo(map);
    map.fitBounds(highlight.getBounds(),{padding:[50,50],maxZoom:15});
    const p=fc.features[0].properties||{};
    L.popup().setLatLng(highlight.getBounds().getCenter()).setContent(`<div class="popup-title">${safeName(p)}</div><div>Bairro selecionado</div><div class="popup-source">Fonte: Prefeitura Municipal de Niterói</div>`).openOn(map);
    document.getElementById('panel').classList.add('hidden');
    setTimeout(()=>map.removeLayer(highlight),12000);
  });
}

document.getElementById('searchBtn').addEventListener('click',searchLocation);
document.getElementById('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')searchLocation()});
document.getElementById('homeBtn').addEventListener('click',()=>map.fitBounds(NITEROI_BOUNDS,{padding:[18,18]}));
document.getElementById('locateBtn').addEventListener('click',()=>map.locate({setView:true,maxZoom:16,enableHighAccuracy:true}));
map.on('locationfound',e=>L.circleMarker(e.latlng,{radius:7,weight:3,color:'#2fa89f',fillColor:'#56cfc3',fillOpacity:.35}).addTo(map).bindPopup('Sua localização aproximada').openPopup());
map.on('locationerror',()=>toast('Não foi possível obter sua localização.'));

const panel=document.getElementById('panel');
const aboutPanel=document.getElementById('aboutPanel');
function openLayers(){panel.classList.remove('hidden');aboutPanel.classList.remove('open');document.getElementById('layersBtn').classList.add('active');document.getElementById('aboutBtn').classList.remove('active')}
function closeLayers(){panel.classList.add('hidden');document.getElementById('layersBtn').classList.remove('active')}

document.getElementById('togglePanel').addEventListener('click',()=>panel.classList.contains('hidden')?openLayers():closeLayers());
document.getElementById('layersBtn').addEventListener('click',()=>panel.classList.contains('hidden')?openLayers():closeLayers());
document.getElementById('closePanel').addEventListener('click',closeLayers);
document.getElementById('aboutBtn').addEventListener('click',()=>{aboutPanel.classList.toggle('open');panel.classList.add('hidden');document.getElementById('aboutBtn').classList.toggle('active',aboutPanel.classList.contains('open'));document.getElementById('layersBtn').classList.remove('active')});
document.getElementById('closeAbout').addEventListener('click',()=>{aboutPanel.classList.remove('open');document.getElementById('aboutBtn').classList.remove('active')});

function toggleFull(){const el=document.querySelector('.mapwrap');if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.()}
document.getElementById('fullBtnTop').addEventListener('click',toggleFull);

map.on('click',e=>{
  const lat=e.latlng.lat.toFixed(6),lng=e.latlng.lng.toFixed(6);
  const osm=`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
  const ext=`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  document.getElementById('coords').innerHTML=`${lat}, ${lng} · <a href="#" id="copyCoord">copiar</a> · <a target="_blank" rel="noopener" href="${osm}">OSM</a> · <a target="_blank" rel="noopener" href="${ext}">abrir mapa</a>`;
  setTimeout(()=>document.getElementById('copyCoord')?.addEventListener('click',ev=>{ev.preventDefault();navigator.clipboard?.writeText(`${lat}, ${lng}`);toast('Coordenadas copiadas')}),0);
});

window.addEventListener('resize',()=>map.invalidateSize());
setTimeout(()=>map.invalidateSize(),300);