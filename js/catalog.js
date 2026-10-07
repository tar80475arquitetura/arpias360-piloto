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
  function publicStatus(item){if(item.analysis==='fragility'||item.displayStatus==='METODOLOGIA EM DESENVOLVIMENTO')return 'METODOLOGIA EM DESENVOLVIMENTO';return item.state==='integrated'&&item.control?'DISPONÍVEL NO MAPA':item.state==='available'?'FONTE IDENTIFICADA':'EM INTEGRAÇÃO';}
  function operationalStatus(text){if(/indisponível|falha/i.test(text))return '× EM INTEGRAÇÃO';if(/carregando/i.test(text))return '◐ Carregando…';if(/disponível|funcional/i.test(text))return '● DISPONÍVEL NO MAPA';return '◐ EM INTEGRAÇÃO';}
  const api={normalize,validate,matches,publicStatus,operationalStatus};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ARPIASCatalog=api;
})(typeof window==='object'?window:globalThis);
