/* Portal presentation and catalog ordering. The existing WebGIS owns all map state. */
(function(){
  const api=window.ARPIASPortal,portal=document.getElementById('toolPortal');
  if(!api||!portal)return;
  let storage;try{storage=window.localStorage;}catch{storage=null;}
  let state=api.read(storage)||{version:1,mode:'free',profile:''};
  let originalSections=[],background=[];
  const select=document.getElementById('toolModeSelect');
  const profile=document.getElementById('portalProfile');
  const resume=document.getElementById('portalResume');
  const status=document.getElementById('portalStorageStatus');
  const cards=document.getElementById('portalChoices');
  const webgis=[document.querySelector('.topbar'),document.querySelector('.app-shell')];
  for(const item of api.modes){
    const button=document.createElement('button');button.type='button';button.className='portal-card';button.dataset.tool=item.id;
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',item.icon);icon.append(path);
    const title=document.createElement('strong');title.textContent=item.title;
    const description=document.createElement('span');description.textContent=item.description;
    const action=document.createElement('small');action.textContent='Abrir ferramenta →';
    button.append(icon,title,description,action);button.addEventListener('click',()=>enter(item.id));cards.append(button);
    const option=document.createElement('option');option.value=item.id;option.textContent=item.title;select.append(option);
  }
  function save(){if(!api.write(storage,state))status.textContent='Não foi possível salvar a preferência neste dispositivo. Você pode continuar usando as ferramentas.';else status.textContent='';}
  function remembered(){
    const saved=api.read(storage);resume.hidden=!saved;
    if(saved)resume.textContent='Continuar em '+api.mode(saved.mode).title;
    profile.value=state.profile;
    cards.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('last-choice',!!saved&&b.dataset.tool===saved.mode));
  }
  function organize(){
    const host=document.getElementById('catalogGroups');
    if(!originalSections.length&&host.children.length)originalSections=[...host.children];
    const byId=new Map(originalSections.map(section=>[section.dataset.group,section]));
    for(const id of api.order([...byId.keys()],state.mode)){
      const section=byId.get(id);host.append(section);
      section.classList.toggle('context-priority',api.mode(state.mode).groups.includes(id));
    }
  }
  function context(){
    const item=api.mode(state.mode);select.value=item.id;
    document.getElementById('toolContextTitle').textContent=item.title;
    document.getElementById('toolContextDescription').textContent=item.description;
    document.getElementById('toolContextHint').textContent=item.groups.length?'Categorias deste contexto aparecem primeiro e têm uma borda verde. Todas as categorias continuam acessíveis.':'Todas as categorias na ordem original. A escolha de ferramenta não altera a visibilidade das camadas.';
    document.body.dataset.toolContext=item.id;organize();
  }
  function hide(){
    portal.hidden=true;document.body.classList.remove('portal-active');
    for(const [element,inert,aria] of background){element.inert=inert;if(aria===null)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden',aria);}
    background=[];
    // The existing responsive panel may have changed modal state while covered.
    webgis[0].inert=matchMedia('(max-width:899px)').matches&&!document.getElementById('panel').classList.contains('hidden');
  }
  function enter(id){state={...state,mode:api.mode(id).id,profile:profile.value};save();context();hide();
    // No opening/closing panels here: mobile modal state, selections and tools survive.
    let target=!document.getElementById('panel').inert?select:document.getElementById('portalBtn');
    if(!target.getClientRects().length)target=document.querySelector('#panel .panel-title-row');target.focus({preventScroll:true});
  }
  async function show(){
    if(!portal.hidden)return;
    if(document.fullscreenElement)await document.exitFullscreen();
    background=webgis.map(e=>[e,e.inert,e.getAttribute('aria-hidden')]);
    for(const e of webgis){e.inert=true;e.setAttribute('aria-hidden','true');}
    remembered();portal.hidden=false;document.body.classList.add('portal-active');
    portal.scrollTop=0;document.getElementById('portalQuestion').focus({preventScroll:true});
  }
  document.getElementById('portalBtn').addEventListener('click',show);
  document.getElementById('fullscreenPortalBtn').addEventListener('click',show);
  document.getElementById('panelPortalBtn').addEventListener('click',show);
  document.getElementById('portalSkip').addEventListener('click',()=>enter('free'));
  resume.addEventListener('click',()=>enter(state.mode));
  select.addEventListener('change',()=>{state={...state,mode:select.value};save();context();});
  profile.addEventListener('change',()=>{state={...state,profile:profile.value};save();remembered();});
  // Keep keyboard navigation inside the presentation while the map is inert.
  portal.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const buttons=[...portal.querySelectorAll('button,select,a[href]')].filter(e=>!e.hidden);
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===document.getElementById('portalQuestion'))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  // Escape belongs to the portal while it is shown: do not clear the covered map.
  document.addEventListener('keydown',event=>{if(!portal.hidden&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();}},true);
  new MutationObserver(()=>{if(!portal.hidden)for(const e of webgis){if(!e.inert)e.inert=true;if(e.getAttribute('aria-hidden')!=='true')e.setAttribute('aria-hidden','true');}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['inert','aria-hidden']});
  document.addEventListener('arpias:catalog-ready',organize);
  context();remembered();
  // Invalid recognized coordinate links also retain the WebGIS's existing error message.
  const direct=window.ARPIASLocation&&api.directLink(new URLSearchParams(location.search),ARPIASLocation);
  portal.hidden=true;
  if(!direct)show();
  window.ARPIASPortalUI={show,get mode(){return state.mode;}};
})();
