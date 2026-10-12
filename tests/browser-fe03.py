"""FE-03: contraste renderizado, união de retângulos e capturas comparáveis.

Executar depois que o servidor existente estiver pronto. Saída em ARPIAS_TEST_OUTPUT,
nunca em tests/evidence. GIS simulado pela configuração das regressões existentes.
ARPIAS_FE03_PHASE=before registra a base sem exigir os estilos propostos.
"""
import asyncio, base64, hashlib, json, math, os, runpy, subprocess, tempfile
from urllib.parse import urlsplit
from pathlib import Path
from playwright.async_api import async_playwright

shared = runpy.run_path(str(Path(__file__).with_name('browser-operations.py')))
OUT = shared['OUT']; PHASE = os.environ.get('ARPIAS_FE03_PHASE', 'after')
ROWS = []; CONTRASTS = []; TARGETS = []; MODALITIES = []
FOCUS_RETURNS = []; BASE_REF = os.environ.get('ARPIAS_FE03_BASE_REF')
# A base deve reproduzir também os três módulos funcionais agora autorizados.
PRESENTATION = ['css/style.css','css/ux.css','css/portal.css','index.html','js/app.js','js/portal-ui.js','js/tools.js']

def rendered_source(path):
    return subprocess.check_output(['git','show',BASE_REF+':'+path]) if BASE_REF else Path(path).read_bytes()

def comparison():
    before=OUT/'fe03-before.json';after=OUT/'fe03-after.json'
    if not before.exists() or not after.exists():return
    a=json.loads(before.read_text());b=json.loads(after.read_text())
    rows=[]
    for old,new in zip(a['area'],b['area'],strict=True):
        assert (old['label'],old['state'],old['viewport'])==(new['label'],new['state'],new['viewport'])
        rows.append({'ambiente':new['label'],'estado':new['state'],'viewport':new['viewport'],
                     'zoom_percentual':new['browser_zoom_percent'],'antes':old,'depois':new,
                     'diferenca_px2':new['useful_px2']-old['useful_px2'],
                     'diferenca_pontos_percentuais':new['useful_percent']-old['useful_percent']})
    shots=sorted(OUT.glob('before-*.png'));pairs=[]
    for shot in shots:
        candidate=OUT/shot.name.replace('before-','after-',1)
        assert candidate.exists(),candidate.name
        pairs.append({'antes':shot.name,'depois':candidate.name})
    report={'referencia_anterior':a['rendered_ref'],'evidencia_anterior':a['evidence'],
            'evidencia_posterior':b['evidence'],'areas':rows,'pares_de_capturas':pairs,
            'limite':'A união de retângulos é uma medida geométrica. A operação efetiva exige as sondagens independentes RC02.'}
    (OUT/'fe03-comparacoes.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    lines=['# Comparações FE-03','',report['limite'],'',
           '| Ambiente | Estado | Viewport | Zoom | Antes px² úteis | Depois px² úteis | Diferença px² | Diferença p.p. |',
           '|---|---|---|---|---:|---:|---:|---:|']
    for r in rows:
        lines.append(f"| {r['ambiente']} | {r['estado']} | {r['viewport']} | {r['zoom_percentual']}% | {r['antes']['useful_px2']:.2f} | {r['depois']['useful_px2']:.2f} | {r['diferenca_px2']:.2f} | {r['diferenca_pontos_percentuais']:.4f} |")
    lines+=['','## Capturas pareadas','']
    for pair in pairs:lines.append(f"- [Antes]({pair['antes']}) / [Depois]({pair['depois']})")
    (OUT/'COMPARACOES.md').write_text('\n'.join(lines)+'\n')

async def routes(context):
    await context.route('https://**/*',shared['external'])
    if BASE_REF:
        assert PHASE=='before', 'A renderização dos blobs Git só se aplica à medição anterior'
        async def baseline(route):
            path=urlsplit(route.request.url).path.lstrip('/') or 'index.html'
            if path in PRESENTATION:
                kind='text/css' if path.endswith('.css') else 'application/javascript' if path.endswith('.js') else 'text/html'
                await route.fulfill(status=200,body=rendered_source(path),content_type=kind)
            else:await route.continue_()
        await context.route('http://127.0.0.1:8080/**',baseline)

AREA = r"""() => {
 const map=document.getElementById('map'),m=map.getBoundingClientRect();
 const selectors=['.floating-search','.edge-tools','.leaflet-control','.mobile-actions',
 '#mapStatus','#coords','#panel','#toolPanel','#aboutPanel','#territorialPanel',
 '#querySheet','#placeResults','.more-menu','#toast.show','.leaflet-popup','#panelBackdrop'];
 const rectangles=[]; const seen=new Set();
 for(const selector of selectors)for(const e of document.querySelectorAll(selector)){
  if(seen.has(e)||e.closest('[hidden]'))continue;seen.add(e);
  const s=getComputedStyle(e),r=e.getBoundingClientRect();
  if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0||!r.width||!r.height)continue;
  const l=Math.max(m.left,r.left),t=Math.max(m.top,r.top),right=Math.min(m.right,r.right),b=Math.min(m.bottom,r.bottom);
  if(right>l&&b>t)rectangles.push({selector,id:e.id,x:l,y:t,right,bottom:b});
 }
 // Sweep vertical slabs and merge y intervals: overlapping panels count once.
 const xs=[...new Set(rectangles.flatMap(r=>[r.x,r.right]))].sort((a,b)=>a-b);
 let blocked=0;
 for(let i=1;i<xs.length;i++){
  const intervals=rectangles.filter(r=>r.x<xs[i]&&r.right>xs[i-1]).map(r=>[r.y,r.bottom]).sort((a,b)=>a[0]-b[0]);
  let start=0,end=0,length=0;
  for(const [a,b]of intervals){if(a>end){length+=end-start;start=a;end=b;}else end=Math.max(end,b);}
  length+=end-start;blocked+=(xs[i]-xs[i-1])*length;
 }
 const total=m.width*m.height;
 return {viewport:[innerWidth,innerHeight],map:{x:m.x,y:m.y,width:m.width,height:m.height},
  total_px2:total,obstructed_px2:blocked,useful_px2:total-blocked,useful_percent:100*(total-blocked)/total,
  occluders:rectangles,method:'Retângulos do DOM intersectados com mapa; união exata por varredura vertical',
  limitations:'Retângulos incluem cantos arredondados transparentes; sombras excluídas. Fundo modal conta como obstrução porque a interação é bloqueada. GIS simulado; não é homologação pública.'};
}"""

PAIRS = r"""elements => {
 const color=v=>{const x=v.match(/[\d.]+/g).map(Number);return [x[0],x[1],x[2],x.length>3?x[3]:1]};
 const over=(a,b)=>{const q=a[3]+b[3]*(1-a[3]);return [0,1,2].map(i=>(a[i]*a[3]+b[i]*b[3]*(1-a[3]))/q).concat(q)};
 const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 return elements.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{
  const chain=[];for(let p=e;p;p=p.parentElement)chain.unshift(p);
  const mapHost=chain.findIndex(p=>p.classList.contains('mapwrap'));
  let bg=mapHost>=0?color(getComputedStyle(document.getElementById('map')).backgroundColor):[255,255,255,1];
  for(const p of chain.slice(mapHost>=0?mapHost:0))bg=over(color(getComputedStyle(p).backgroundColor),bg);
  const s=getComputedStyle(e),parent=e.parentElement;let external=[255,255,255,1];
  for(const p of chain.slice(0,-1))external=over(color(getComputedStyle(p).backgroundColor),external);
  return {id:e.id,tag:e.tagName,text:e.textContent.trim().slice(0,70),state:e.dataset.state||e.getAttribute('aria-pressed')||'',
   foreground:s.color,effective_background:bg,text_ratio:ratio(over(color(s.color),bg),bg),font_px:parseFloat(s.fontSize),
   border:s.borderTopColor,border_ratio_inside:ratio(over(color(s.borderTopColor),bg),bg),
   outline:s.outlineColor,outline_style:s.outlineStyle,outline_offset:s.outlineOffset,outline_width:s.outlineWidth,
   outline_vs_surface:ratio(color(s.outlineColor),bg),outline_vs_white:ratio(color(s.outlineColor),[255,255,255,1]),
   shadow:s.boxShadow,disabled:!!e.disabled,opacity:s.opacity,
   text_criterion:'WCAG 1.4.3: 4,5:1 para texto normal (desabilitados isentos)',component_criterion:'WCAG 1.4.11: 3:1 para limites/ícones identificáveis',focus_criterion:'Foco visível: 3:1 contra superfície adjacente; separador branco medido à parte; sem declaração geral de conformidade WCAG'};
 });
}"""

async def record(page, label, state, zoom=100):
    await page.wait_for_timeout(220)
    # Do not capture transient outage toast in an otherwise comparable state.
    await page.wait_for_function("!document.getElementById('toast').classList.contains('show')")
    row = await page.evaluate(AREA); row.update(label=label,state=state,browser_zoom_percent=zoom)
    assert 0 <= row['obstructed_px2'] <= row['total_px2'] + 1
    ROWS.append(row)
    await page.screenshot(path=str(OUT/f'{PHASE}-{label}-{state}.png'),animations='disabled')

async def inspect(page, label):
    await shared['open_layers'](page)
    await page.locator('#layerSearch').fill('sirene')
    row=page.locator('.layer-control[data-layer-id=sirenes]').first
    await row.scroll_into_view_if_needed()
    await row.locator('.layer-work-button').focus();await page.keyboard.press('Enter')
    assert not await page.locator('#layer_sirenes').is_checked()
    await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab')
    pairs=await page.locator('.layer-work-button[aria-pressed=true],.info-button,#clearLayersBtn,#layerSearch').evaluate_all(PAIRS)
    CONTRASTS.append({'label':label,'state':'working-hidden-keyboard-focus','measurements':pairs})
    if PHASE=='after':
        assert any(p['outline_width']=='3px' and p['outline_vs_white']>=3 and 'rgb(255, 255, 255)' in p['shadow'] for p in pairs)
        assert all(p['border_ratio_inside']>=3 for p in pairs if p['tag']=='INPUT')
        assert all(p['text_ratio']>=4.5 for p in pairs if p['text'] and not p['disabled'])
    await record(page,label,'layer-focus')
    # Actual loaded local collection; this verifies UI, never live GIS availability.
    await page.locator('#layer_sirenes').check()
    await page.wait_for_function('civilDefs[0].layer?.getLayers().length===37')
    await row.scroll_into_view_if_needed();await record(page,label,'layer-visible')
    for source_event,state in [('Carregando','loading'),('Indisponível','error')]:
        # Existing status observer/event contract, with explicitly labelled fixtures.
        await page.evaluate('text=>civilDefs[0].status.textContent=text',source_event)
        await page.wait_for_function('state=>document.querySelector(".layer-control[data-layer-id=sirenes]").dataset.state===state',arg=state)
        CONTRASTS.append({'label':label,'state':state,'source':'evento operacional simulado, não serviço real','measurements':await row.locator('.catalog-operational,.layer-status').evaluate_all(PAIRS)})
        if PHASE=='after':
            assert all(p['text_ratio']>=4.5 for p in CONTRASTS[-1]['measurements'])
        await record(page,label,'layer-'+state)
    await page.evaluate("civilDefs[0].status.textContent='Disponível'")
    await page.locator('#layer_sirenes').uncheck()
    panel_targets=await page.locator('#panel button,#panel input,#panel select,#panel summary').evaluate_all("""es=>es.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return {id:e.id,name:(e.getAttribute('aria-label')||e.textContent).trim().slice(0,70),width:r.width,height:r.height,tag:e.tagName,exempt:false}})""")
    TARGETS.append({'label':label,'state':'layers','controls':panel_targets})
    await page.locator('#closePanel').click()
    await page.locator('#consultBtn').click()
    await page.locator('#queryLayer').focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab')
    CONTRASTS.append({'label':label,'state':'consult-focus','measurements':await page.locator('#queryLayer,#consultBtn,#toolTitle').evaluate_all(PAIRS)})
    await record(page,label,'consult')
    if PHASE=='after':
        assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        # All fixed header controls must fit and remain available.
        for control in ['#headerSearchBtn','#layersBtn','#consultBtn','#portalBtn','#moreBtn']:
            r=await page.locator(control).bounding_box();assert r and r['x']>=0 and r['x']+r['width']<=await page.evaluate('innerWidth'),(label,control,r)
        # Own menu SVGs must not alter the accessible button names.
        for control,name in [('#menuBase','Mapa Base'),('#fullBtnTop','Tela cheia'),('#clearBtn','Limpar camadas')]:
            assert await page.locator(control).get_attribute('aria-label') is None
            assert (await page.locator(control).text_content()).strip()==name
            assert await page.locator(control+' svg').get_attribute('aria-hidden')=='true'
    await page.locator('#exitTool').focus();await page.keyboard.press('Enter')
    await page.wait_for_function("ARPIASUI.mode()==='navigate' && document.getElementById('toolPanel').hidden")
    await page.wait_for_timeout(50)
    FOCUS_RETURNS.append({'label':label,'action':'close active tool by Enter','active':await page.evaluate('({id:document.activeElement.id,tag:document.activeElement.tagName,visible:!!document.activeElement.getClientRects().length,hidden:!!document.activeElement.closest("[hidden]")})'),'scope_note':'Retorno de foco incorreto exige autorização específica para o módulo funcional; registrar o resultado efetivo, sem inferir correção.'})
    # Exemptions, including map editor vertex handles, are recorded, not hidden.
    targets=await page.locator('button,a,input,select,summary,[tabindex="0"]').evaluate_all("""es=>es.filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]')).map(e=>{const r=e.getBoundingClientRect();return {id:e.id,name:(e.getAttribute('aria-label')||e.textContent).trim().slice(0,70),width:r.width,height:r.height,tag:e.tagName,exempt:e.matches('.leaflet-control-attribution a')}})""")
    TARGETS.append({'label':label,'controls':targets})
    await page.emulate_media(reduced_motion='reduce')
    assert await page.locator('.floating-search').evaluate("e=>getComputedStyle(e).transitionDuration==='0s'")
    await page.emulate_media(reduced_motion='no-preference')

async def mobility(page,label):
    await shared['open_layers'](page)
    handle=page.locator('#panel .panel-title-row');panel=page.locator('#panel')
    if label=='desktop':
        for selector in ['.leaflet-control-zoom-in','.leaflet-control-zoom-out']:
            assert await page.locator(selector).evaluate('e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h)}'),selector
        await page.locator('#consultBtn').click()
        await shared['open_layers'](page)
        assert await page.locator('#exitTool').evaluate('e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h)}')
        await page.locator('#exitTool').click()
        await shared['open_layers'](page)
    for modality in ['pointer','touch','keyboard']:
        original=await panel.bounding_box();h=await handle.bounding_box();x=h['x']+35;y=h['y']+25
        if modality=='pointer':
            await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+15,y-25,steps=8);await page.mouse.up()
        elif modality=='touch':
            session=await page.context.new_cdp_session(page)
            for event,points in [('touchStart',[{'x':x,'y':y}]),('touchMove',[{'x':x+12,'y':y-22}]),('touchEnd',[])]:
                await session.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':points})
            await session.detach()
        else:
            await handle.focus();await page.keyboard.press('ArrowUp')
        moved=await panel.bounding_box();assert abs(moved['x']-original['x'])+abs(moved['y']-original['y'])>1,(label,modality,original,moved)
        frame=await page.locator('.app-shell').bounding_box()
        assert moved['x']>=frame['x']-1 and moved['y']>=frame['y']-1 and moved['x']+moved['width']<=frame['x']+frame['width']+1,(label,modality,moved,frame)
        MODALITIES.append({'label':label,'action':'move','modality':modality,'result':'passed','before':original,'after':moved})
    for modality in ['pointer','touch']:
        before=await panel.bounding_box();x=before['x']+before['width']-3;y=before['y']+before['height']-3
        if modality=='pointer':
            await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+20,y-35,steps=8);await page.mouse.up()
        else:
            session=await page.context.new_cdp_session(page)
            for event,points in [('touchStart',[{'x':x,'y':y}]),('touchMove',[{'x':x+20,'y':y-30}]),('touchEnd',[])]:
                await session.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':points})
            await session.detach()
        after=await panel.bounding_box();changed=abs(after['width']-before['width'])+abs(after['height']-before['height'])>2
        if label=='desktop' and modality=='pointer':assert changed,(before,after)
        MODALITIES.append({'label':label,'action':'resize','modality':modality,'observed':changed,'before':before,'after':after,'note':'Somente resize CSS nativo; tentativa por toque sem mudança não comprova suporte.'})
    MODALITIES.append({'label':label,'action':'resize','modality':'keyboard','result':'not-existing','note':'Componente existente usa setas para movimento, não resize; nenhum mecanismo novo adicionado.'})

async def main():
    async with async_playwright() as p:
        executable=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None
        browser=await p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
        for label,w,h in [('desktop',1366,768),('tablet',768,1024),('mobile',390,844),('compact',320,568)]:
            c=await browser.new_context(viewport={'width':w,'height':h},has_touch=True)
            await routes(c);page=await c.new_page()
            await page.goto('http://127.0.0.1:8080',wait_until='load');await page.wait_for_function("typeof ARPIASPortalUI!=='undefined' && catalogSections.length===14")
            await page.screenshot(path=str(OUT/f'{PHASE}-{label}-portal.png'),animations='disabled')
            await page.locator('#portalSkip').click()
            await record(page,label,'closed')
            await page.locator('#moreBtn').click();await record(page,label,'menu')
            CONTRASTS.append({'label':label,'state':'menu','measurements':await page.locator('.more-menu button').evaluate_all(PAIRS)})
            if PHASE=='after':assert all(p['text_ratio']>=4.5 for p in CONTRASTS[-1]['measurements'] if not p['disabled'])
            await page.locator('#moreBtn').click()
            await shared['open_layers'](page);await record(page,label,'open')
            await page.locator('#collapsePanel').click();await record(page,label,'collapsed')
            await page.locator('#collapsePanel').click();await inspect(page,label)
            if PHASE=='after':await mobility(page,label)
            await c.close()
        await browser.close()
        with tempfile.TemporaryDirectory(prefix='arpias-fe03-zoom-') as profile:
            default=Path(profile)/'Default';default.mkdir()
            (default/'Preferences').write_text(json.dumps({'partition':{'default_zoom_level':{'x':math.log(2)/math.log(1.2)}}}))
            c=await p.chromium.launch_persistent_context(profile,executable_path=executable,channel='chromium',headless=True,no_viewport=True,args=['--no-sandbox','--window-size=1366,768'])
            await routes(c);page=c.pages[0];await shared['ready'](page)
            assert await page.evaluate('devicePixelRatio===2 && innerWidth===683')
            for state in ['closed','menu','open']:
                if state=='menu':await page.locator('#moreBtn').click()
                if state=='open':await shared['open_layers'](page)
                row=await page.evaluate(AREA);row.update(label='zoom200',state=state,browser_zoom_percent=200);ROWS.append(row)
                session=await c.new_cdp_session(page);metrics=await session.send('Page.getLayoutMetrics');assert metrics['cssVisualViewport']['zoom']==2
                shot=await session.send('Page.captureScreenshot',{'format':'png','fromSurface':True})
                (OUT/f'{PHASE}-zoom200-{state}.png').write_bytes(base64.b64decode(shot['data']));await session.detach()
                if state=='menu':await page.locator('#moreBtn').click()
            await c.close()
    files={f:hashlib.sha256(rendered_source(f)).hexdigest() for f in PRESENTATION}
    result={'phase':PHASE,'evidence':shared['evidence'](),'code_sha256':files,'area':ROWS,'contrast':CONTRASTS,'targets':TARGETS,
            'modalities':MODALITIES,'focus_returns':FOCUS_RETURNS,'rendered_ref':BASE_REF or 'working tree',
            'method':'Luminância sRGB WCAG 2.x com composição alpha das superfícies efetivas; texto 4,5:1, limites não textuais/foco 3:1. Não é certificação WCAG geral.',
            'passed_groups':5,'external_services':'GIS simulado; não é homologação pública'}
    (OUT/f'fe03-{PHASE}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    comparison()
    print(json.dumps({'phase':PHASE,'passed_groups':5,'area_measurements':len(ROWS),'contrast_states':len(CONTRASTS)},ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
