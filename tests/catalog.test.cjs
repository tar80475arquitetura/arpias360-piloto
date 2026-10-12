const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../data/catalogo.json');
const api=require('../js/catalog.js');
test('a selected failed basemap never describes unavailable imagery as visible',()=>{
  const item={state:'integrated',control:'base_ortho'};
  const failed=api.layerStatus('Indisponível',true,1,item);
  assert.match(failed,/Falha de carregamento.*Mapa-base selecionado.*imagem não carregada/);assert.doesNotMatch(failed,/Camada visível/);
  assert.match(api.layerStatus('Disponível',true,0,item),/opacidade zero/);
  assert.match(api.layerStatus('Indisponível',false,1,item),/Camada oculta/);
});
test('partial imagery, successful empty data and zoom limits remain distinct operational states',()=>{
  assert.match(api.operationalStatus('Carregado parcialmente'),/parcialmente/);
  assert.match(api.operationalStatus('Sem feições nesta área'),/concluído.*nenhuma feição/);
  assert.match(api.operationalStatus('Aproxime o mapa para carregar esta camada'),/Aguardando aproximação/);
  assert.match(api.operationalStatus('Indisponível'),/Falha de carregamento/);
  assert.equal(api.operationalStatus('Carregando'),'Carregando');
});
test('empty and partial results never promote unvalidated catalog maturity or lose opacity and visibility',()=>{
  const item={state:'integrated',control:'layer_bairros'};
  for(const status of ['Sem feições nesta área','Carregado parcialmente','Indisponível']){
    const text=api.layerStatus(status,true,0,item);assert.match(text,/^EM INTEGRAÇÃO/);assert.match(text,/opacidade zero/);assert.doesNotMatch(text,/DISPONÍVEL/);
    assert.match(api.layerStatus(status,false,1,item),/Camada oculta/);
  }
});
test('experimental fragility architecture cannot expose fabricated scores or a map switch',()=>{
  const model=require('../config/fragilidade.json');const item=catalog.groups.find(g=>g.id==='fragility').items.find(i=>i.analysis==='fragility');
  assert.ok(item);assert.equal(item.state,'future');assert.equal(item.control,undefined);assert.equal(model.calculationEnabled,false);
  assert.equal(model.weights,null);assert.equal(model.formula,null);assert.equal(model.normalization,null);assert.equal(model.scale.thresholds,null);
  assert.equal(model.dimensions.length,7);model.dimensions.forEach(d=>{assert.ok(['available','partial','future'].includes(d.availability));assert.ok(d.source&&d.direction&&d.limitation);assert.equal(d.score,undefined);});
});
test('catalog has all fourteen non-empty thematic groups and valid source references',()=>{
  assert.equal(api.validate(catalog),catalog);assert.equal(catalog.groups.length,14);
  assert.deepEqual(catalog.groups.map(g=>g.id),['base','risk','territory','planning','environment','climate','market','security','social','infrastructure','cadastre','disaster','fragility','relief']);
});
const search=query=>catalog.groups.flatMap(g=>g.items.filter(i=>api.matches(i,g,query)).map(i=>i.name));
test('APP acronym finds the existing permanent-preservation control without fabricating a layer',()=>assert.ok(search('APP').includes('Áreas de Preservação Permanente')));
test('layer search supports accents, thematic groups and required synonyms',()=>{
  for(const [query,names] of [['sirene',['Sirenes de Alerta']],['chuva',['Rede Municipal de Pluviometria','Cemaden','Precipitação']],['lote',['Lotes Cadastrais']],['ITBI',['Transações Imobiliárias / ITBI 2020','Transações Imobiliárias / ITBI 2025']],['seguranca',['Delegacias','Indicadores ISP']],['curva',['Curvas de Nível']],['alag',['Áreas Alagáveis','Ocorrências de Inundação e Alagamento']]]){
    const found=search(query);names.forEach(name=>assert.ok(found.includes(name),`${query}: ${name}`));
  }
  assert.equal(search('termo inexistente').length,0);
  assert.ok(search('imóvel').includes('Lotes Cadastrais'));assert.ok(search('imovel').includes('Transações Imobiliárias / ITBI 2025'));
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

test('GIS uncertainty, loading, empty results and failure retain separate presentation and maturity',()=>{
  const item={state:'integrated',control:'layer_bairros'};
  const expected=[['Aguardando carregamento','Aguardando carregamento'],['Carregando','Carregando'],['Sem feições nesta área','Carregamento concluído · nenhuma feição encontrada nesta área'],['Indisponível','Falha de carregamento · serviço inacessível ou não verificado']];
  for(const [raw,status]of expected){
    assert.equal(api.operationalStatus(raw),status);
    for(const [visible,opacity]of [[true,1],[true,0],[false,1]]){
      const text=api.layerStatus(raw,visible,opacity,item);assert.ok(text.startsWith('EM INTEGRAÇÃO · '+status));assert.doesNotMatch(text,/DISPONÍVEL/);
      assert.ok(text.endsWith(!visible?'Camada oculta':opacity===0?'Camada no mapa · opacidade zero (não perceptível)':'Camada visível'));
    }
  }
});
