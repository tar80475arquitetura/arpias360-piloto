/* Context controls reuse the existing layer definitions and consultation tools. */
const ARPIASOperations=(()=>{
  const byId=id=>document.getElementById(id);
  const definitions=[...overlayDefs,...civilDefs,...reliefDefs];
  const layerIds=definitions.map(d=>d.id),baseIds=baseDefs.map(d=>d.id);
  let storage=null;try{storage=window.localStorage;}catch{/* Private browsing can deny access. */}
  const saved=ARPIASPreferences.read(storage,layerIds,baseIds);
  let working=null,restoring=true,fitGeneration=0,saveTimer,storageWarning=false;
  const windows={...(saved?.windows||{})};
  const categoryKey=section=>section.dataset.group||({baseAccordion:'base',workAccordion:'work'}[section.id]);
  function save(){
    if(restoring)return;
    const categories={};
    document.querySelectorAll('.panel-scroll details.accordion').forEach(section=>{
      const key=categoryKey(section);if(key)categories[key]=section.dataset.wasOpen===undefined?section.open:section.dataset.wasOpen==='true';
    });
    const opacity=Object.fromEntries([...definitions,...baseDefs].map(d=>[d.id,d.opacity??1]));
    const value={version:1,base:activeBaseDef.id,visible:definitions.filter(d=>d.input.checked).map(d=>d.id),opacity,workingLayer:working?.id||null,layersOpen:!panel.classList.contains('hidden'),categories,windows};
    if(!ARPIASPreferences.write(storage,value,layerIds,baseIds)&&!storageWarning){storageWarning=true;toast('Preferências válidas nesta sessão; armazenamento local indisponível.');}
  }
  function scheduleSave(){if(restoring)return;clearTimeout(saveTimer);saveTimer=setTimeout(save,150);}
  function sync(){
    definitions.forEach(d=>d.syncOperationalState());
    document.querySelectorAll('.layer-control[data-layer-id]').forEach(row=>{
      const active=row.dataset.layerId===working?.id;row.dataset.working=String(active);
      row.querySelector('.layer-target')?.setAttribute('aria-pressed',String(active));
    });
    if(!working)return;
    byId('workingVisibility').textContent=working.input.checked?'Ocultar camada':'Ativar camada';
    byId('workingVisibility').setAttribute('aria-pressed',String(working.input.checked));
    byId('workingLayerStatus').textContent=layerPresentation('layer_'+working.id);
    const range=byId('workingOpacity').querySelector('input');
    if(range){range.value=String(Math.round((working.opacity??1)*100));byId('workingOpacity').querySelector('output').textContent=range.value+'%';}
  }
  function choose(id){
    fitGeneration++;working=definitions.find(d=>d.id===id)||null;
    byId('workingLayerPanel').dataset.layerId=working?.id||'';
    byId('workingLayerControls').hidden=!working;byId('workingLayerHint').hidden=!!working;
    byId('workingOpacity').replaceChildren();
    if(working){byId('workingLayerName').textContent=working.name;appendOpacity(byId('workingOpacity'),working);}
    if(ARPIASUI.mode()==='consult')ARPIASUI.setQueryLayer(working?.id||null);
    sync();scheduleSave();
  }
  async function ensureLayer(d){
    if(civilDefs.includes(d))return loadCivil(d);
    if(reliefDefs.includes(d))return loadRelief();
    return d.layer;
  }
  async function fitWorking(){
    if(!working)return;const d=working,token=++fitGeneration;
    byId('workingLayerStatus').textContent='Obtendo extensão da camada…';
    try{
      let bounds;
      if(overlayDefs.includes(d)){
        bounds=await new Promise((resolve,reject)=>{
          let finished=false;
          const timer=setTimeout(()=>{finished=true;reject(Error('Serviço indisponível. Tente enquadrar novamente.'));},12000);
          d.layer.query().where('1=1').bounds((error,result)=>{
            if(finished)return;finished=true;clearTimeout(timer);
            if(error)reject(Error('Serviço indisponível. Tente enquadrar novamente.'));else resolve(result);
          });
        });
      }else bounds=(await ensureLayer(d))?.getBounds();
      if(token!==fitGeneration)return;
      if(!bounds?.isValid())throw Error('Extensão indisponível. Tente novamente.');
      if(matchMedia('(max-width:1199px)').matches){closeLayers();ARPIASUI.closeTerritorial();}
      resizeMap();map.fitBounds(bounds,{padding:[32,32],maxZoom:17});sync();
      toast(d.name+': extensão enquadrada.');
    }catch(error){if(token===fitGeneration){byId('workingLayerStatus').textContent=error.message;toast(error.message);}}
  }
  document.addEventListener('arpias:working-layer',e=>{choose(e.detail);byId('workingLayerPanel').scrollIntoView({block:'nearest'});});
  byId('clearWorkingLayer').addEventListener('click',()=>choose(null));
  byId('workingVisibility').addEventListener('click',()=>working?.input.click());
  byId('workingInfo').addEventListener('click',()=>working?.row.querySelector('.info-button')?.click());
  byId('workingFit').addEventListener('click',fitWorking);
  byId('workingConsult').addEventListener('click',async()=>{
    const d=working;if(!d)return;
    if(reliefDefs.includes(d)&&!await ensureLayer(d))return;
    if(working!==d||!await ARPIASUI.request('consult'))return;
    if(working===d)ARPIASUI.setQueryLayer(d.id);
  });
  definitions.forEach(d=>new MutationObserver(sync).observe(d.status,{childList:true,subtree:true,characterData:true}));
  document.addEventListener('arpias:opacity',()=>{sync();refreshCatalogStates();scheduleSave();});
  panel.addEventListener('change',()=>{sync();refreshCatalogStates();scheduleSave();});
  panel.addEventListener('toggle',e=>{if(e.target.matches('.accordion'))scheduleSave();},true);
  new MutationObserver(scheduleSave).observe(panel,{attributes:true,attributeFilter:['class']});
  ['clearBtn','clearLayersBtn'].forEach(id=>byId(id).addEventListener('click',()=>{sync();scheduleSave();}));
  map.on('layerremove',()=>{sync();refreshCatalogStates();});
  map.on('layeradd',e=>{
    if(baseDefs.some(item=>item.layer===e.layer))scheduleSave();
    const d=definitions.find(item=>item.layer===e.layer);
    if(d){applyLayerOpacity(d,d.opacity??1);sync();}
  });
  function restoreCategories(){
    document.querySelectorAll('.panel-scroll details.accordion').forEach(section=>{
      const key=categoryKey(section);if(typeof saved?.categories[key]==='boolean')section.open=saved.categories[key];
    });sync();
  }
  document.addEventListener('arpias:catalog-ready',restoreCategories);
  function restoreWindows(){
    for(const [id,pos] of Object.entries(windows)){
      const node=byId(id);if(!node||node.hidden||node.classList.contains('hidden')||node.classList.contains('is-dragging'))continue;
      const frame=node.offsetParent||mapwrap;
      const x=Math.max(8,Math.min(pos.x,frame.clientWidth-node.offsetWidth-8));
      const y=Math.max(8,Math.min(pos.y,frame.clientHeight-node.offsetHeight-8));
      Object.assign(node.style,{left:x+'px',top:y+'px',right:'auto',bottom:'auto',transform:'none'});
    }
  }
  document.addEventListener('arpias:panel-moved',e=>{
    const node=byId(e.detail);if(!node||!ARPIASPreferences.windowIds.includes(node.id))return;windows[node.id]={x:parseFloat(node.style.left),y:parseFloat(node.style.top)};scheduleSave();
  });
  ARPIASPreferences.windowIds.forEach(id=>new MutationObserver(restoreWindows).observe(byId(id),{attributes:true,attributeFilter:['hidden','class']}));
  byId('resetPreferences').addEventListener('click',async()=>{
    closeMore();if(!await ARPIASUI.confirm('Restaurar mapa-base, camadas, opacidade e painéis? Seus desenhos locais serão preservados.','Restaurar preferências'))return;
    restoring=true;clearTimeout(saveTimer);
    [...definitions,...baseDefs].forEach(d=>applyLayerOpacity(d,1,baseDefs.includes(d)));
    definitions.forEach(d=>{const wanted=['limite','bairros'].includes(d.id);if(d.input.checked!==wanted)d.input.click();});
    selectBase(baseDefs[0]);choose(null);closeLayers();
    catalogSearch.value='';catalogSearch.dispatchEvent(new Event('input'));
    document.querySelectorAll('.panel-scroll details.accordion').forEach(section=>{section.open=categoryKey(section)==='risk';});
    for(const id of ARPIASPreferences.windowIds){delete windows[id];['left','top','right','bottom','transform'].forEach(key=>byId(id).style.removeProperty(key));}
    restoring=false;sync();save();toast('Preferências restauradas. Desenhos locais preservados.');
  });
  if(saved){
    [...definitions,...baseDefs].forEach(d=>{if(saved.opacity[d.id]!==undefined)applyLayerOpacity(d,saved.opacity[d.id],baseDefs.includes(d));});
    if(saved.base&&saved.base!==activeBaseDef.id)selectBase(baseDefs.find(d=>d.id===saved.base));
    if(saved.visible)definitions.forEach(d=>{if(d.input.checked!==saved.visible.includes(d.id))d.input.click();});
    choose(saved.workingLayer);restoreCategories();
    if(saved.layersOpen&&!compactMedia.matches)openLayers();
  }
  restoring=false;sync();restoreWindows();
  window.addEventListener('pagehide',save);
  return {choose,fitWorking,save};
})();
