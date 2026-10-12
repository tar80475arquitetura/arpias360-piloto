"""RC02: eventos reais de pan/zoom e retorno de foco, com fontes GIS controladas.
Não representa homologação pública. A CI deve falhar se P1/P3 continuarem incorretos;
o JSON e as capturas são gravados antes da falha para revisão no artefato.
"""
import asyncio,json,runpy,datetime,os
from pathlib import Path
from playwright.async_api import async_playwright
REPO=Path(__file__).resolve().parents[1];shared=runpy.run_path(str(REPO/'tests/browser-operations.py'));fe03=runpy.run_path(str(REPO/'tests/browser-fe03.py'));area=fe03['AREA'];PHASE=fe03['PHASE'];OUT=shared['OUT']/('rc02-'+PHASE);OUT.mkdir(exist_ok=True)
LAYOUT=r'''() => {
 const m=document.getElementById('map').getBoundingClientRect(),p=document.getElementById('panel'),back=document.getElementById('panelBackdrop');
 const boxes=['#panel','#toolPanel','.floating-search','.leaflet-control','.mobile-actions','#mapStatus','#coords'].flatMap(s=>[...document.querySelectorAll(s)]).filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]')).map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}});
 let point=null,candidates=[];
 for(let j=1;j<30;j++)for(let i=1;i<20;i++){
  const x=m.x+m.width*i/20,y=m.y+m.height*j/30;
  if(!boxes.some(r=>x>=r.x&&x<=r.right&&y>=r.y&&y<=r.bottom)&&x+30<m.right&&y+5<m.bottom){const hit=document.elementFromPoint(x,y),isInert=!!document.getElementById('map').closest('[inert]');if(isInert||document.getElementById('map').contains(hit))candidates.push({x,y,distance:(x-m.x-m.width/2)**2+(y-m.y-m.height/2)**2});}
 }
 point=candidates.sort((a,b)=>a.distance-b.distance)[0]||null;const styles={};for(const id of ['panel','panelBackdrop','map']){const e=document.getElementById(id),s=getComputedStyle(e),r=e.getBoundingClientRect();styles[id]={box:{x:r.x,y:r.y,width:r.width,height:r.height},inert:e.inert,hidden:e.hidden,visibility:s.visibility,position:s.position,zIndex:s.zIndex,pointerEvents:s.pointerEvents,background:s.backgroundColor,overflowY:s.overflowY};}
 return {viewport:[innerWidth,innerHeight],mapInert:!!document.getElementById('map').closest('[inert]'),point,hit:point?document.elementFromPoint(point.x,point.y)?.id:null,styles,panelModal:p.getAttribute('aria-modal')};
}'''
async def state(page):return await page.evaluate("""({center:map.getCenter(),zoom:map.getZoom(),mapPointerDown:window.probeEvents.pointer,mapWheel:window.probeEvents.wheel,active:document.activeElement.id||document.activeElement.tagName,painelAberto:!document.getElementById('panel').classList.contains('hidden'),mapaInert:!!document.getElementById('map').closest('[inert]')})""")
async def restore_panel(page,panel_state):
 opened=panel_state in ['aberto','recolhido','movido']
 hidden=await page.locator('#panel').evaluate("e=>e.classList.contains('hidden')")
 if opened and hidden:await shared['open_layers'](page)
 if not opened and not hidden:await page.locator('#closePanel').click()
 if opened:
  collapsed=await page.locator('#panel').evaluate("e=>e.classList.contains('is-collapsed')")
  if collapsed!=(panel_state in ['recolhido','movido']):await page.locator('#collapsePanel').click()
 await page.wait_for_timeout(120)
async def interactions(page,point,panel_state):
 result=[]
 for mode in ['ponteiro-pan','toque-pan','roda-zoom','teclado-pan']:
  await restore_panel(page,panel_state);point=(await page.evaluate(LAYOUT))['point'];before=await state(page);x,y=point['x'],point['y']
  if mode=='ponteiro-pan':
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+30,y,steps=8);await page.mouse.up()
  elif mode=='toque-pan':
   session=await page.context.new_cdp_session(page)
   for event,points in [('touchStart',[{'x':x,'y':y}]),('touchMove',[{'x':x+30,'y':y}]),('touchEnd',[])]:await session.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':points})
   await session.detach()
  elif mode=='roda-zoom':await page.mouse.move(x,y);await page.mouse.wheel(0,-200)
  else:await page.locator('#map').focus();await page.keyboard.press('ArrowRight')
  await page.wait_for_timeout(500);after=await state(page)
  result.append({'modalidade':mode,'antes':before,'depois':after,'respondeu':before['center']!=after['center']if'pan'in mode else before['zoom']!=after['zoom']})
 return result
async def keyboard_target(page,id):
 target=page.locator('#'+id)
 direction=await target.evaluate("e=>!!(document.activeElement.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_PRECEDING)")
 key='Shift+Tab'if direction else'Tab'
 for count in range(150):
  if await target.evaluate('e=>e===document.activeElement'):return key+' × '+str(count)
  await page.keyboard.press(key)
 raise AssertionError('Alvo não alcançado pela ordem de teclado: '+id)
async def boundary(page):
 results=[]
 for edge,key in [('first','Shift+Tab'),('last','Tab')]:
  await page.locator('#panel').evaluate("""(p,edge)=>{const nodes=[...p.querySelectorAll('[tabindex="0"],button,input,select,a[href],summary')].filter(e=>!e.disabled&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]'));(edge==='first'?nodes[0]:nodes.at(-1)).focus()}""",edge)
  before=await page.evaluate('document.activeElement.id');await page.keyboard.press(key)
  results.append({'tecla':key,'antes':before,'depois':await page.evaluate('document.activeElement.id||document.activeElement.tagName'),'saiu_do_painel':await page.evaluate("!document.getElementById('panel').contains(document.activeElement)")})
 if PHASE=='after':assert all(r['saiu_do_painel']for r in results),results
 return results
async def confirmation_guard(page):
 await page.locator('#moreBtn').click();await page.locator('#editBtn').click();await page.locator('#confirmAccept').click()
 await page.locator('#drawPoint').click();point=(await page.evaluate(LAYOUT))['point'];await page.mouse.click(point['x'],point['y'])
 await page.locator('#workForm [name=titulo]').fill('Anotação sintética de regressão');await page.locator('#workForm button[type=submit]').click()
 snapshot=await page.evaluate('JSON.stringify(ARPIASUI.workGroup.toGeoJSON())');assert await page.evaluate('ARPIASUI.workGroup.getLayers().length')==1
 await page.locator('#exitTool').focus();await page.keyboard.press('Enter');await page.locator('#confirmCancel').click()
 assert await page.evaluate('ARPIASUI.mode()')=='edit';assert await page.evaluate('JSON.stringify(ARPIASUI.workGroup.toGeoJSON())')==snapshot
 assert await page.evaluate('document.activeElement.id')=='exitTool'
 await page.keyboard.press('Enter');await page.locator('#confirmAccept').click();await page.wait_for_function("ARPIASUI.mode()==='navigate'")
 assert await page.evaluate('ARPIASUI.workGroup.getLayers().length')==0
 if PHASE=='after':assert await page.evaluate('document.activeElement.id')=='moreBtn'
 # Uma transição solicitada por busca não deve tomar o foco do campo de busca.
 await page.locator('#consultBtn').click();await page.locator('#searchMirror').focus();await page.evaluate("ARPIASUI.request('navigate')")
 assert await page.evaluate('document.activeElement.id')=='searchMirror'
 # Início programático com body como origem usa um controle de retorno válido.
 await page.evaluate("document.activeElement.blur();ARPIASUI.request('consult')");await page.locator('#exitTool').focus();await page.keyboard.press('Enter')
 if PHASE=='after':assert await page.evaluate('document.activeElement.id')=='consultBtn'
 return 'Cancelar mantém modo, feição e foco; confirmar restaura backup; transição externa preserva foco da busca'
async def main():
 report={'referencia_historica':'ab885c61040a0db08505efc4f56ae1fb991c1d00','rendered_ref':fe03['BASE_REF']or'working tree','fase':PHASE,'evidencia':shared['evidence'](),'hora_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'fontes_gis':'503 simulado, não é homologação pública','p3':[],'p1':[]}
 async with async_playwright()as pw:
  browser=await pw.chromium.launch(executable_path=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None,headless=True,args=['--no-sandbox'])
  for label,w,h in [('desktop',1366,768),('tablet',768,1024),('celular',390,844),('compacto',320,568)]:
   c=await browser.new_context(viewport={'width':w,'height':h},has_touch=True);await fe03['routes'](c);page=await c.new_page();await shared['ready'](page)
   await page.evaluate("window.probeEvents={pointer:0,wheel:0};document.getElementById('map').addEventListener('pointerdown',()=>probeEvents.pointer++);document.getElementById('map').addEventListener('wheel',()=>probeEvents.wheel++)")
   for mode in ['fechado','aberto','recolhido','movido','fechado-novamente']:
    if mode=='aberto':await shared['open_layers'](page)
    if mode=='recolhido':await page.locator('#collapsePanel').click()
    if mode=='movido':await page.locator('#panel .panel-title-row').focus();await page.keyboard.press('ArrowUp')
    if mode=='fechado-novamente':await page.locator('#closePanel').click()
    await page.wait_for_timeout(250);layout=await page.evaluate(LAYOUT);a=await page.evaluate(area);visual=await page.evaluate(area.replace(",'#panelBackdrop'",''));visual['method']='União de retângulos do DOM, excluindo apenas o fundo modal para medir visibilidade';visual['limitations']='Área visual não comprova operação. As sondagens verificam pan/zoom em um ponto livre amostrado por estado.'
    keys=await boundary(page)if mode in ['aberto','recolhido','movido']else[]
    if PHASE=='after':assert not layout['mapInert']and layout['panelModal']is None,layout
    assert layout['point'], 'Não foi localizada região livre para testar o mapa'
    probes=await interactions(page,layout['point'],mode)
    report['p3'].append({'ambiente':label,'estado':mode,'layout':layout,'area_operacional_metodo_anterior':a,'area_visual':visual,'eventos':probes,'limites_teclado':keys})
    await restore_panel(page,mode);await page.screenshot(path=str(OUT/f'diagnostico-{label}-{mode}.png'),animations='disabled');(OUT/'diagnostico-parcial.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
   for tool,opener,expected in [('consult','consultBtn','consultBtn'),('measure','measureBtn','moreBtn'),('edit','editBtn','moreBtn')]:
    sequence=[]
    if tool!='consult':sequence.append(await keyboard_target(page,'moreBtn'));await page.keyboard.press('Enter');sequence.append('Mais: Enter')
    sequence.append(await keyboard_target(page,opener));await page.keyboard.press('Enter');sequence.append(opener+': Enter')
    if tool=='edit':sequence.append(await keyboard_target(page,'confirmAccept'));await page.keyboard.press('Enter');sequence.append('confirmAccept: Enter')
    await page.wait_for_function('mode=>ARPIASUI.mode()===mode',arg=tool)
    sequence.append(await keyboard_target(page,'exitTool'));await page.keyboard.press('Enter');sequence.append('exitTool: Enter')
    await page.wait_for_function("ARPIASUI.mode()==='navigate'");await page.wait_for_timeout(100)
    observed=await page.evaluate('({id:document.activeElement.id,tag:document.activeElement.tagName})');report['p1'].append({'ambiente':label,'viewport':[w,h],'ferramenta':tool,'abriu':opener,'sequencia':sequence,'esperado':expected,'observado':observed,'correto':observed['id']==expected})
    await page.screenshot(path=str(OUT/f'foco-{label}-{tool}.png'),animations='disabled')
   if label=='desktop':report['confirmacoes']=await confirmation_guard(page)
   await keyboard_target(page,'layersBtn');await page.keyboard.press('Enter');await keyboard_target(page,'closePanel');await page.keyboard.press('Enter')
   assert await page.evaluate("document.activeElement.id==='layersBtn'&&document.getElementById('panel').classList.contains('hidden')")
   await c.close()
  await browser.close()
 (OUT/'diagnostico.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 report['verificacoes_criticas']={'foco_aprovadas':sum(r['correto']for r in report['p1']),'foco_reprovadas':sum(not r['correto']for r in report['p1']),'mapa_aberto_aprovadas':sum(e['respondeu']and e['depois']['painelAberto']for r in report['p3']if r['estado']in['aberto','recolhido','movido']for e in r['eventos']),'mapa_aberto_reprovadas':sum(not(e['respondeu']and e['depois']['painelAberto'])for r in report['p3']if r['estado']in['aberto','recolhido','movido']for e in r['eventos'])};(OUT/'diagnostico.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'p3':[{ 'ambiente':r['ambiente'],'estado':r['estado'],'inert':r['layout']['mapInert'],'eventos_responderam':[e['respondeu']for e in r['eventos']]}for r in report['p3']],'p1':report['p1']},ensure_ascii=False))
asyncio.run(main())
result=json.loads((OUT/'diagnostico.json').read_text())['verificacoes_criticas']
if PHASE=='before':
 assert result['foco_reprovadas']==12 and result['mapa_aberto_reprovadas']==36, 'A referência histórica deve reproduzir as causas P1/P3 documentadas'
else:
 assert all(e['respondeu']and e['depois']['painelAberto']==(r['estado']in['aberto','recolhido','movido'])for r in json.loads((OUT/'diagnostico.json').read_text())['p3']for e in r['eventos']), 'Mapa deve responder sem mudar a abertura do painel, inclusive depois de fechar'
 if result['foco_reprovadas'] or result['mapa_aberto_reprovadas']:raise SystemExit('P1/P3 reprovados nas verificações críticas; correção ainda necessária.')
