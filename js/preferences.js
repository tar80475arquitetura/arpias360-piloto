/* Map preferences only; user drawings are stored independently by workspace.js. */
(function(root){
  const key='arpias360.preferences.v1';
  const windowIds=['toolPanel','aboutPanel','panel','territorialPanel','querySheet'];
  const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  function validate(value,layerIds,baseIds){
    if(!record(value)||value.version!==1)return null;
    const result={version:1,opacity:{},categories:{},windows:{}};
    if(baseIds.includes(value.base))result.base=value.base;
    if(Array.isArray(value.visible))result.visible=[...new Set(value.visible.filter(id=>layerIds.includes(id)))];
    if(value.workingLayer===null||layerIds.includes(value.workingLayer))result.workingLayer=value.workingLayer;
    if(typeof value.layersOpen==='boolean')result.layersOpen=value.layersOpen;
    if(record(value.opacity))for(const id of [...layerIds,...baseIds]){
      const n=value.opacity[id];if(typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1)result.opacity[id]=n;
    }
    if(record(value.categories))for(const [id,open] of Object.entries(value.categories)){
      if(/^[a-z][a-z0-9-]{0,49}$/.test(id)&&typeof open==='boolean')result.categories[id]=open;
    }
    if(record(value.windows))for(const id of windowIds){
      const pos=value.windows[id];
      if(record(pos)&&[pos.x,pos.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100000))result.windows[id]={x:pos.x,y:pos.y};
    }
    return result;
  }
  function read(storage,layerIds,baseIds){
    try{return validate(JSON.parse(storage.getItem(key)),layerIds,baseIds);}catch{return null;}
  }
  function write(storage,value,layerIds,baseIds){
    try{const clean=validate(value,layerIds,baseIds);if(!clean)return false;storage.setItem(key,JSON.stringify(clean));return true;}catch{return false;}
  }
  const api={key,windowIds,validate,read,write};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASPreferences=api;
})(typeof window==='object'?window:globalThis);
