const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../js/search.js');
const names=['Gragoatá','Icaraí','São Francisco','Ititioca','Jurujuba','Vital Brazil','Engenhoca','Engenho do Mato','Rio do Ouro','Maria Paula','Piratininga'];
const features=names.map(name=>({properties:{tx_nome:name}}));
test('territorial search ignores accents, case and repeated spaces while preserving official labels',()=>{
  for(const name of names){const term=api.normalize(name).toUpperCase().replace(/ /g,'   ');const result=api.matches(features,`  ${term}  `);assert.equal(result.length,1);assert.equal(result[0].name,name);}
});
test('partial searches return all alternatives instead of silently selecting an ambiguous neighborhood',()=>{
  assert.deepEqual(api.matches(features,'engenho').map(r=>r.name),['Engenho do Mato','Engenhoca']);
  assert.equal(api.matches(features,'francisco')[0].name,'São Francisco');assert.equal(api.matches(features,'vital')[0].name,'Vital Brazil');
  assert.deepEqual(api.matches(features,'inexistente'),[]);assert.deepEqual(api.matches(features,'  '),[]);
});
test('normalization does not mutate source attributes and duplicate geometry names remain grouped',()=>{
  const original=JSON.stringify(features);const result=api.matches([...features,features[0]],'gragoata');assert.equal(result.length,1);assert.equal(result[0].features.length,2);assert.equal(JSON.stringify(features),original);
});
test('known presentation accents never overwrite unaccented source values',()=>{
  const input=[{properties:{tx_nome:'Gragoata'}}];const result=api.matches(input,'GRAGOATÁ');assert.equal(result[0].name,'Gragoatá');assert.equal(result[0].sourceName,'Gragoata');assert.equal(input[0].properties.tx_nome,'Gragoata');assert.equal(api.displayName('Nome não mapeado'),'Nome não mapeado');
});
