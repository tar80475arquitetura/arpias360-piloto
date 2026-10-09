(function(root){
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function validate(catalog){
    if(!catalog||!Array.isArray(catalog.groups)||!catalog.groups.length)throw Error('Catálogo inválido');
    const ids=new Set();
    catalog.groups.forEach(group=>{
      if(!group.id||ids.has(group.id)||!group.title||!Array.isArray(group.items)||!group.items.length)throw Error('Categoria inválida');
      ids.add(group.id);
      group.items.forEach(item=>{
        if(!item.name||!['integrated','available','future','unavailable'].includes(item.state)||!item.source)throw Error('Item inválido');
        if(item.state==='available'&&!item.url)throw Error('Dados disponíveis sem referência comprovada');
        if(item.state==='integrated'&&!item.control)throw Error('Integração sem controle real');
      });
    });
    return catalog;
  }
  function matches(item,group,query){
    const text=normalize([item.name,group.title,...(item.keywords||[]),...(item.control==='layer_appm'?['APP','proteção permanente']:[]),...(['market','cadastre'].includes(group.id)?['imóvel','imóveis']:[])].join(' '));
    return normalize(query).split(/\s+/).every(word=>text.includes(word));
  }
  // No catalogue entry has end-to-end validation tied to this release yet.
  // A control or URL is implementation evidence, never proof of availability.
  // Reviewed evidence is added here only after the protocol in docs/RODADA_02.md.
  // An empty register deliberately promotes nothing, including after mocked tests.
  const validations=Object.freeze({});
  function publicStatus(item,evidence=validations[item.control]){
    if(item.state==='future')return 'PLANEJADO';
    const validated=item.state==='integrated'&&item.control&&evidence?.control===item.control&&
      evidence.result==='passed'&&evidence.scope==='end-to-end'&&
      /^[a-f0-9]{40}$/.test(evidence.sha||'')&&/^\d{4}-\d{2}-\d{2}$/.test(evidence.date||'')&&
      /^https:\/\//.test(evidence.report||'')&&typeof evidence.reviewer==='string'&&evidence.reviewer.trim();
    return validated?'DISPONÍVEL':'EM INTEGRAÇÃO';
  }
  function operationalStatus(text){
    if(/falha|indisponível|erro/i.test(text))return 'Falha de carregamento · serviço inacessível ou não verificado';
    if(/^carregando/i.test(text))return 'Carregando';
    if(/^(disponível|carregado)$/i.test(text))return 'Carregado';
    return 'Aguardando carregamento';
  }
  function layerStatus(text,visible,opacity=1,item={state:'integrated'}){return publicStatus(item)+' · '+operationalStatus(text)+' · '+(visible?(opacity===0?'Camada no mapa · opacidade zero (não perceptível)':'Camada visível'):'Camada oculta');}
  const api={normalize,validate,matches,publicStatus,operationalStatus,layerStatus};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ARPIASCatalog=api;
})(typeof window==='object'?window:globalThis);
