const test=require('node:test');
const assert=require('node:assert/strict');
const geo=require('../js/geometry.js');
const work=require('../js/workspace.js');
const polygon=(rings)=>({type:'Feature',geometry:{type:'Polygon',coordinates:rings},properties:{titulo:'Teste'}});
test('geographic length and area match known equatorial reference values',()=>{
  const line={type:'Feature',geometry:{type:'LineString',coordinates:[[0,0],[1,0]]},properties:{}};
  assert.ok(Math.abs(geo.metrics(line).length-111195.0802335329)<.001);
  const square=polygon([[[0,0],[1,0],[1,1],[0,1],[0,0]]]);const m=geo.metrics(square);
  assert.ok(Math.abs(m.area-12363718145.18)<1);assert.ok(m.perimeter>444700&&m.perimeter<444800);assert.equal(m.lat,.5);assert.equal(m.lon,.5);
});
test('polygon holes subtract area and contribute to perimeter',()=>{
  const outer=[[0,0],[2,0],[2,2],[0,2],[0,0]],hole=[[.5,.5],[1.5,.5],[1.5,1.5],[.5,1.5],[.5,.5]];
  const a=geo.metrics(polygon([outer])),h=geo.metrics(polygon([hole])),both=geo.metrics(polygon([outer,hole]));
  assert.ok(Math.abs(both.area-(a.area-h.area))<.01);assert.ok(Math.abs(both.perimeter-(a.perimeter+h.perimeter))<.001);
});
test('polygon reference is its area centroid rather than a vertex average',()=>{
  const m=geo.metrics(polygon([[[0,0],[4,0],[2,2],[0,2],[0,0]]]));assert.ok(Math.abs(m.lon-14/9)<1e-12);assert.ok(Math.abs(m.lat-8/9)<1e-12);
  const f={type:'Feature',geometry:{type:'MultiPolygon',coordinates:[[[[0,0],[1,0],[1,1],[0,1],[0,0]]],[[[2,0],[3,0],[3,1],[2,1],[2,0]]]]},properties:{}};
  assert.ok(Math.abs(geo.metrics(f).lon-1.5)<1e-10);
});
test('point metrics never fabricate area or length and distances are geographic',()=>{
  const m=geo.metrics({type:'Feature',geometry:{type:'Point',coordinates:[-43.1,-22.9]},properties:{}});assert.equal(m.area,undefined);assert.equal(m.length,undefined);assert.equal(m.lat,-22.9);assert.equal(m.lon,-43.1);
  assert.equal(geo.distance([-43.1,-22.9],[-43.1,-22.9]),0);
});
test('invalid and unclosed geometry is rejected before calculations or storage',()=>{
  for(const geometry of [{type:'Point',coordinates:[181,0]},{type:'LineString',coordinates:[[0,0]]},{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1]]]},{type:'Polygon',coordinates:[]},{type:'Point',coordinates:[NaN,0]}])assert.throws(()=>geo.validateGeometry(geometry));
});
test('public attribute groups humanize existing fields and exclude personal fields',()=>{
  const rows=geo.publicAttributes({INSCRICAO:'001',AREA_TOTAL_LOTE:350,padrao_construcao:'Original',nome_proprietario:'Privado',CPF:'123',telefone:'999',email:'secreto',mystery:'X'}).flatMap(g=>g.rows);
  assert.ok(rows.some(row=>row[0]==='Inscrição imobiliária'&&row[1]==='001'));assert.ok(rows.some(row=>row[0]==='Área total do lote'&&row[1]==='350'));assert.equal(rows.length,3);
});
test('working collections reject official multigeometries and retain only editable properties',()=>{
  const f={type:'Feature',geometry:{type:'Point',coordinates:[-43.1,-22.9]},properties:{titulo:'<img onerror=x>',CPF:'123',descricao:'texto',nome_proprietario:'Privado'}};
  const result=work.validateCollection({type:'FeatureCollection',features:[f]});assert.equal(result.features[0].properties.titulo,f.properties.titulo);assert.equal(result.features[0].properties.CPF,undefined);assert.notEqual(result.features[0].geometry,f.geometry);
  assert.throws(()=>work.sanitizeFeature({...f,geometry:{type:'MultiPolygon',coordinates:[]}}));assert.throws(()=>work.sanitizeFeature({...f,properties:{}}));
});
test('local storage round-trips, detects corruption and never silently overwrites it',()=>{
  const values=new Map();const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const c={type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[-43,-23]},properties:{titulo:'Anotação'}}]};
  work.save(storage,c);assert.deepEqual(work.read(storage),c);storage.setItem('arpias360.workspace.v1','invalid');assert.throws(()=>work.read(storage));assert.equal(storage.getItem('arpias360.workspace.v1'),'invalid');
});
test('CSV exports quote values and neutralize spreadsheet formulas',()=>{
  const c={type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[-43,-23]},properties:{titulo:'=HYPERLINK("bad")',categoria:'A,B'}}]};
  const csv=geo.csv(c);assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));assert.ok(csv.includes('"A,B"'));
});
