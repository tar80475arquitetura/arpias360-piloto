(function(root){
  const geo=typeof module==='object'&&module.exports?require('./geometry.js'):root.ARPIASGeometry;
  const fields=['titulo','categoria','descricao','data','status','prioridade','source','observacoes'];
  function sanitizeFeature(feature){
    if(feature?.type!=='Feature'||!['Point','LineString','Polygon'].includes(feature.geometry?.type))throw Error('Feição de trabalho inválida');
    geo.validateGeometry(feature.geometry);
    const properties={};fields.forEach(key=>{const value=feature.properties?.[key];if(value!==undefined)properties[key]=String(value).slice(0,key==='descricao'||key==='observacoes'?2000:160);});
    if(!properties.titulo)throw Error('Título obrigatório');
    const result={type:'Feature',geometry:JSON.parse(JSON.stringify(feature.geometry)),properties};
    if(feature.arpiasOrigin){const o=feature.arpiasOrigin;if(!['lotes','logradouros'].includes(o.layer)||!['Polygon','LineString'].includes(o.geometry?.type))throw Error('Referência original inválida');geo.validateGeometry(o.geometry);result.arpiasOrigin={layer:o.layer,id:String(o.id??'Não informado').slice(0,160),source:String(o.source||'').slice(0,500),geometry:JSON.parse(JSON.stringify(o.geometry)),attributes:geo.publicProperties(o.attributes||{}) };}
    if(Array.isArray(feature.arpiasHistory))result.arpiasHistory=feature.arpiasHistory.slice(-100).filter(h=>['creation','edit','delete','restore','restore-original'].includes(h.action)&&typeof h.date==='string').map(h=>({action:h.action,date:h.date.slice(0,40)}));
    return result;
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
  function record(feature,action){const result=sanitizeFeature(feature);result.arpiasHistory=[...(result.arpiasHistory||[]),{action,date:new Date().toISOString()}].slice(-100);return result;}
  function copyOfficial(feature,layer,source){
    if(!['lotes','logradouros'].includes(layer)||!['Polygon','LineString'].includes(feature.geometry?.type))throw Error('Cópia controlada disponível para polígonos e linhas simples; multipartes ainda em integração.');
    const attributes=geo.publicProperties(feature.properties);
    return record({type:'Feature',geometry:feature.geometry,properties:{titulo:`Cópia de trabalho · ${layer}`,categoria:layer,status:'Não oficial',source,observacoes:'Geometria de trabalho / não oficial. Base oficial somente leitura.'},arpiasOrigin:{layer,id:feature.properties?.OBJECTID??feature.properties?.id,source,geometry:feature.geometry,attributes}},'creation');
  }
  function restoreOriginal(feature){const result=sanitizeFeature(feature);if(!result.arpiasOrigin)throw Error('Sem geometria original registrada');result.geometry=JSON.parse(JSON.stringify(result.arpiasOrigin.geometry));return record(result,'restore-original');}
  const api={copyOfficial,restoreOriginal,record,fields,sanitizeFeature,validateCollection,read,save};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASWork=api;
})(typeof window==='object'?window:globalThis);
