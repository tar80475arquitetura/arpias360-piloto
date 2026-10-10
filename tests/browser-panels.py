"""Window mobility regression. Existing CDN/GIS fixtures are local UI tests only."""
import asyncio,json,os,runpy
from pathlib import Path
from playwright.async_api import async_playwright
shared=runpy.run_path(str(Path(__file__).with_name('browser-operations.py')))
OUT=shared['OUT'];groups=[]
async def drag(page,selector,dx,dy,touch=False):
 h=page.locator(selector).first;box=await h.bounding_box();x=box['x']+min(70,box['width']/3);y=box['y']+box['height']/2
 if touch:
  session=await page.context.new_cdp_session(page)
  await session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  for n in range(1,7):await session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx*n/6,'y':y+dy*n/6}]})
  await session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 else:
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,steps=8);await page.mouse.up()
 await page.wait_for_timeout(180)
async def bounded(page,selector):
 b=await page.locator(selector).bounding_box();s=await page.evaluate('({w:innerWidth,h:innerHeight})')
 assert b['x']>=-1 and b['y']>=-1 and b['x']+b['width']<=s['w']+1 and b['y']+b['height']<=s['h']+1,(selector,b,s)
async def snap(page,name):
 await page.wait_for_function("!document.getElementById('toast').classList.contains('show')")
 await page.screenshot(path=str(OUT/name),animations='disabled')
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None,headless=True,args=['--no-sandbox'])
  for label,w,h in [('desktop',1366,768),('mobile',390,844)]:
   c=await browser.new_context(viewport={'width':w,'height':h},has_touch=True);await c.route('https://**/*',shared['external'])
   page=await c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   await shared['ready'](page);await shared['open_layers'](page)
   before=await page.locator('#panel').bounding_box();center=await page.evaluate('map.getCenter()')
   await drag(page,'#panel .panel-title-row',400 if w>600 else 6,-50 if w<600 else 35,touch=w<600)
   after=await page.locator('#panel').bounding_box();assert abs(before['x']-after['x'])+abs(before['y']-after['y'])>10,(before,after)
   await bounded(page,'#panel');assert center==await page.evaluate('map.getCenter()')
   # Inputs and close buttons keep their original behavior after a drag.
   await page.locator('#layerSearch').fill('sirene');await page.locator('.layer-control[data-layer-id=sirenes] .layer-work-button').first.click()
   assert not await page.locator('#layer_sirenes').is_checked()
   await page.locator('#panel .panel-title-row').focus();x=after['x'];await page.keyboard.press('ArrowLeft')
   assert (await page.locator('#panel').bounding_box())['x']<=x
   if w<600:
    await page.locator('#collapsePanel').focus();await page.keyboard.press('Shift+Tab')
    assert await page.locator('#panel .panel-title-row').evaluate('e=>e===document.activeElement')
    await page.keyboard.press('ArrowUp')
   await page.wait_for_timeout(350);saved=await page.evaluate('JSON.parse(localStorage.getItem(ARPIASPreferences.key)).windows.panel');assert saved['y']>=0
   if w>600:
    box=await page.locator('#panel').bounding_box()
    await page.mouse.move(box['x']+box['width']-3,box['y']+box['height']-3);await page.mouse.down()
    await page.mouse.move(box['x']+box['width']+30,box['y']+box['height']-65,steps=8);await page.mouse.up()
    resized=await page.locator('#panel').bounding_box();assert resized['width']>box['width']+10 and resized['height']<box['height']-20,(box,resized)
   await page.locator('#collapsePanel').click()
   assert (await page.locator('#panel').bounding_box())['height']<120
   assert await page.locator('#panel .panel-scroll').is_hidden()
   await drag(page,'#panel .panel-title-row',-15,-15,touch=w<600)
   await page.locator('#collapsePanel').click()
   assert await page.locator('#panel .panel-scroll').is_visible()
   await snap(page,f'movable-{label}-layers.png')
   await page.locator('#closePanel').click();await page.reload(wait_until='load');await page.wait_for_function('catalogSections.length===14')
   await shared['open_layers'](page);await page.wait_for_timeout(250)
   assert await page.locator('#panel').evaluate('e=>!!e.style.left')
   await page.locator('#closePanel').click()
   await drag(page,'.floating-search .search-icon',20,35,touch=w<600)
   await bounded(page,'.floating-search')
   # Each modal keeps native modal semantics while its header moves.
   for id in ['layerInfo','confirmAction','workFormDialog','shareDialog','technicalReport']:
    if id=='layerInfo':await page.locator('#moreBtn').click();await page.locator('#helpBtn').click()
    else:await page.locator('#'+id).evaluate('e=>e.showModal()')
    title='#infoTitle' if id=='layerInfo' else '.report-controls h2' if id=='technicalReport' else 'h2'
    original=await page.locator('#'+id).bounding_box()
    await drag(page,'#'+id+' '+title,-30,-25,touch=w<600)
    moved=await page.locator('#'+id).bounding_box();assert abs(moved['x']-original['x'])+abs(moved['y']-original['y'])>5,(id,original,moved)
    await bounded(page,'#'+id);assert await page.locator('#'+id).evaluate('e=>e.matches(":modal")')
    await page.locator('#'+id).evaluate('e=>e.close()')
   for id,handle,open_action,close_action in [
     ('toolPanel','.tool-state strong',"document.getElementById('moreBtn').click();document.getElementById('measureBtn').click()","document.getElementById('exitTool').click()"),
     ('aboutPanel','h2',"document.getElementById('moreBtn').click();document.getElementById('aboutBtn').click()","document.getElementById('closeAbout').click()"),
     ('territorialPanel','.query-header',"ARPIASUI.select({type:'Feature',properties:{},geometry:{type:'Point',coordinates:[-43.1,-22.9]}},'Fixture local de mobilidade',{origin:'search'});ARPIASUI.showTerritorial()","ARPIASUI.closeTerritorial()")]:
    await page.evaluate(open_action);await page.wait_for_timeout(300)
    original=await page.locator('#'+id).bounding_box()
    await drag(page,'#'+id+' '+handle,35,-25,touch=w<600)
    moved=await page.locator('#'+id).bounding_box();assert abs(original['x']-moved['x'])+abs(original['y']-moved['y'])>5,(id,original,moved)
    await bounded(page,'#'+id);await page.evaluate(close_action)
   # Real existing popup and sheet, with immutable geographic coordinates.
   await page.evaluate("map.fire('locationfound',{latlng:L.latLng(-22.9,-43.1)})")
   await page.wait_for_timeout(350)
   await page.wait_for_function('!map._panAnim?._inProgress')
   if w>600:
    assert 'Sua localização aproximada' in await page.locator('.leaflet-popup-content').inner_text()
    geo=await page.evaluate('currentPopup.getLatLng()');original=await page.locator('.leaflet-popup').bounding_box()
    await drag(page,'.leaflet-popup .popup-title',-180,70)
    moved=await page.locator('.leaflet-popup').bounding_box();assert original!=moved
    assert geo==await page.evaluate('currentPopup.getLatLng()');await bounded(page,'.leaflet-popup')
    await snap(page,'movable-desktop-popup.png')
   else:
    body=await page.locator('#queryBody').inner_text();assert 'Sua localização aproximada' in body and '-22.900000' in body and '=>' not in body,body
    original=await page.locator('#querySheet').bounding_box();await drag(page,'#querySheet .query-header',0,-75,touch=True)
    moved=await page.locator('#querySheet').bounding_box();assert moved['y']<original['y'];await bounded(page,'#querySheet')
    await snap(page,'movable-mobile-query.png')
   assert not errors,errors
   groups.append(label+': pointer/touch, keyboard, layer independence, saved position, five native dialogs and popup/query sheet')
   await c.close()
  await browser.close()
 (OUT/'panels-results.json').write_text(json.dumps({'evidence':shared['evidence'](),'groups':groups,'external_services':'Controlled fixtures; not live GIS or public-site homologation'},ensure_ascii=False,indent=2))
 print(json.dumps({'passed':len(groups),'groups':groups},ensure_ascii=False,indent=2))
if __name__=='__main__':
 try:asyncio.run(main())
 except Exception as error:
  message=f'{type(error).__name__}: {error}'.replace('%','%25').replace('\r','%0D').replace('\n','%0A')
  print(f'::error title=Window mobility regression::{message}',flush=True)
  raise
