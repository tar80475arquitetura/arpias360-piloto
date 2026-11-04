/* Navigation contexts only: no layer state, data, scores or authorization. */
(function(root){
  const key='arpias360.portal.v1';
  const modes=[
    {id:'market',title:'Mercado Imobiliário',subtitle:'Pesquisa e Índices',color:'#D4A64A',icon:'M3 21V4h10v17M13 9h8v12M6 8h3M6 12h3M6 16h3M16 13h2M16 17h2',description:'Pesquisa territorial, cadastro, infraestrutura e indicadores imobiliários. Dados e índices somente com fontes identificadas.',groups:['market','cadastre','planning','territory','infrastructure','social']},
    {id:'civil',title:'Defesa Civil',subtitle:'Fragilidade Ambiental',color:'#F28C28',icon:'M12 3 2 21h20L12 3M12 9v5M12 18v.1',description:'Riscos ambientais, prevenção, sirenes, pluviômetros, pontos de apoio e resiliência urbana.',groups:['risk','disaster','fragility','climate','environment','relief']},
    {id:'police',title:'Policial',subtitle:'Ordem Territorial',color:'#438CF5',icon:'M12 2 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6zM9 12l2 2 4-4',description:'Segurança territorial, acessibilidade, equipamentos e infraestrutura pública com dados abertos.',groups:['security','territory','infrastructure','social','planning','cadastre']},
    {id:'armed',title:'Forças Armadas',subtitle:'Segurança Nacional',color:'#3DAE57',icon:'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 3v9l6 6M12 12h9',description:'Infraestrutura, mobilidade, logística e resiliência territorial com dados públicos.',groups:['infrastructure','territory','risk','relief','climate','planning']},
    {id:'public',title:'Gestão Pública',subtitle:'Estadual e Municipal',color:'#A78BFA',icon:'M3 10h18M5 10V20M10 10V20M14 10V20M19 10V20M2 21h20M12 2 2 8h20z',description:'Planejamento, serviços, cadastro territorial, políticas públicas e indicadores de desenvolvimento.',groups:['planning','territory','cadastre','social','infrastructure','market']},
    {id:'free',title:'Mapa Livre',subtitle:'Catálogo completo',color:'#6EBAA4',icon:'M3 7l9-5 9 5-9 5-9-5M3 12l9 5 9-5M3 17l9 5 9-5',description:'Acesse o WebGIS completo, preservando todas as categorias e ferramentas.',groups:[]}
  ];
  const legacy={resilience:'civil',territorial:'police',integrated:'public'};
  const profiles=['citizen','manager','business','researcher'];
  function mode(id){return modes.find(m=>m.id===(legacy[id]||id))||modes[5];}
  function validate(value){
    if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1)return null;
    return {version:1,mode:mode(value.mode).id,profile:profiles.includes(value.profile)?value.profile:''};
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
