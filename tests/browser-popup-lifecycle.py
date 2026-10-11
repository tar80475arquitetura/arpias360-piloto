"""Real Leaflet popup lifecycle; diagnostics track registrations, not heap retention.
Instrumentation records strings/counters and WeakMaps, never owns popup DOM nodes.
"""
import asyncio,json,os,runpy,sys
from pathlib import Path
from playwright.async_api import async_playwright
shared=runpy.run_path(str(Path(__file__).with_name('browser-operations.py')))
OUT=shared['OUT']
INSTRUMENT=r'''(()=>{
 const records=[],ids=new WeakMap();let sequence=0;
 const id=value=>{if(!ids.has(value))ids.set(value,String(++sequence));return ids.get(value)};
 const popup=node=>node instanceof Element&&node.classList.contains('leaflet-popup');
 for(const kind of ['MutationObserver','ResizeObserver']){
  const Native=window[kind];
  window[kind]=class extends Native{
   constructor(callback){let record;super((...args)=>{record.callbacks++;callback(...args)});record={kind,popup:false,targets:new Set(),callbacks:0};this.record=record;records.push(record)}
   observe(node,options){this.record.popup ||= popup(node);this.record.targets.add(id(node));return super.observe(node,options)}
   disconnect(){this.record.targets.clear();return super.disconnect()}
  };
 }
 const nodeRecords=[],nodeMeta=new WeakMap(),globalResize=new Set();
 const add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
 const types=new Set(['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','keydown']);
 const key=(type,callback,options)=>type+':'+id(callback)+':'+Boolean(typeof options==='boolean'?options:options?.capture);
 function registrations(target,type){
  if(target===window&&type==='resize')return globalResize;
  if(!popup(target)||!types.has(type))return null;
  if(!nodeMeta.has(target)){const set=new Set();nodeMeta.set(target,set);nodeRecords.push(set)}return nodeMeta.get(target);
 }
 EventTarget.prototype.addEventListener=function(type,callback,options){if(callback&&typeof callback==='function')registrations(this,type)?.add(key(type,callback,options));return add.call(this,type,callback,options)};
 EventTarget.prototype.removeEventListener=function(type,callback,options){if(callback&&typeof callback==='function')registrations(this,type)?.delete(key(type,callback,options));return remove.call(this,type,callback,options)};
 window.popupResources=()=>({mutation:records.filter(r=>r.kind==='MutationObserver'&&r.popup&&r.targets.size).length,
  resize:records.filter(r=>r.kind==='ResizeObserver'&&r.popup&&r.targets.size).length,
  callbacks:records.filter(r=>r.kind==='MutationObserver'&&r.popup).reduce((n,r)=>n+r.callbacks,0),
  nodeListeners:nodeRecords.reduce((n,set)=>n+set.size,0),windowResize:globalResize.size});
})();'''
async def drag(page,touch=False):
 handle=page.locator('.leaflet-popup .popup-title');b=await handle.bounding_box();x=b['x']+40;y=b['y']+b['height']/2
 if touch:
  session=await page.context.new_cdp_session(page)
  await session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  await session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+35,'y':y+30}]})
  await session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 else:
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+35,y+30,steps=5);await page.mouse.up()
 await page.wait_for_timeout(120)
async def main(diagnose=False):
 groups=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None,headless=True,args=['--no-sandbox'])
  context=await browser.new_context(viewport={'width':1366,'height':768},has_touch=True)
  await context.add_init_script(INSTRUMENT);await context.route('https://**/*',shared['external'])
  page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await shared['ready'](page);await page.evaluate('closeLayers();map.closePopup()');await page.wait_for_timeout(250)
  baseline=await page.evaluate('popupResources()')
  cycles=await page.evaluate('''async()=>{
   const cycles=[],tick=()=>new Promise(resolve=>setTimeout(resolve,0));
   for(let i=0;i<30;i++){
    const popup=L.popup({autoPan:false}).setLatLng([-22.9,-43.1]).setContent('<h3 class="popup-title">Fixture de ciclo de vida</h3>');
    popup.openOn(map);await tick();const opened=popupResources();popup.close();await tick();cycles.push({opened,closed:popupResources()});window.lifecyclePopup=popup;
   }
   const before=popupResources().callbacks;
   lifecyclePopup.setContent('<h3 class="popup-title">Conteúdo alterado enquanto fechado</h3>');
   lifecyclePopup.getElement().querySelector('.leaflet-popup-content').innerHTML='<h3 class="popup-title">Cabeçalho fechado</h3>';await tick();
   return {cycles,closedMutationCallbacks:popupResources().callbacks-before,closedHeaderPrepared:lifecyclePopup.getElement().querySelector('.popup-title').classList.contains('drag-handle')};
  }''')
  if not diagnose:
   for cycle in cycles['cycles']:
    assert cycle['opened']['mutation']==1 and cycle['opened']['resize']==1,cycle
    assert cycle['opened']['windowResize']==baseline['windowResize']+1,cycle
    assert cycle['opened']['nodeListeners']==6,cycle
    assert cycle['closed']['mutation']==cycle['closed']['resize']==cycle['closed']['nodeListeners']==0,cycle
    assert cycle['closed']['windowResize']==baseline['windowResize'],cycle
   assert cycles['closedMutationCallbacks']==0 and not cycles['closedHeaderPrepared'],cycles
   groups.append('30 distinct real popup open/close cycles: observers and listeners return to baseline; closed content causes no callbacks')
   await page.evaluate('lifecyclePopup.openOn(map)');await page.wait_for_timeout(200)
   same=await page.evaluate('''()=>{window.lifecycleNode=lifecyclePopup.getElement();for(let i=0;i<5;i++)ARPIASPanels.bind(lifecycleNode,'.popup-title',map.getContainer(),true);return popupResources()}''')
   assert same['mutation']==same['resize']==1 and same['nodeListeners']==6,same
   assert await page.locator('.leaflet-popup .popup-title').get_attribute('tabindex')=='0'
   geo=await page.evaluate('lifecyclePopup.getLatLng()')
   for touch in [False,True]:
    before=await page.locator('.leaflet-popup').bounding_box();await drag(page,touch);after=await page.locator('.leaflet-popup').bounding_box();assert before!=after,(touch,before,after)
    assert await page.evaluate('lifecyclePopup.getLatLng()')==geo
   handle=page.locator('.leaflet-popup .popup-title');await handle.focus();before=await page.locator('.leaflet-popup').bounding_box();await page.keyboard.press('ArrowLeft');after=await page.locator('.leaflet-popup').bounding_box();assert after['x']<before['x']
   assert await page.evaluate('lifecyclePopup.getLatLng()')==geo
   groups.append('reused element resumes changed header; repeated bind is idempotent; mouse, touch and keyboard move without coordinate changes')
   # Removing a popup during a captured drag must release capture and body state.
   b=await handle.bounding_box();await page.mouse.move(b['x']+35,b['y']+b['height']/2);await page.mouse.down()
   assert await page.locator('body').evaluate('e=>e.classList.contains("dragging-panel")')
   await page.evaluate('lifecyclePopup.close()');await page.mouse.up();await page.wait_for_timeout(100)
   assert not await page.locator('body').evaluate('e=>e.classList.contains("dragging-panel")')
   await page.evaluate('lifecyclePopup.getElement()._arpiasDispose();lifecyclePopup.getElement()._arpiasDispose();lifecyclePopup.openOn(map)');await page.wait_for_timeout(100)
   assert await page.evaluate('lifecyclePopup.getElement()===lifecycleNode')
   await page.evaluate('lifecyclePopup.close()');await page.wait_for_timeout(50)
   final=await page.evaluate('popupResources()');assert final['mutation']==final['resize']==final['nodeListeners']==0,final
   assert final['windowResize']==baseline['windowResize'],final
   groups.append('close during capture releases drag state; repeated dispose and resume remain safe')
   assert not errors,errors
  await browser.close()
 result={'evidence':shared['evidence'](),'diagnostic_only':diagnose,'baseline':baseline,**cycles,'groups':groups,'external_services':'simulated 503, not live GIS validation','scope':'Registration cleanup and detached-node callbacks; no heap/GC memory-leak claim'}
 (OUT/('popup-baseline.json' if diagnose else 'popup-lifecycle-results.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print(json.dumps({'diagnostic_only':diagnose,'cycles':len(cycles['cycles']),'last_closed':cycles['cycles'][-1]['closed'],'closed_mutation_callbacks':cycles['closedMutationCallbacks'],'passed_groups':len(groups)},indent=2))
if __name__=='__main__':
 try:asyncio.run(main('--diagnose' in sys.argv))
 except Exception as error:
  message=(type(error).__name__+': '+str(error)).replace('%','%25').replace('\r','%0D').replace('\n','%0A');print('::error title=Popup lifecycle::'+message,flush=True);raise
