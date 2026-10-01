const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../data/catalogo.json');
const api=require('../js/catalog.js');
test('catalog has all thirteen non-empty thematic groups and valid source references',()=>{
  assert.equal(api.validate(catalog),catalog);assert.equal(catalog.groups.length,13);
  assert.deepEqual(catalog.groups.map(g=>g.id),['base','risk','territory','planning','environment','climate','market','security','social','infrastructure','cadastre','disaster','fragility']);
});
const search=query=>catalog.groups.flatMap(g=>g.items.filter(i=>api.matches(i,g,query)).map(i=>i.name));
test('layer search supports accents, thematic groups and required synonyms',()=>{
  for(const [query,names] of [['sirene',['Sirenes de Alerta']],['chuva',['Rede Municipal de Pluviometria','Cemaden','Precipitação']],['lote',['Lotes Cadastrais']],['ITBI',['Transações Imobiliárias / ITBI 2020','Transações Imobiliárias / ITBI 2025']],['seguranca',['Delegacias','Indicadores ISP']],['curva',['Curvas de Nível']],['alag',['Áreas Alagáveis','Ocorrências de Inundação e Alagamento']]]){
    const found=search(query);names.forEach(name=>assert.ok(found.includes(name),`${query}: ${name}`));
  }
  assert.equal(search('termo inexistente').length,0);
});
test('functional catalog references are restricted to existing application controls',()=>{
  const app=fs.readFileSync(require.resolve('../js/app.js'),'utf8');
  const ids=new Set([...app.matchAll(/id:'([^']+)'/g)].map(match=>match[1]));
  catalog.groups.flatMap(g=>g.items).filter(i=>i.state==='integrated').forEach(item=>{
    assert.ok(ids.has(item.control.replace(/^(base|layer)_/,'')),item.control);
  });
});
test('unverified future layers never receive map controls; rainfall sources remain distinct',()=>{
  const items=catalog.groups.flatMap(g=>g.items);items.filter(i=>i.state!=='integrated').forEach(i=>assert.equal(i.control,undefined));
  const cemaden=items.find(i=>i.name==='Cemaden');assert.equal(cemaden.state,'future');
  items.filter(i=>i.name==='Rede Municipal de Pluviometria').forEach(i=>{assert.equal(i.count,38);assert.match(i.source,/Defesa Civil/);assert.doesNotMatch(i.source,/Cemaden/);});
  for(const name of ['Obras de Contenção / Obras de Encosta','Danos Informados','Unidades de Segurança Pública'])assert.equal(items.find(i=>i.name===name).state,'future');
});
test('invalid catalogs fail explicitly rather than creating empty or false-functional groups',()=>{
  for(const bad of [{groups:[]},{groups:[{id:'a',title:'A',items:[]}]},{groups:[{id:'a',title:'A',items:[{name:'A',source:'X',state:'available'}]}]},{groups:[{id:'a',title:'A',items:[{name:'A',source:'X',state:'integrated'}]}]}])assert.throws(()=>api.validate(bad));
});
