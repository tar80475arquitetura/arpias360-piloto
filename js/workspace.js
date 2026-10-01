(function(root){
  const geo=typeof module==='object'&&module.exports?require('./geometry.js'):root.ARPIASGeometry;
  const fields=['titulo','categoria','descricao','data','status','prioridade','source','observacoes'];
  function sanitizeFeature(feature){
    if(feature?.type!=='Feature'||!['Point','LineString','Polygon'].includes(feature.geometry?.type))throw Error('Feição de trabalho inválida');
    geo.validateGeometry(feature.geometry);
    const properties={};fields.forEach(key=>{const value=feature.properties?.[key];if(value!==undefined)properties[key]=String(value).slice(0,key==='descricao'||key==='observacoes'?2000:160);});
    if(!properties.titulo)throw Error('Título obrigatório');
    return {type:'Feature',geometry:JSON.parse(JSON.stringify(feature.geometry)),properties};
  }
  function validateCollection(collection){
    if(collection?.type!=='FeatureCollection'||!Array.isArray(collection.features)||collection.features.length>500)throw Error('Coleção de trabalho inválida');
    return {type:'FeatureCollection',features:collection.features.map(sanitizeFeature)};
  }
  function read(storage){
    const raw=storage.getItem('arpias360.workspace.v1');if(!raw)return {type:'FeatureCollection',features:[]};
    if(raw.length>3000000)throw Error('Coleção local muito grande');return validateCollection(JSON.parse(raw));
  }
  function save(storage,collection){const data=validateCollection(collection);storage.setItem('arpias360.workspace.v1',JSON.stringify(data));return data;}
  const api={fields,sanitizeFeature,validateCollection,read,save};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASWork=api;
})(typeof window==='object'?window:globalThis);
