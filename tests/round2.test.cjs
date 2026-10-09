const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const search=require('../js/search.js'),geo=require('../js/geometry.js'),work=require('../js/workspace.js'),catalog=require('../js/catalog.js');
const part=x=>({type:'Feature',properties:{tx_nome:'Bairro teste',OBJECTID:x},geometry:{type:'Polygon',coordinates:[[[x,0],[x+1,0],[x+1,1],[x,1],[x,0]]]}});
test('single neighborhood preserves geometry and attributes without mutating the source',()=>{const f=part(0),copy=search.selectionFeature({features:[f]});assert.deepEqual(copy,f);copy.geometry.coordinates[0][0][0]=9;assert.equal(f.geometry.coordinates[0][0][0],0)});
test('multipart neighborhood keeps every polygon and hole with additive metrics and common attributes',()=>{const a=part(0),b=part(3);b.geometry={type:'MultiPolygon',coordinates:[b.geometry.coordinates]};const input=[a,b],before=JSON.stringify(input),f=search.selectionFeature({features:input});assert.equal(f.geometry.type,'MultiPolygon');assert.equal(f.geometry.coordinates.length,2);assert.equal(f.properties.tx_nome,'Bairro teste');assert.equal(f.properties.OBJECTID,undefined);const m=geo.metrics(f);assert.ok(Math.abs(m.area-geo.metrics(a).area-geo.metrics(b).area)<.01);assert.ok(Math.abs(m.perimeter-geo.metrics(a).perimeter-geo.metrics(b).perimeter)<.01);assert.equal(JSON.stringify(input),before);assert.throws(()=>work.copyOfficial(f,'lotes','GeoNit'),/multipartes/)});
test('unsupported or invalid neighborhood parts fail explicitly',()=>{for(const features of [[],[{type:'Feature',geometry:{type:'Point',coordinates:[0,0]}}],[{...part(0),geometry:{type:'Polygon',coordinates:[]}}]])assert.throws(()=>search.selectionFeature({features}))});
test('actual neighborhood selection frames and selects the same complete geometry',()=>{let framed,selected;const ctx={searchGeneration:1,placeResults:{},clearHighlights(){},closeLayers(){},ARPIASSearch:search,toast:assert.fail,L:{geoJSON:f=>({getBounds:()=>f.geometry})},map:{fitBounds:b=>framed=b},ARPIASUI:{select:f=>selected=f}};vm.createContext(ctx);const s=fs.readFileSync('js/app.js','utf8');vm.runInContext(s.slice(s.indexOf('function chooseNeighborhood('),s.indexOf('function clearHighlights(')),ctx);ctx.chooseNeighborhood({features:[part(0),part(3)],name:'Bairro'},1);assert.equal(selected.geometry,framed);assert.equal(framed.coordinates.length,2)});
test('catalogue maturity never derives availability from controls or URLs',()=>{for(const state of ['integrated','available','unavailable'])assert.equal(catalog.publicStatus({state,control:'x',url:'https://example.test'}),'EM INTEGRAÇÃO');assert.equal(catalog.publicStatus({state:'future',analysis:'fragility'}),'PLANEJADO')});
test('temporary loading error visibility and zero opacity remain independent of maturity',()=>{assert.match(catalog.layerStatus('Carregando',true),/EM INTEGRAÇÃO.*Carregando/);assert.match(catalog.layerStatus('Indisponível',false),/Falha de carregamento.*oculta/);assert.match(catalog.layerStatus('Disponível',true,0),/Carregado.*não perceptível/);assert.match(catalog.layerStatus('Aguardando carregamento',false),/Aguardando carregamento.*oculta/)});
test('catalogue counts and repeated controls remain reconciled without scientific data changes',()=>{const c=require('../data/catalogo.json'),items=c.groups.flatMap(g=>g.items);assert.equal(c.groups.length,14);assert.equal(items.length,124);assert.equal(items.filter(i=>i.control).length,18);assert.equal(new Set(items.filter(i=>i.control).map(i=>i.control)).size,15);assert.equal(items.filter(i=>catalog.publicStatus(i)==='PLANEJADO').length,80);assert.equal(items.filter(i=>catalog.publicStatus(i)==='EM INTEGRAÇÃO').length,44)});
test('availability requires reviewed end-to-end evidence for the exact control',()=>{
 const item={state:'integrated',control:'layer_relevo'},e={control:item.control,result:'passed',scope:'end-to-end',sha:'a'.repeat(40),date:'2026-10-09',report:'https://example.test/runs/1',reviewer:'Revisor'};
 assert.equal(catalog.publicStatus(item,e),'DISPONÍVEL');
 for(const key of Object.keys(e)){const incomplete={...e};delete incomplete[key];assert.equal(catalog.publicStatus(item,incomplete),'EM INTEGRAÇÃO',key);}
 assert.equal(catalog.publicStatus({...item,state:'future'},e),'PLANEJADO');
 assert.equal(catalog.publicStatus(item,{...e,control:'layer_bairros'}),'EM INTEGRAÇÃO');
 assert.equal(catalog.publicStatus(item,{...e,scope:'mocked-browser'}),'EM INTEGRAÇÃO');
});
test('multipart neighborhoods retain inner rings and sum hole-adjusted area and perimeter',()=>{
 const a=part(0),b=part(3);a.geometry.coordinates.push([[.2,.2],[.2,.4],[.4,.4],[.4,.2],[.2,.2]]);
 const before=JSON.stringify([a,b]),f=search.selectionFeature({features:[a,b]}),m=geo.metrics(f);
 assert.equal(f.geometry.coordinates[0].length,2);assert.deepEqual(f.geometry.coordinates[0][1],a.geometry.coordinates[1]);
 assert.ok(Math.abs(m.area-geo.metrics(a).area-geo.metrics(b).area)<.01);
 assert.ok(Math.abs(m.perimeter-geo.metrics(a).perimeter-geo.metrics(b).perimeter)<.01);
 assert.ok(m.area<geo.metrics(part(0)).area+geo.metrics(b).area);assert.equal(JSON.stringify([a,b]),before);
});
