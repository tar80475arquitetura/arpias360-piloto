const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
class Element{
  constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.textContent='';}
  append(...nodes){this.children.push(...nodes);}
  addEventListener(name,fn){this.listeners[name]=fn;}
}
function sandbox(){
  const messages=[];
  const context=vm.createContext({document:{createElement:tag=>new Element(tag)},navigator:{},toast:m=>messages.push(m),AbortSignal,fetch:async()=>({ok:true,json:async()=>({})}),console:{error(){}},civilMessage:new Element('div')});
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
