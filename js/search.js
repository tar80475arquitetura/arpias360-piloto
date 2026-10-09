(function(root){
  function normalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');}
  // Presentation spellings requested for known neighborhoods; raw source fields remain intact.
  const labels={'niteroi':'Niterói','gragoata':'Gragoatá','icarai':'Icaraí','sao francisco':'São Francisco','ititioca':'Ititioca','jurujuba':'Jurujuba','vital brazil':'Vital Brazil','engenhoca':'Engenhoca','engenho do mato':'Engenho do Mato','rio do ouro':'Rio do Ouro','maria paula':'Maria Paula','piratininga':'Piratininga'};
  function displayName(name){return labels[normalize(name)]||name;}
  function matches(features,term){
    const query=normalize(term);if(!query)return [];
    const groups=new Map();
    features.forEach(feature=>{
      const p=feature.properties||{},name=p.tx_nome||p.NOME||p.Nome||p.tx_obs;
      if(!name||!normalize(`${name} ${p.tx_obs||''}`).includes(query))return;
      const key=normalize(name);if(!groups.has(key))groups.set(key,{name:displayName(name),sourceName:name,features:[]});groups.get(key).features.push(feature);
    });
    const exact=groups.get(query);return exact?[exact]:[...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  }
  function selectionFeature(result){
    const geo=typeof module==='object'&&module.exports?require('./geometry.js'):root.ARPIASGeometry;
    if(!result?.features?.length)throw Error('Bairro sem geometria');
    const features=JSON.parse(JSON.stringify(result.features));
    features.forEach(f=>{if(f.type!=='Feature'||!['Polygon','MultiPolygon'].includes(f.geometry?.type))throw Error('Geometria de bairro não suportada');geo.validateGeometry(f.geometry);});
    if(features.length===1)return features[0];
    // Preserve every ring/component. No union, clipping or changes to source data.
    const coordinates=features.flatMap(f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates);
    const properties=Object.fromEntries(Object.entries(features[0].properties||{}).filter(([key,value])=>features.every(f=>JSON.stringify(f.properties?.[key])===JSON.stringify(value))));
    const feature={type:'Feature',properties,geometry:{type:'MultiPolygon',coordinates}};
    geo.validateGeometry(feature.geometry);return feature;
  }
  const api={normalize,matches,displayName,selectionFeature};if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASSearch=api;
})(typeof window==='object'?window:globalThis);
