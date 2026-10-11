/* Navigation contexts only: no layer state, data, scores or authorization. */
(function(root){
  const key='arpias360.portal.v1';
  const modes=[
    {id:'resilience',title:'Resiliência Ambiental',icon:'M4 20V10l8-7 8 7v10M8 20v-6h8v6M3 8l4-3M17 5l4 3',description:'Explore riscos ambientais e climáticos, suscetibilidade, geomorfologia, Defesa Civil, prevenção e fragilidade urbana.',groups:['risk','environment','climate','relief','disaster','fragility','infrastructure']},
    {id:'territorial',title:'Ordem Territorial',icon:'M3 21V8h7v13M10 21V3h7v18M17 21V12h4v9M6 11v2M13 7v2M13 12v2',description:'Explore segurança pública, acessibilidade, infraestrutura, serviços, governança e indicadores socioeconômicos. As fontes planejadas continuam identificadas no catálogo.',groups:['territory','planning','security','infrastructure','social','cadastre']},
    {id:'integrated',title:'Análise Integrada',icon:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6M9 3v15M15 6v15',description:'Relacione leituras ambientais, territoriais, urbanas, socioeconômicas e imobiliárias. A Jornada Territorial 001 está prevista para uma etapa futura.',groups:['territory','environment','social','market','planning','fragility']},
    {id:'free',title:'Mapa Livre',icon:'M3 7l9-5 9 5-9 5-9-5M3 12l9 5 9-5M3 17l9 5 9-5',description:'Acesse o WebGIS completo e organize sua exploração com todas as categorias, camadas e ferramentas.',groups:[]}
  ];
  const profiles=['citizen','manager','business','researcher'];
  function mode(id){return modes.find(m=>m.id===id)||modes[3];}
  function validate(value){
    if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1)return null;
    return {version:1,mode:modes.some(m=>m.id===value.mode)?value.mode:'free',profile:profiles.includes(value.profile)?value.profile:''};
  }
  function read(storage){try{return validate(JSON.parse(storage.getItem(key)));}catch{return null;}}
  function write(storage,value){try{const clean=validate(value);if(!clean)return false;storage.setItem(key,JSON.stringify(clean));return true;}catch{return false;}}
  // Reuse the coordinate-link contract. Never rewrite the URL or its parameters.
  function directLink(params,locationAPI){return locationAPI.parse(params)!==null;}
  function order(ids,id){const priority=mode(id).groups;return [...ids].sort((a,b)=>{
    const rank=x=>priority.includes(x)?priority.indexOf(x):priority.length;
    return rank(a)-rank(b);
  });}
  const api={key,modes,profiles,mode,validate,read,write,directLink,order};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASPortal=api;
})(typeof window==='object'?window:globalThis);
