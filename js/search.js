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
  const api={normalize,matches,displayName};if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASSearch=api;
})(typeof window==='object'?window:globalThis);
