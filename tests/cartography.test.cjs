const test=require('node:test');
const assert=require('node:assert/strict');
const cartography=require('../js/cartography.js');
test('operational vectors retain perceptible borders and transparent fills',()=>{
  for(const id of ['limite','bairros','hidro','zeis','zeia','appm','apa','comunidades','lotes']){
    const s=cartography.style(id);assert.ok(s.weight>=2.5&&s.weight<=4,id);assert.ok(s.fillOpacity<=.25,id);assert.match(s.className,/cartographic-path/);
  }
});
test('search, consultation, measurement and editing differ beyond color',()=>{
  assert.equal(cartography.selectionKind({origin:'search'}),'search');assert.equal(cartography.selectionKind({layerId:'lotes'}),'consult');
  assert.equal(cartography.style('consult').dashArray,undefined);
  assert.notEqual(cartography.style('search').dashArray,cartography.style('measure').dashArray);
  assert.notEqual(cartography.style('work').dashArray,cartography.style('editing').dashArray);
});
test('styles are isolated copies and reject references without integrated geometry',()=>{
  const style=cartography.style('bairros');style.weight=0;assert.equal(cartography.style('bairros').weight,2.5);
  assert.throws(()=>cartography.style('curvas-de-nivel'));assert.throws(()=>cartography.style('areas-alagaveis'));
});
test('point consultation draws an external hollow ring while search remains filled and dashed',()=>{
  const consult=cartography.selectionStyle({layerId:'sirenes'},'Point'),search=cartography.selectionStyle({origin:'search'},'Point');
  assert.equal(consult.radius,20);assert.equal(consult.fillOpacity,0);assert.equal(search.radius,10);assert.equal(search.fillOpacity,1);assert.ok(search.dashArray);
  assert.equal(cartography.selectionStyle({},'Polygon').fillOpacity,.04);
});
