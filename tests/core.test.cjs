const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
test('late tile callbacks cannot update a removed or reattached base',()=>{
  let callback,attached=true,remove;const completed=[];
  const layer={on:(event,fn)=>{remove=fn;},createTile:(coords,done)=>{callback=done;return {};}};
  const context=vm.createContext({map:{hasLayer:()=>attached}});
  vm.runInContext(source.slice(source.indexOf('function protectTileLifecycle('),source.indexOf('baseDefs.forEach(d=>protectTileLifecycle')),context);
  context.protectTileLifecycle(layer);layer.createTile({},(...args)=>completed.push(args));callback(null,{});assert.equal(completed.length,1);
  layer.createTile({},(...args)=>completed.push(args));const stale=callback;attached=false;remove();stale(Error('delayed'),{});assert.equal(completed.length,1);
  attached=true;layer.createTile({},(...args)=>completed.push(args));stale(null,{});assert.equal(completed.length,1);callback(null,{});assert.equal(completed.length,2);
});
class Element{
  constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.textContent='';}
  append(...nodes){this.children.push(...nodes);}
  addEventListener(name,fn){this.listeners[name]=fn;}
  setAttribute(name,value){(this.attributes??={})[name]=value;}
  querySelector(selector){return this.children.find(node=>selector==='.'+node.className)||null;}
}
function sandbox(){
  const messages=[];
  const context=vm.createContext({document:{createElement:tag=>new Element(tag)},navigator:{},toast:m=>messages.push(m),AbortSignal,matchMedia:()=>({matches:false}),fetch:async()=>({ok:true,json:async()=>({})}),console:{error(){}},civilMessage:new Element('div')});
  for(const [start,end] of [['function element(', 'async function readJSON('],['async function readJSON(', 'const baseControl='],['function civilPopup(', 'async function showCivilInfo('],['function validateCollection(', 'async function loadCivil('],['async function loadCivil(', 'civilDefs.forEach(']]){
    vm.runInContext(source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))),context);
  }
  return {context,messages};
}
test('all recovered collections retain documented counts and valid coordinates',()=>{
  const {context}=sandbox();const meta=JSON.parse(fs.readFileSync(path.join(root,'data/fontes-recuperadas.json'),'utf8'));
  let total=0;for(const d of meta.datasets){const g=JSON.parse(fs.readFileSync(path.join(root,d.file),'utf8'));context.validateCollection(g,d);assert.equal(new Set(g.features.map(f=>f.properties.id)).size,d.count);total+=g.features.length;}
  assert.equal(total,138);
});
test('coordinate limits reject out-of-range, non-numeric and infinite values',()=>{
  const {context:c}=sandbox();assert.equal(c.validCoordinates(-90,180),true);
  for(const pair of [[91,0],[0,-181],[NaN,0],[Infinity,1],['-22',-43]])assert.equal(c.validCoordinates(...pair),false);
});
test('malformed collection and features are rejected before Leaflet',()=>{
  const {context:c}=sandbox();
  for(const g of [{type:'FeatureCollection',features:null},{type:'FeatureCollection',features:[]},{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[-43,91]},properties:{}}]}])assert.throws(()=>c.validateCollection(g,{count:1}));
});
test('HTTP failure and malformed JSON are surfaced',async()=>{
  const {context:c}=sandbox();c.fetch=async()=>({ok:false,status:404,json:async()=>({})});await assert.rejects(c.readJSON('missing'),/404/);
  c.fetch=async()=>({ok:true,json:async()=>{throw Error('invalid JSON');}});await assert.rejects(c.readJSON('bad'),/invalid JSON/);
});
test('external popup values become text nodes and never HTML',()=>{
  const {context:c}=sandbox();const payload='<img src=x onerror=alert(1)>';
  const el=c.content(payload,[['Nome',payload],['Endereço',null]]);assert.equal(el.children[0].textContent,payload);assert.equal(el.children[1].children.length,2);assert.equal(el.children[1].children[1].textContent,payload);assert.equal(el.innerHTML,undefined);
});
test('clipboard feedback waits for resolution and reports failure',async()=>{
  const {context:c,messages}=sandbox();let done;c.navigator.clipboard={writeText:()=>new Promise(resolve=>{done=resolve;})};
  const pending=c.copyCoordinates({lat:-22.9,lng:-43.1});assert.deepEqual(messages,[]);done();await pending;assert.deepEqual(messages,['Coordenadas copiadas.']);
  c.navigator.clipboard.writeText=async()=>{throw Error('denied');};await c.copyCoordinates({lat:-22.9,lng:-43.1});assert.equal(messages.at(-1),'Não foi possível copiar automaticamente.');
});
test('coordinate links use the feature position and new-tab protection',()=>{
  const {context:c}=sandbox();const node=c.coordinateActions(new Element('div'),{lat:-22.9,lng:-43.1});const links=node.children[0].children.slice(0,3);
  assert.ok(links[0].href.includes('viewpoint=-22.900000,-43.100000'));assert.ok(links[1].href.includes('query=-22.900000,-43.100000'));assert.ok(links[2].href.endsWith('/-22.900000,-43.100000/'));
  links.forEach(a=>{assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');});
});
test('a failed civil layer is isolated and can be retried',async()=>{
  const {context:c}=sandbox();const d={id:'sirenes',name:'Sirenes',file:'sirenes.geojson',count:37,status:{},input:{checked:true}};
  c.fetch=async()=>({ok:false,status:503});assert.equal(await c.loadCivil(d),null);assert.equal(d.status.textContent,'Indisponível');assert.equal(d.input.checked,false);assert.equal(d.loading,null);
  const g=JSON.parse(fs.readFileSync(path.join(root,'data/processed/defesa-civil/sirenes.geojson'),'utf8'));let added=false;
  c.fetch=async()=>({ok:true,json:async()=>g});c.L={geoJSON:()=>({addTo(){added=true;}})};d.input.checked=false;assert.ok(await c.loadCivil(d));assert.equal(d.status.textContent,'Disponível');assert.equal(added,false);
});
test('successive geolocation results replace the previous marker',()=>{
  const {context:c}=sandbox();let callback;const active=new Set();
  c.map={on:(name,fn)=>{callback=fn;},removeLayer:layer=>active.delete(layer)};
  c.pointRenderer={};c.L={circleMarker:()=>{const marker={addTo(){active.add(marker);return marker;},bindPopup(){return marker;},openPopup(){return marker;}};return marker;}};
  vm.runInContext('let userMarker=null;'+source.split('\n').find(line=>line.startsWith("map.on('locationfound'")),c);
  callback({latlng:{lat:-22.9,lng:-43.1}});callback({latlng:{lat:-22.91,lng:-43.11}});assert.equal(active.size,1);
});
test('satellite failure restores the preceding base without changing inactive bases',()=>{
  const {context:c}=sandbox();const osm={id:'osm',name:'Mapa de ruas'},ortho={id:'ortho'},sat={id:'recent',name:'Satélite'};const selected=[];
  Object.assign(c,{baseDefs:[ortho,osm,sat],activeBaseDef:sat,previousBaseDef:osm,baseState(){},selectBase:d=>selected.push(d),updateStatus(){}});
  const start=source.indexOf('function baseFailure(');vm.runInContext(source.slice(start,source.indexOf('baseDefs.forEach(d=>{',start)),c);
  c.baseFailure(sat);assert.equal(selected[0],osm);selected.length=0;c.activeBaseDef=osm;c.baseFailure(sat);assert.equal(selected.length,0);
});
test('sharing awaits clipboard and exposes only a coordinate link',async()=>{
  const {context:c,messages}=sandbox();c.ARPIASLocation=require('../js/location.js');c.location={href:'https://example.test/arpias/?private=remove#old'};c.map={getZoom:()=>16};
  let finish,written;c.navigator.clipboard={writeText:text=>{written=text;return new Promise(resolve=>{finish=resolve;});}};
  const root=new Element('div');const task=c.sharePoint(root,{lat:-22.9,lng:-43.1});assert.deepEqual(messages,[]);finish();await task;
  assert.equal(written,'https://example.test/arpias/?lat=-22.900000&lon=-43.100000&zoom=16');assert.ok(messages.at(-1).startsWith('Link do ponto copiado.'));assert.equal(root.children[0].readOnly,true);
});

test('cached satellite selection removes the previous base and preserves overlays',()=>{
  const {context:c}=sandbox();const osm={id:'osm',layer:{}},sat={id:'recent',layer:{isLoading:()=>false},loaded:true,desc:'NASA'};const overlay={};const layers=new Set([osm.layer,sat.layer,overlay]);
  const nodes=new Map();c.document.getElementById=id=>{if(!nodes.has(id))nodes.set(id,{classList:{add(){}},hidden:false});return nodes.get(id);};
  Object.assign(c,{baseDefs:[osm,sat],activeBaseDef:osm,activeBase:osm.layer,previousBaseDef:osm,baseTimer:null,baseGeneration:0,baseMeta:nodes.get('meta')||{classList:{add(){}}},clearTimeout(){},setTimeout(){},baseState(){},updateStatus(){},map:{hasLayer:l=>layers.has(l),removeLayer:l=>layers.delete(l),setMaxZoom(){}}});
  const start=source.indexOf('function selectBase(');vm.runInContext(source.slice(start,source.indexOf('function baseFailure(',start)),c);c.selectBase(sat);
  assert.equal(layers.has(osm.layer),false);assert.equal(layers.has(sat.layer),true);assert.equal(layers.has(overlay),true);
});

test('aerial failure stays explicit and offers streets without silently selecting them',()=>{
  const {context:c,messages}=sandbox();const ortho={id:'ortho',name:'Foto Aérea 2019'};const selected=[],nodes={baseFallback:{hidden:true},activeBaseLabel:{}};
  Object.assign(c,{activeBaseDef:ortho,baseTimer:null,clearTimeout(){},baseState(){},updateStatus(){},selectBase:d=>selected.push(d)});c.document.getElementById=id=>nodes[id];
  const start=source.indexOf('function baseFailure(');vm.runInContext(source.slice(start,source.indexOf('baseDefs.forEach(d=>{',start)),c);c.baseFailure(ortho);
  assert.equal(selected.length,0);assert.equal(nodes.baseFallback.hidden,false);assert.match(nodes.activeBaseLabel.textContent,/indisponível/);assert.equal(messages[0],'Foto Aérea 2019 indisponível no momento.');
});

test('partial aerial tile coverage remains available after the tile batch settles',()=>{
  const {context:c}=sandbox();const ortho={id:'ortho',loaded:true,failedTiles:2};let failures=0;
  c.activeBaseDef=ortho;c.baseFailure=()=>failures++;const start=source.indexOf('function settleBase(');vm.runInContext(source.slice(start,source.indexOf('baseDefs.forEach(d=>{',start)),c);
  c.settleBase(ortho);assert.equal(failures,0);ortho.loaded=false;c.settleBase(ortho);assert.equal(failures,1);c.activeBaseDef={};c.settleBase(ortho);assert.equal(failures,1);
});

test('territorial names use official attributes as text and skip unnamed features',()=>{
  const {context:c}=sandbox();let tooltip;const layer={feature:{properties:{tx_nome:'Icaraí <img onerror=x>'}},bindTooltip:(node,options)=>{tooltip={node,options};}};
  const start=source.indexOf('function bindTerritorialName(');vm.runInContext(source.slice(start,source.indexOf("bairros.on('createfeature'",start)),c);c.bindTerritorialName({layer},'neighborhood-label');
  assert.equal(tooltip.node.textContent,'Icaraí <img onerror=x>');assert.equal(tooltip.node.innerHTML,undefined);assert.equal(tooltip.options.permanent,true);tooltip=null;c.bindTerritorialName({layer:{feature:{properties:{}}}},'neighborhood-label');assert.equal(tooltip,null);
});

test('sheet dismissal only accepts a downward swipe on mobile',()=>{
  const {context:c}=sandbox();c.mobileMedia={matches:true};let closed=0;const handle=new Element('div');handle.setPointerCapture=()=>{};
  const start=source.indexOf('function dismissSheetOnSwipe(');vm.runInContext(source.slice(start,source.indexOf('dismissSheetOnSwipe(panel.',start)),c);c.dismissSheetOnSwipe(handle,()=>closed++);
  handle.listeners.pointerdown({clientY:100,pointerId:1});handle.listeners.pointerup({clientY:120});assert.equal(closed,0);handle.listeners.pointerdown({clientY:100,pointerId:1});handle.listeners.pointerup({clientY:170});assert.equal(closed,1);
  c.mobileMedia.matches=false;handle.listeners.pointerdown({clientY:100,pointerId:1});handle.listeners.pointerup({clientY:170});assert.equal(closed,1);
});

test('ordinary navigation clicks never query or create a marker; consultation requires intention',()=>{
  const {context:c}=sandbox();let callback,queries=0,mode='navigate';
  c.map={on:(name,fn)=>{callback=fn;}};c.ARPIASUI={mode:()=>mode,query:()=>queries++};
  vm.runInContext(source.split('\n').find(line=>line.startsWith("map.on('click'")),c);
  callback({latlng:{lat:-22.9,lng:-43.1}});assert.equal(queries,0);mode='measure';callback({latlng:{}});assert.equal(queries,0);mode='edit';callback({latlng:{}});assert.equal(queries,0);mode='consult';callback({latlng:{}});assert.equal(queries,1);
});
