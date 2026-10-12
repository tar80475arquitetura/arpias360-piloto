"""FE-02 actual browser navigation. Local GIS fixtures; no live service validation."""
import asyncio,json,os,runpy
from pathlib import Path
from playwright.async_api import async_playwright
shared=runpy.run_path(str(Path(__file__).with_name('browser-operations.py')))
OUT=shared['OUT'];groups=[];focus_evidence=[]
CONTRAST=runpy.run_path(str(Path(__file__).with_name('browser-fe01a.py')))['CONTRAST']
async def root(page,suffix=''):
 await page.goto('http://127.0.0.1:8080/'+suffix,wait_until='load')
 await page.wait_for_function("typeof ARPIASOperations!=='undefined' && catalogSections.length===14 && typeof ARPIASPortalUI!=='undefined'")
async def capture(page,name):
 await page.screenshot(path=str(OUT/name),animations='disabled')
async def return_portal(page):
 if await page.locator('.topbar').evaluate('e=>e.inert'):
  await page.locator('#panelPortalBtn').click()
 else:await page.locator('#portalBtn').click()
 assert await page.locator('#toolPortal').is_visible()
async def snapshot(page):
 return await page.evaluate('''()=>({mapSame:map===window.portalMap,center:map.getCenter(),zoom:map.getZoom(),
  visibility:civilDefs.map(d=>[d.id,!!d.layer&&map.hasLayer(d.layer),d.opacity]),working:document.getElementById("workingLayerPanel").dataset.layerId,
  selection:ARPIASUI.selection(),work:ARPIASUI.workGroup.toGeoJSON(false),measure:ARPIASUI.measureGroup.toGeoJSON(false),mode:ARPIASUI.mode(),
  categoryStates:catalogSections.map(s=>[s.section.dataset.group,s.section.open]),
  prefs:localStorage.getItem(ARPIASPreferences.key),drawings:localStorage.getItem('arpias360.workspace.v1')})''')
async def focus_valid(page,expected=None):
 result=await page.evaluate(r"""()=>{
  const e=document.activeElement,r=e.getBoundingClientRect();let clipped=false;
  for(let p=e.parentElement;p;p=p.parentElement){const c=p.getBoundingClientRect(),s=getComputedStyle(p);
   if(/auto|scroll|hidden|clip/.test(s.overflowY)&&(r.top<c.top||r.bottom>c.bottom))clipped=true;
   if(/auto|scroll|hidden|clip/.test(s.overflowX)&&(r.left<c.left||r.right>c.right))clipped=true;}
  return {id:e.id,tool:e.dataset.tool,tag:e.tagName,rect:{top:r.top,bottom:r.bottom,left:r.left,right:r.right},clipped,hidden:!!e.closest('[hidden],[aria-hidden="true"]'),inert:!!e.closest('[inert]'),
   visible:!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth&&!clipped,
   viewport:[innerWidth,innerHeight]};
 }""")
 assert result['visible'] and not result['hidden'] and not result['inert'],result
 if expected:assert await page.locator(expected).evaluate('e=>e===document.activeElement'),(expected,result)
 focus_evidence.append(result)
async def first_card_by_keyboard(page):
 # The public notice precedes the cards in DOM and keyboard order.
 # Exercise its disclosure and scroll region instead of skipping accessibility.
 await page.locator('#portalQuestion').scroll_into_view_if_needed()
 await focus_valid(page,'#portalQuestion')
 await page.keyboard.press('Tab')
 await focus_valid(page,'#portalExperimentalNotice summary')
 await page.keyboard.press('Enter')
 assert await page.locator('#portalExperimentalNotice').evaluate('e=>e.open')
 await page.keyboard.press('Tab')
 await focus_valid(page,'#portalExperimentalNotice .experimental-notice-content')
 await page.keyboard.press('Shift+Tab')
 await focus_valid(page,'#portalExperimentalNotice summary')
 await page.keyboard.press('Enter')
 assert not await page.locator('#portalExperimentalNotice').evaluate('e=>e.open')
 await page.keyboard.press('Tab')
 await focus_valid(page,'[data-tool=resilience]')
 await page.keyboard.press('Shift+Tab')
 await focus_valid(page,'#portalExperimentalNotice summary')
 await page.keyboard.press('Shift+Tab')
 last=await page.locator('#toolPortal button,#toolPortal select,#toolPortal a[href]').evaluate_all('es=>es.filter(e=>!e.hidden&&e.getClientRects().length).at(-1).id')
 await focus_valid(page,'#'+last)
 await page.keyboard.press('Tab')
 await focus_valid(page,'#portalExperimentalNotice summary')
 await page.keyboard.press('Tab')
 await focus_valid(page,'[data-tool=resilience]')
async def focus_scenarios(browser,w,h):
 c=await browser.new_context(viewport={'width':w,'height':h},has_touch=True);await c.route('https://**/*',shared['external'])
 page=await c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));await root(page)
 await focus_valid(page,'#portalQuestion')
 # The shortcut must occur after the complete set of cards, in layout and DOM order.
 layout=await page.evaluate("(()=>{const cards=[...document.querySelectorAll('#portalChoices button')],skip=document.getElementById('portalSkip');return {below:skip.getBoundingClientRect().top>=Math.max(...cards.map(c=>c.getBoundingClientRect().bottom)),after:!!(cards.at(-1).compareDocumentPosition(skip)&Node.DOCUMENT_POSITION_FOLLOWING),secondary:getComputedStyle(skip).backgroundColor==='rgba(0, 0, 0, 0)'}})()")
 assert layout['below'] and layout['after'] and layout['secondary'],layout
 await page.locator('[data-tool=free]').click();await focus_valid(page)
 await page.evaluate("window.portalMap=map;ARPIASUI.select({type:'Feature',properties:{},geometry:{type:'Point',coordinates:[-43.1,-22.9]}},'Fixture de foco',{origin:'search'});map.closePopup();ARPIASUI.workGroup.addLayer(L.marker([-22.91,-43.11]));ARPIASUI.measureGroup.addLayer(L.polyline([[-22.9,-43.1],[-22.91,-43.11]]))")
 await shared['choose_sirens'](page);await page.locator('#closePanel').click();await page.wait_for_timeout(400)
 for activation in ['mouse','keyboard']:
  for n,mode in enumerate(['resilience','territorial','integrated','free']):
   before=await snapshot(page);await return_portal(page);await focus_valid(page,'#portalQuestion')
   if activation=='mouse':await page.locator('[data-tool='+mode+']').click()
   else:
    await first_card_by_keyboard(page)
    for _ in range(n):await page.keyboard.press('Tab')
    await focus_valid(page,'[data-tool='+mode+']')
    assert await page.locator('[data-tool='+mode+']').evaluate("e=>getComputedStyle(e).outlineStyle==='solid'&&parseFloat(getComputedStyle(e).outlineWidth)>=3")
    await page.keyboard.press('Enter')
   await focus_valid(page,'#portalBtn');assert await snapshot(page)==before,(activation,mode,before,await snapshot(page))
 # Open modal/mobile or desktop layers and change context without leaving the control.
 await shared['open_layers'](page);select=page.locator('#toolModeSelect');await select.scroll_into_view_if_needed();await select.focus()
 before=await snapshot(page);await select.select_option('integrated');await focus_valid(page,'#toolModeSelect');assert await snapshot(page)==before
 legend=await page.locator('.catalog-key').inner_text()
 for text in ['Legenda de maturidade das camadas','DISPONÍVEL · EM INTEGRAÇÃO · PLANEJADO','Maturidade e estado operacional são distintos','verificação no ambiente público','não comprovam homologação dos serviços GIS']:assert text in legend,text
 # Native button reaches portal when the mobile background is inert.
 await return_portal(page);await focus_valid(page,'#portalQuestion');await page.locator('[data-tool=resilience]').click();await focus_valid(page,'#toolModeSelect')
 if w>899:
  await page.locator('#panel .panel-scroll').evaluate('e=>e.scrollTop=e.scrollHeight')
  await return_portal(page);await page.locator('[data-tool=territorial]').click();await focus_valid(page,'#panel .panel-title-row')
 # Exercise component entry from a collapsed panel; its select is genuinely hidden.
 await page.locator('#collapsePanel').click();assert await select.is_hidden()
 await page.evaluate('ARPIASPortalUI.show()');await focus_valid(page,'#portalQuestion')
 await page.locator('[data-tool=free]').click();await focus_valid(page,'#panel .panel-title-row')
 await page.locator('#collapsePanel').click();await page.locator('#closePanel').click()
 await page.locator('#moreBtn').click();await page.locator('#fullBtnTop').click();await page.wait_for_function('document.fullscreenElement!==null')
 await page.locator('#fullscreenPortalBtn').focus();await focus_valid(page,'#fullscreenPortalBtn');await page.keyboard.press('Enter')
 await page.wait_for_function('document.fullscreenElement===null');await focus_valid(page,'#portalQuestion')
 await first_card_by_keyboard(page);await page.keyboard.press('Enter');await focus_valid(page,'#portalBtn')
 assert not errors,errors;groups.append(f'{w}×{h}: mouse/Enter for all tools, initial/entry/return focus, visible non-inert targets, open/scrolled/collapsed layers, fullscreen and preserved cartographic fixtures')
 await c.close()
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None,headless=True,args=['--no-sandbox'])
  c=await browser.new_context(viewport={'width':1366,'height':768});await c.route('https://**/*',shared['external'])
  page=await c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await root(page)
  assert await page.locator('#toolPortal').is_visible()
  assert await page.locator('#portalChoices button').count()==4
  assert await page.locator('#portalQuestion').inner_text()=='Qual ferramenta você deseja utilizar?'
  assert await page.locator('.app-shell').evaluate('e=>e.inert')
  assert await page.locator('#portalQuestion').evaluate('e=>e===document.activeElement')
  contrast=await page.locator('#toolPortal h1,#toolPortal h2,#toolPortal p,#toolPortal strong,#toolPortal .portal-card span,#toolPortal small,#toolPortal label,#portalSkip,#portalProfile').evaluate_all(CONTRAST)
  assert all(row['ratio']>=4.5 for row in contrast),contrast
  await capture(page,'fase1-fe02-desktop-portal.png');await page.locator('#portalProfile').scroll_into_view_if_needed();await capture(page,'fase1-fe02-desktop-portal-profile.png')
  await page.locator('#portalQuestion').focus();await first_card_by_keyboard(page)
  assert await page.locator('[data-tool=resilience]').evaluate('e=>e===document.activeElement')
  await page.keyboard.press('Enter')
  assert await page.locator('#toolPortal').is_hidden()
  assert await page.evaluate('ARPIASPortalUI.mode')=='resilience'
  await shared['open_layers'](page)
  await capture(page,'fase1-fe02-desktop-resilience.png')
  await page.evaluate('window.portalMap=map')
  for mode in ['territorial','integrated','free','resilience']:
   before=await snapshot(page);await return_portal(page)
   await page.locator('[data-tool='+mode+']').click()
   assert await snapshot(page)==before,(mode,before,await snapshot(page))
   assert await page.locator('#toolModeSelect').input_value()==mode
   expected=await page.evaluate('ARPIASPortal.order(catalogSections.map(s=>s.section.dataset.group).filter(Boolean),ARPIASPortalUI.mode)')
   assert await page.locator('#catalogGroups').evaluate('e=>[...e.children].map(s=>s.dataset.group)')==expected,(await page.locator('#catalogGroups').evaluate('e=>[...e.children].map(s=>s.dataset.group)'),expected)
   assert await page.locator('#catalogSearchStatus').inner_text()=='14 categorias · 126 itens no catálogo'
  groups.append('first visit, all four choices, keyboard entry, same map, full catalog and category ordering')
  # Populate real existing controllers with synthetic selection/work/measurement.
  await shared['choose_sirens'](page)
  await page.locator('#workingVisibility').click();await page.wait_for_function('civilDefs[0].layer?.getLayers().length===37')
  await page.locator('#workingOpacity input').fill('0');await page.locator('#workingOpacity input').dispatch_event('input')
  await page.evaluate('''()=>{
   const f={type:'Feature',properties:{titulo:'Fixture FE-02'},geometry:{type:'Point',coordinates:[-43.1,-22.9]}};
   ARPIASUI.select(f,'Fixture de navegação',{origin:'search'});map.closePopup();
   ARPIASUI.workGroup.addLayer(L.marker([-22.91,-43.11]));
   ARPIASUI.measureGroup.addLayer(L.polyline([[-22.9,-43.1],[-22.91,-43.11]]));
   document.getElementById('consultBtn').click();
  }''')
  await page.wait_for_timeout(500)
  await shared['open_layers'](page)
  await page.wait_for_timeout(350)
  before=await snapshot(page)
  await return_portal(page);await page.keyboard.press('Escape');assert await snapshot(page)==before,('portal Escape',before,await snapshot(page))
  await page.locator('[data-tool=integrated]').click();assert await snapshot(page)==before
  await page.locator('#toolModeSelect').select_option('territorial');assert await snapshot(page)==before
  groups.append('selection, working layer, zero opacity, work features, measurement, consult mode and map preferences preserved by portal/context switch')
  await return_portal(page);await page.locator('#portalProfile').select_option('researcher')
  await page.locator('[data-tool=territorial]').click()
  await page.reload(wait_until='load');await page.wait_for_function('catalogSections.length===14')
  assert await page.locator('#toolPortal').is_visible(),'root QR entry must show portal even with saved preferences'
  assert await page.locator('#portalResume').inner_text()=='Continuar em Ordem Territorial'
  assert await page.locator('#portalProfile').input_value()=='researcher'
  await page.locator('#portalResume').click();assert await page.evaluate('ARPIASPortalUI.mode')=='territorial'
  await return_portal(page);await page.locator('#portalSkip').click();assert await page.evaluate('ARPIASPortalUI.mode')=='free'
  await page.locator('#closePanel').click()
  await page.locator('#moreBtn').click();await page.locator('#fullBtnTop').click()
  await page.wait_for_function('document.fullscreenElement!==null')
  await page.locator('#fullscreenPortalBtn').click()
  await page.wait_for_function('document.fullscreenElement===null')
  assert await page.locator('#toolPortal').is_visible()
  assert not errors,errors
  groups.append('validated optional profile, remembered choice, root QR still shows presentation, resume, free-map shortcut and return from fullscreen')
  await c.close()
  # Deep links maintain URL, destination and selection. Invalid coordinates keep existing errors.
  for suffix,portal in [('?lat=-22.9&lon=-43.1&zoom=17',False),('?lat=no&lon=-43.1',False),('?utm_source=feira',True)]:
   c=await browser.new_context();await c.route('https://**/*',shared['external']);await c.add_init_script("window.portalNotices=[];new MutationObserver(()=>{const t=document.getElementById('toast')?.textContent;if(t&&!portalNotices.includes(t))portalNotices.push(t)}).observe(document,{childList:true,characterData:true,subtree:true})");page=await c.new_page();await root(page,suffix)
   assert await page.locator('#toolPortal').is_visible()==portal
   assert page.url.endswith(suffix)
   if 'lat=-22.9' in suffix:
    await page.wait_for_function('ARPIASUI.selection()!==null')
    assert await page.evaluate('ARPIASUI.selection().feature.geometry.coordinates')==[-43.1,-22.9]
   if 'lat=no' in suffix:assert await page.evaluate('portalNotices.includes(ARPIASLocation.parse(new URLSearchParams(location.search)).error)'),await page.evaluate('portalNotices')
   await c.close()
  groups.append('shared coordinate link bypass, invalid-coordinate error preserved and unknown QR params show portal')
  for w,h in [(1920,1080),(1366,768),(1024,768),(768,1024),(390,844),(320,568)]:
   c=await browser.new_context(viewport={'width':w,'height':h},has_touch=True);await c.route('https://**/*',shared['external'])
   page=await c.new_page();await root(page)
   assert await page.locator('#toolPortal').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   for card in await page.locator('#portalChoices button').all():
    await card.scroll_into_view_if_needed();b=await card.bounding_box();assert b['x']>=0 and b['x']+b['width']<=w+1 and b['height']>=44
   await page.locator('#portalProfile').select_option('citizen')
   await page.locator('#portalResume').focus();await page.keyboard.press('Tab')
   await focus_valid(page,'#portalExperimentalNotice summary')
   await page.keyboard.press('Tab')
   assert await page.locator('[data-tool=resilience]').evaluate('e=>e===document.activeElement'),'keyboard must wrap within portal'
   if w==390:
    await page.locator('#toolPortal').evaluate('e=>e.scrollTop=0');await capture(page,'fase1-fe02-mobile-portal.png');await page.locator('[data-tool=free]').scroll_into_view_if_needed();await capture(page,'fase1-fe02-mobile-portal-options.png')
   await page.locator('[data-tool=resilience]').click();await shared['open_layers'](page)
   if w==390:await capture(page,'fase1-fe02-mobile-resilience.png')
   assert await page.locator('#panel .panel-scroll').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   await page.locator('#toolModeSelect').select_option('integrated')
   await return_portal(page);await page.set_viewport_size({'width':w,'height':h-40});await page.wait_for_timeout(250)
   assert await page.locator('.topbar').evaluate('e=>e.inert')
   await page.locator('#portalSkip').click()
   if await page.locator('#panel').evaluate('e=>!e.inert'):
    await page.locator('#closePanel').click()
   assert await page.locator('#portalBtn').is_visible()
   b=await page.locator('#portalBtn').bounding_box();assert b['x']>=0 and b['x']+b['width']<=w+1 and b['width']>=44,b
   await page.locator('#portalBtn').click();assert await page.locator('#toolPortal').is_visible()
   await c.close()
  groups.append('six responsive sizes, touch targets, keyboard loop, mobile modal return, viewport change and permanent portal button')
  # Denied/malformed preference storage never blocks navigation.
  for script in ["localStorage.setItem('arpias360.portal.v1','{bad')", "Storage.prototype.setItem=function(){throw new Error('denied')}"]:
   c=await browser.new_context();await c.add_init_script(script);await c.route('https://**/*',shared['external']);page=await c.new_page();await root(page)
   await page.locator('[data-tool=integrated]').click();assert await page.evaluate('ARPIASPortalUI.mode')=='integrated'
   await return_portal(page)
   if 'denied' in script:assert 'Não foi possível salvar' in await page.locator('#portalStorageStatus').inner_text()
   await c.close()
  groups.append('malformed and denied storage remain usable')
  for w,h in [(1366,768),(390,844),(320,568)]:await focus_scenarios(browser,w,h)
  await browser.close()
 (OUT/'portal-results.json').write_text(json.dumps({'evidence':shared['evidence'](),'passed':groups,'focus_evidence':focus_evidence,'external_services':'simulated 503; not live GIS validation'},ensure_ascii=False,indent=2))
 print(json.dumps({'passed':len(groups),'groups':groups},ensure_ascii=False,indent=2))
if __name__=='__main__':
 try:asyncio.run(main())
 except Exception as error:
  message=(type(error).__name__+': '+str(error)).replace('%','%25').replace('\r','%0D').replace('\n','%0A')
  print('::error title=Portal FE-02::'+message,flush=True);raise
