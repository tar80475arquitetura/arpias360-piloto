"""FE-03 deep corrections: real browser events, controlled GIS fixtures.
The default PNG is a deterministic, opaque synthetic pattern generated locally.
It does not validate the official orthophoto or change any production URL/source.
The shared browser harness still downloads Leaflet/Esri Leaflet from unpkg.com.
Outputs must remain outside the checkout. Native zoom and historical P1 are separate.
"""
import asyncio, os, json, re, hashlib, runpy, tempfile, math, base64, ast, struct, zlib
from pathlib import Path
from datetime import datetime, timezone
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('ARPIAS_TEST_OUTPUT','/tmp/arpias-fe03-deep'))/'deep'
OUT.mkdir(parents=True,exist_ok=True)
shared=runpy.run_path(str(Path(__file__).with_name('browser-operations.py')))
PHASE=os.environ.get('ARPIAS_DEEP_PHASE','after')
PACKAGE_ID='ARPIAS360-FE03-B123-20261012-01'
def synthetic_png():
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    rows=b''.join(b'\0'+bytes(v for x in range(256) for v in ((40,120,180) if (x//32+y//32)%2 else (220,180,60)))for y in range(256))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',256,256,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b'')
fixture_path=os.environ.get('ARPIAS_DEEP_CARTO_FIXTURE')
if fixture_path:
    CARTO=Path(fixture_path).read_bytes()
else:
    CARTO=synthetic_png()
    assert CARTO==synthetic_png(), 'Synthetic PNG must be deterministic'
assert CARTO.startswith(b'\x89PNG\r\n\x1a\n'), 'Raster fixture must be a valid PNG'
(OUT/'cartographic-fixture.png').write_bytes(CARTO)
METADATA={'currentVersion':10.9,'spatialReference':{'wkid':102100},'tileInfo':{'rows':256,'cols':256,'dpi':96,'format':'PNG','origin':{'x':-20037508.342787,'y':20037508.342787},'spatialReference':{'wkid':102100},'lods':[{'level':z,'resolution':156543.03392804097/2**z,'scale':591657527.591555/2**z}for z in range(24)]}}
async def p4(browser):
    records=[]
    for scenario in ['A-valid','B-total-failure','C-partial']:
        context=await browser.new_context(viewport={'width':1366,'height':768})
        requests=[]
        async def route(r):
            url=r.request.url
            if 'Mosaico_2019_mapservice/MapServer' in url:
                tile=re.search(r'/tile/(\d+)/(\d+)/(\d+)',url)
                if tile:
                    valid=scenario=='A-valid' or (scenario=='C-partial' and (int(tile[2])+int(tile[3]))%2==0)
                    status=200 if valid else 404 if scenario=='C-partial' else 503
                    requests.append({'url':url,'status':status})
                    return await r.fulfill(status=status,content_type='image/png'if valid else'text/plain',headers={'access-control-allow-origin':'*'},body=CARTO if valid else 'Controlled tile failure')
                return await r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(METADATA))
            await shared['external'](r)
        await context.route('https://**/*',route)
        page=await context.new_page();await shared['ready'](page)
        await page.wait_for_function("!baseDefs[0].layer.isLoading() && Object.keys(baseDefs[0].layer._tiles||{}).length>0")
        await page.wait_for_timeout(500)
        state=await page.evaluate("""() => {const d=baseDefs[0],tiles=Object.values(d.layer._tiles||{}).map(t=>({src:t.el.src,width:t.el.naturalWidth,height:t.el.naturalHeight,loaded:!!t.loaded,substitute:t.el.src===d.layer.options.errorTileUrl}));return {state:d.state,loaded:d.loaded,errors:d.failedTiles||0,valid:tiles.filter(t=>!t.substitute&&t.width>0&&t.loaded).length,substitutes:tiles.filter(t=>t.substitute).length,tiles,presentation:layerPresentation('base_ortho'),message:document.getElementById('statusMessage').textContent,fallback:!document.getElementById('baseFallback').hidden,onMap:map.hasLayer(d.layer)}}""")
        state.update(scenario=scenario,requests=requests,raster_fixture_present=state['valid']>0,fixture_sha256=hashlib.sha256(CARTO).hexdigest())
        await page.screenshot(path=str(OUT/f'{PHASE}-p4-{scenario}.png'))
        if PHASE!='p4-before':
            if scenario=='A-valid':assert state['valid']>0 and state['errors']==0 and state['loaded'] and not state['fallback'],state
            elif scenario=='B-total-failure':assert state['valid']==0 and state['substitutes']>0 and not state['loaded'] and state['state']=='Indisponível' and state['fallback'] and 'Falha de carregamento'in state['presentation'],state
            else:assert state['valid']>0 and state['errors']>0 and state['substitutes']>0 and state['loaded'] and state['onMap'] and not state['fallback'] and 'parcial'in state['message'].lower(),state
        records.append(state);await context.close()
    return records
async def vectors(browser):
    records=[]
    for result in ['failure','empty']:
        context=await browser.new_context(viewport={'width':1366,'height':768})
        async def route(r):
            if result=='empty' and 'FeatureServer/310' in r.request.url:
                body={'objectIdField':'OBJECTID','objectIdFieldName':'OBJECTID','geometryType':'esriGeometryPolygon','spatialReference':{'wkid':4326},'fields':[{'name':'OBJECTID','type':'esriFieldTypeOID'}],'features':[],'capabilities':'Query','extent':{'xmin':-43.2,'ymin':-23,'xmax':-42.9,'ymax':-22.8,'spatialReference':{'wkid':4326}}}
                if '/query' not in r.request.url:body.pop('features',None)
                return await r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(body))
            await shared['external'](r)
        await context.route('https://**/*',route);page=await context.new_page();await shared['ready'](page)
        await page.wait_for_function("() => {const d=overlayDefs.find(d=>d.id==='bairros');return d.loadFailed||d.status.textContent==='Sem feições nesta área'}")
        row=await page.evaluate("() => {const d=overlayDefs.find(d=>d.id==='bairros');return {raw:d.status.textContent,failed:!!d.loadFailed,presentation:layerPresentation('layer_bairros'),checked:d.input.checked,aliases:[...document.querySelectorAll('[data-control-id=layer_bairros] .catalog-operational')].map(e=>e.textContent)}}")
        if result=='failure':assert row['failed'] and not row['checked'] and 'Falha de carregamento'in row['presentation'],row
        else:assert not row['failed'] and 'nenhuma feição'in row['presentation'] and row['checked'],row
        assert row['presentation'].startswith('EM INTEGRAÇÃO'),row
        assert all('Falha de carregamento'in a if result=='failure'else 'nenhuma feição'in a for a in row['aliases']),row
        row['result']=result;records.append(row);await context.close()
    return records
async def gis_events(browser):
    records=[]
    for scenario in ['empty-after-load','nonempty-before-load','multiple-empty','multiple-mixed','failure-late-success','removed-late-success']:
        context=await browser.new_context(viewport={'width':600,'height':1024});queries=[]
        async def route(r):
            if 'FeatureServer/310' not in r.request.url:return await shared['external'](r)
            query='/query' in r.request.url
            body={'objectIdField':'OBJECTID','objectIdFieldName':'OBJECTID','geometryType':'esriGeometryPolygon','spatialReference':{'wkid':4326},'fields':[{'name':'OBJECTID','type':'esriFieldTypeOID'}],'capabilities':'Query','extent':{'xmin':-43.2,'ymin':-23,'xmax':-42.9,'ymax':-22.8,'spatialReference':{'wkid':4326}}}
            if query:
                n=len(queries);queries.append(r.request.url)
                await asyncio.sleep(.08 if scenario=='failure-late-success' and n==0 else .3 if n else .15)
                if scenario=='failure-late-success' and n==0:return await r.fulfill(status=503,headers={'access-control-allow-origin':'*'},body='Controlled query failure')
                body['features']=[]
                if scenario=='nonempty-before-load' or (scenario=='multiple-mixed' and n==1):body['features']=[{'attributes':{'OBJECTID':999},'geometry':{'rings':[[[-43.1,-22.9],[-43.09,-22.9],[-43.09,-22.89],[-43.1,-22.9]]]}}]
            else:await asyncio.sleep(.05)
            await r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body=json.dumps(body))
        await context.route('https://**/*',route);page=await context.new_page();await shared['ready'](page);await page.wait_for_timeout(350);queries.clear()
        assert await page.evaluate('L.esri.VERSION')=='3.0.12'
        await page.evaluate(r"""scenario => {
            const d=overlayDefs.find(d=>d.id==='bairros');map.removeLayer(d.layer);
            d.layer=L.esri.featureLayer({url:URLS.bairros,minZoom:99,renderer:cartographicRenderer});configureOverlayLoading(d,d.row);d.input.checked=true;
            window.b123Events=[];['loading','requestsuccess','requesterror','load'].forEach(type=>d.layer.on(type,e=>b123Events.push({type,query:/\/query(?:$|\?)/.test(e.url||''),features:Array.isArray(e.response?.features)?e.response.features.length:null,status:d.status.textContent,busy:d.row.getAttribute('aria-busy')})));
            d.layer.addTo(map);d.layer.options.minZoom=0;
            d.layer._requestFeatures(map.getBounds(),{x:321,y:432,z:map.getZoom()});
            if(scenario.startsWith('multiple')||scenario==='failure-late-success')d.layer._requestFeatures(map.getBounds(),{x:322,y:432,z:map.getZoom()});
            if(scenario==='removed-late-success')map.removeLayer(d.layer);
        }""",scenario)
        await page.wait_for_timeout(750)
        row=await page.evaluate("() => {const d=overlayDefs.find(d=>d.id==='bairros');return {events:b123Events,status:d.status.textContent,failed:!!d.loadFailed,checked:d.input.checked,onMap:map.hasLayer(d.layer),responses:d.queryResponses,features:d.queryFeatures,presentation:layerPresentation('layer_bairros')}}")
        if scenario=='empty-after-load':
            assert [e['type']for e in row['events']]==['loading','requestsuccess','load','requestsuccess'],row
            assert row['events'][1]['features']is None and row['events'][3]['features']==0,row
        if scenario in ['empty-after-load','multiple-empty']:
            assert row['status']=='Sem feições nesta área' and not row['failed'],row
            assert all(e['status']!='Disponível'for e in row['events']),row
        elif scenario in ['nonempty-before-load','multiple-mixed']:assert row['status']=='Disponível' and row['features']==1,row
        elif scenario=='failure-late-success':assert row['status']=='Indisponível' and row['failed'] and not row['onMap'],row
        else:assert row['status']!='Disponível' and row['responses']==0 and not row['onMap'],row
        assert row['presentation'].startswith('EM INTEGRAÇÃO'),row
        if scenario in ['empty-after-load','nonempty-before-load']:
            # Exercise confirmed presentation reuse; real Esri cell cache below is separate.
            await page.evaluate("() => {const d=overlayDefs.find(d=>d.id==='bairros');d.layer.fire('loading');d.layer.fire('load');}")
            row['same_view_cache']=await page.evaluate("overlayDefs.find(d=>d.id==='bairros').status.textContent");assert row['same_view_cache']==row['status'],row
            if scenario=='nonempty-before-load':
                row['esri_cache_before']=await page.evaluate("Object.values(overlayDefs.find(d=>d.id==='bairros').layer._cache).flat()")
                assert 999 in row['esri_cache_before'],row
                await page.evaluate("() => {const d=overlayDefs.find(d=>d.id==='bairros'),ids=Object.values(d.layer._cache).flat();d.layer.removeLayers(ids);d.layer.addLayers(ids);}")
                row['esri_cache_restored']=await page.evaluate("map.hasLayer(overlayDefs.find(d=>d.id==='bairros').layer.getFeature(999))");assert row['esri_cache_restored'],row
            await page.evaluate("() => {const d=overlayDefs.find(d=>d.id==='bairros');d.layer.options.minZoom=99;map.panBy([1,0],{animate:false});d.layer.options.minZoom=0;d.layer.fire('loading');d.layer.fire('load');}")
            row['unverified_view']=await page.evaluate("overlayDefs.find(d=>d.id==='bairros').status.textContent");assert row['unverified_view']=='Aguardando carregamento',row
        row.update(scenario=scenario,queries=queries,library='Esri Leaflet 3.0.12',scope='Real library with intercepted GIS; cache lifecycle fire calls are simulated, Esri addLayers cache restoration is real')
        records.append(row);(OUT/'b1-gis-events.json').write_text(json.dumps({'package_id':PACKAGE_ID,'cases':records},ensure_ascii=False,indent=2));await page.screenshot(path=str(OUT/f'b1-{scenario}.png'));await context.close()
    return records
CAMERA="() => ({zoom:map.getZoom(),center:map.getCenter(),geometry:ARPIASUI.workGroup.toGeoJSON(false),hint:document.getElementById('toolHint').textContent})"
async def reachable_handle(page,handle):
    defscript="e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {ok:e===h||e.contains(h),target:h?.id||h?.className,box:{x:r.x,y:r.y,w:r.width,h:r.height}}}"
    initial=await handle.evaluate(defscript);record=initial.copy();record['initial']=initial;record['manual_pan']=False
    if not initial['ok']:
        point=(await page.evaluate(LAYOUT))['point'];assert point,'No free map area for pan'
        zoom=await page.evaluate('map.getZoom()');box=initial['box']
        await page.evaluate('v=>map.panBy(v,{animate:false})',[box['x']+box['w']/2-point['x'],box['y']+box['h']/2-point['y']]);await page.wait_for_timeout(80)
        record={**await handle.evaluate(defscript),'initial':initial,'manual_pan':True};assert await page.evaluate('map.getZoom()')==zoom
    return record
HEADER = """() => {const ids=['headerSearchBtn','layersBtn','consultBtn','portalBtn','moreBtn','locateBtn'];return {viewport:[innerWidth,innerHeight],html:document.documentElement.scrollWidth,body:document.body.scrollWidth,focus:document.activeElement.id,controls:ids.map(id=>document.getElementById(id)).filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.id,x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,focusVisible:e.matches(':focus-visible'),outline:s.outlineStyle,outlineWidth:s.outlineWidth}})}}"""
async def keyboard_to(page,id):
    target=page.locator('#'+id)
    reverse=await target.evaluate('e=>!!(document.activeElement.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_PRECEDING)')
    for _ in range(150):
        if await target.evaluate('e=>e===document.activeElement'):return
        await page.keyboard.press('Shift+Tab'if reverse else'Tab')
    raise AssertionError('Keyboard order did not reach '+id)
async def activate(page,id,method):
    if method=='keyboard':await keyboard_to(page,id);await page.keyboard.press('Enter')
    elif method=='touch':
        r=await page.locator('#'+id).bounding_box();w=await page.evaluate('innerWidth');await page.touchscreen.tap((r['x']+min(w,r['x']+r['width']))/2,r['y']+r['height']/2)
    else:await page.locator('#'+id).click()
async def test_context(pw,browser,label,w,h):
    profile=None
    if label=='zoom200':
        profile=tempfile.TemporaryDirectory(prefix='arpias-deep-200-');d=Path(profile.name)/'Default';d.mkdir();(d/'Preferences').write_text(json.dumps({'partition':{'default_zoom_level':{'x':math.log(2)/math.log(1.2)}}}))
        context=await pw.chromium.launch_persistent_context(profile.name,executable_path=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None,channel='chromium',headless=True,no_viewport=True,has_touch=True,args=['--no-sandbox','--window-size=1366,768'])
    else:context=await browser.new_context(viewport={'width':w,'height':h},has_touch=True)
    await context.route('https://**/*',shared['external']);page=context.pages[0]if context.pages else await context.new_page();cdp=await context.new_cdp_session(page);await cdp.send('Emulation.setTouchEmulationEnabled',{'enabled':True,'maxTouchPoints':2});await shared['ready'](page)
    if label=='zoom200':assert (await cdp.send('Page.getLayoutMetrics'))['cssVisualViewport']['zoom']==2 and await page.evaluate('innerWidth===683&&devicePixelRatio===2')
    return context,page,cdp,profile
async def capture(page,cdp,label,name):
    if label=='zoom200':
        shot=await cdp.send('Page.captureScreenshot',{'format':'png','fromSurface':True});(OUT/name).write_bytes(base64.b64decode(shot['data']))
    else:await page.screenshot(path=str(OUT/name))
async def responsive(pw,browser):
    rows=[]
    for label,w,h in [('desktop',1366,768),('600',600,1024),('599',599,1024),('768',768,1024),('899',899,1024),('390',390,844),('320',320,568),('zoom200',683,340)]:
        for method in ['mouse','touch','keyboard']:
            context,page,cdp,profile=await test_context(pw,browser,label,w,h)
            row={'label':label,'method':method,'states':[]}
            row['states'].append({'action':'initial',**await page.evaluate(HEADER)})
            if method=='keyboard':
                await keyboard_to(page,'moreBtn');await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');assert await page.locator('#moreBtn').evaluate('e=>e===document.activeElement')
                focused=await page.evaluate(HEADER);assert next(x for x in focused['controls']if x['id']=='moreBtn')['focusVisible'];row['states'].append({'action':'Tab/Shift+Tab',**focused})
            await activate(page,'moreBtn',method);assert await page.locator('#moreMenu').is_visible();row['states'].append({'action':'menu',**await page.evaluate(HEADER)})
            await activate(page,'measureBtn',method);await page.wait_for_function("ARPIASUI.mode()==='measure'")
            await activate(page,'layersBtn',method);await page.wait_for_timeout(100);row['states'].append({'action':'measure/layers',**await page.evaluate(HEADER)})
            await activate(page,'closePanel',method);row['states'].append({'action':'closed',**await page.evaluate(HEADER)})
            row['fits']=all(s['body']<=s['viewport'][0]and s['html']<=s['viewport'][0]and all(x['x']>=0 and x['right']<=s['viewport'][0]+.5 and x['bottom']<=s['viewport'][1]for x in s['controls'])for s in row['states'])
            if PHASE not in ['p2-before','p3-before']:assert row['fits'],row
            await capture(page,cdp,label,f'{PHASE}-p2-{label}-{method}.png');rows.append(row);await context.close()
            if profile:profile.cleanup()
    return rows
tree=ast.parse((ROOT/'tests/browser-fe03-corrective.py').read_text())
LAYOUT=next(ast.literal_eval(n.value)for n in tree.body if isinstance(n,ast.Assign)and any(isinstance(k,ast.Name)and k.id=='LAYOUT'for k in n.targets))
async def edit_visibility(pw,browser):
    rows=[]
    for label,w,h,count in [('600',600,1024,1),('600-multiple',600,1024,3),('390',390,844,1),('320',320,568,1),('desktop',1366,768,1),('zoom200',683,340,1)]:
        context,page,cdp,profile=await test_context(pw,browser,label,w,h)
        await page.locator('#moreBtn').click();await page.locator('#editBtn').click();await page.locator('#confirmAccept').click()
        for i in range(count):
            await page.locator('#drawPoint').click();point=(await page.evaluate(LAYOUT))['point'];assert point
            # UI placement at the free point; pan a little between multiple points to vary positions.
            await page.mouse.click(point['x'],point['y']);await page.locator('#workForm [name=titulo]').fill(f'Deep point {i}');await page.locator('#workForm button[type=submit]').click()
            if i<count-1:await page.mouse.move(point['x']+50,point['y']-50);await page.mouse.wheel(0,-100);await page.wait_for_timeout(400)
        original=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)')
        camera_before=await page.evaluate(CAMERA);await page.locator('#editGeometry').click();await page.wait_for_timeout(400);camera_after=await page.evaluate(CAMERA);assert camera_after['zoom']==camera_before['zoom'],(camera_before,camera_after)
        unchanged=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)');assert [x['geometry']for x in original['features']]==[x['geometry']for x in unchanged['features']],'Visibility adjustment changed work geometry'
        markers=page.locator('.leaflet-marker-draggable');hits=[]
        for i in range(await markers.count()):
            marker=markers.nth(i);hit=await reachable_handle(page,marker);hits.append(hit)
        assert hits
        r=(await reachable_handle(page,markers.nth(0)))['box'];x=r['x']+r['w']/2;y=r['y']+r['h']/2
        await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+15,y-15,steps=8);await page.mouse.up()
        await page.locator('#finishGeometry').click();edited=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)');moved=original['features'][0]['geometry']!=edited['features'][0]['geometry']
        await page.locator('#saveWork').click();await page.reload();await shared['enter_map'](page);await page.wait_for_function('n=>ARPIASUI.workGroup.getLayers().length===n',arg=count)
        restored=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)');persisted=[f['geometry']for f in edited['features']]==[f['geometry']for f in restored['features']]
        await page.locator('#moreBtn').click();await page.locator('#measureBtn').click();await page.locator('#exitTool').click();await page.locator('#moreBtn').click();await page.locator('#editBtn').click();await page.locator('#confirmAccept').click();await page.locator('#editGeometry').click();await page.wait_for_timeout(300)
        row={'label':label,'camera_before':camera_before,'camera_after':camera_after,'count':count,'hits':hits,'moved':moved,'persisted':persisted,'original':original,'edited':edited,'restored':restored,'mode_after_switch':await page.evaluate('ARPIASUI.mode()')}
        if PHASE!='p3-before':assert all(h['ok']for h in hits)and moved and persisted,row
        await capture(page,cdp,label,f'{PHASE}-p3-{label}.png');rows.append(row);(OUT/'b2-edit-incremental.json').write_text(json.dumps({'package_id':PACKAGE_ID,'cases':rows},ensure_ascii=False,indent=2));await context.close()
        if profile:profile.cleanup()
    return rows
async def edit_shapes(pw,browser):
    rows=[]
    for label,w,h,kind in [('600-touch',600,1024,'point'),('600-line',600,1024,'line'),('390-polygon',390,844,'polygon'),('600-selection',600,1024,'point')]:
        context,page,cdp,profile=await test_context(pw,browser,label,w,h)
        if label=='600-selection':
            await page.locator('#headerSearchBtn').click();await page.locator('#searchMirror').fill('-22.9, -43.1');await page.locator('#searchMirrorBtn').click();await page.wait_for_function("ARPIASUI.selection()?.feature.geometry.type==='Point'")
        selected=await page.evaluate('JSON.stringify(ARPIASUI.selection()?.feature||null)')
        await page.locator('#moreBtn').click();await page.locator('#editBtn').click();await page.locator('#confirmAccept').click()
        await page.locator('#'+{'point':'drawPoint','line':'drawLine','polygon':'drawPolygon'}[kind]).click()
        point=await page.evaluate("""() => {const r=document.getElementById('map').getBoundingClientRect(),found=[];for(let i=2;i<28;i++)for(let j=2;j<28;j++){const x=r.x+r.width*i/30,y=r.y+r.height*j/30;if([[-60,-60],[60,-60],[0,60]].every(([dx,dy])=>{const h=document.elementFromPoint(x+dx,y+dy);return h&&document.getElementById('map').contains(h)&&!h.closest('.leaflet-control,.floating-search,#mapStatus,#coords,.leaflet-marker-icon,.leaflet-popup')}))found.push({x,y,d:(x-r.x-r.width/2)**2+(y-r.y-r.height/2)**2})}return found.sort((a,b)=>a.d-b.d)[0]}""");assert point
        offsets=[(0,0)]if kind=='point'else[(-60,-60),(60,-60)]if kind=='line'else[(-60,-60),(60,-60),(0,60)]
        for dx,dy in offsets:await page.mouse.click(point['x']+dx,point['y']+dy);await page.wait_for_timeout(150)
        if kind!='point':await page.locator('#finishDrawing').click()
        await page.locator('#workForm [name=titulo]').fill(label);await page.locator('#workForm button[type=submit]').click();original=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)')
        camera_before=await page.evaluate(CAMERA);await page.locator('#editGeometry').click();await page.wait_for_timeout(350);camera_after=await page.evaluate(CAMERA);assert camera_after['zoom']==camera_before['zoom'],(camera_before,camera_after)
        stable=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)');assert original['features'][0]['geometry']==stable['features'][0]['geometry']
        assert selected==await page.evaluate('JSON.stringify(ARPIASUI.selection()?.feature||null)')
        handles=page.locator('.leaflet-marker-draggable'if kind=='point'else'.leaflet-editing-icon');hits=[]
        for i in range(await handles.count()):hits.append(await handles.nth(i).evaluate("e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {ok:e===h||e.contains(h),x:r.x+r.width/2,y:r.y+r.height/2,target:h?.id||h?.className}}"))
        (OUT/'p3-handle-diagnostic.json').write_text(json.dumps({'label':label,'kind':kind,'hits':hits},ensure_ascii=False,indent=2))
        assert hits and all(x['ok']for x in hits),hits
        x,y=hits[0]['x'],hits[0]['y']
        if label=='600-touch':
            await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':0}]})
            for k in range(1,9):await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+12*k/8,'y':y-12*k/8,'id':0}]});await page.wait_for_timeout(25)
            await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        else:await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+12,y-12,steps=8);await page.mouse.up()
        await page.locator('#finishGeometry').click();edited=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)');assert edited['features'][0]['geometry']!=original['features'][0]['geometry']
        assert selected==await page.evaluate('JSON.stringify(ARPIASUI.selection()?.feature||null)')
        await page.locator('#saveWork').click();await page.reload();await shared['enter_map'](page);await page.wait_for_function('ARPIASUI.workGroup.getLayers().length===1');restored=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)');assert restored['features'][0]['geometry']==edited['features'][0]['geometry']
        await capture(page,cdp,label,f'{PHASE}-p3-{label}.png');rows.append({'label':label,'camera_before':camera_before,'camera_after':camera_after,'geometry':kind,'hits':hits,'selection_preserved':True,'view_only_adjustment':True,'drag_changed_geometry':True,'persisted':True});await context.close()
    return rows
async def edit_extent(pw,browser):
    context,page,cdp,profile=await test_context(pw,browser,'extent600',600,1024)
    await page.locator('#moreBtn').click();await page.locator('#editBtn').click();await page.locator('#confirmAccept').click()
    await page.evaluate("""() => {map.setZoom(11,{animate:false});const l=L.polyline([[80,300],[550,850]].map(p=>map.containerPointToLatLng(p)));l._arpiasWork=true;l.feature={type:'Feature',geometry:l.toGeoJSON(false).geometry,properties:{titulo:'Synthetic work extent'}};ARPIASUI.workGroup.addLayer(l);} """)
    before=await page.evaluate(CAMERA);await page.locator('#editGeometry').click();await page.wait_for_timeout(400);after=await page.evaluate(CAMERA)
    assert before['zoom']==11 and after['zoom']==11,(before,after)
    assert before['geometry']==after['geometry'] and 'Escala preservada'in after['hint'],(before,after)
    handles=page.locator('.leaflet-editing-icon');hits=[]
    for i in range(await handles.count()):hits.append(await reachable_handle(page,handles.nth(i)))
    assert len(hits)==3 and all(h['ok']for h in hits),hits
    assert any(h['manual_pan']for h in hits),'Broad extent should require access by pan'
    point=await page.evaluate("""() => {const r=document.getElementById('map').getBoundingClientRect(),found=[];for(let i=1;i<20;i++)for(let j=1;j<30;j++){const x=r.x+r.width*i/20,y=r.y+r.height*j/30;if([0,5,10,15,20].every(dx=>{const h=document.elementFromPoint(x+dx,y);return h&&document.getElementById('map').contains(h)&&!h.closest('.leaflet-marker-icon,.leaflet-interactive,.leaflet-control,.floating-search,#mapStatus,#coords,.leaflet-popup')}))found.push({x,y,d:(x-r.x-r.width/2)**2+(y-r.y-r.height/2)**2})}return found.sort((a,b)=>a.d-b.d)[0]}""");assert point
    pan_before=await page.evaluate(CAMERA);await page.mouse.move(point['x'],point['y']);await page.mouse.down();await page.mouse.move(point['x']+20,point['y'],steps=8);await page.mouse.up();await page.wait_for_timeout(200);pan_after=await page.evaluate(CAMERA)
    assert pan_before['center']!=pan_after['center'] and pan_after['zoom']==11 and pan_before['geometry']==pan_after['geometry'],(pan_before,pan_after)
    await page.locator('#finishGeometry').click();await page.locator('#saveWork').click();saved=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)');await page.reload();await shared['enter_map'](page);await page.wait_for_function('ARPIASUI.workGroup.getLayers().length===1');restored=await page.evaluate('ARPIASUI.workGroup.toGeoJSON(false)');assert [f['geometry']for f in saved['features']]==[f['geometry']for f in restored['features']]
    row={'package_id':PACKAGE_ID,'label':'extent600','camera_before':before,'camera_after':after,'hits':hits,'pan_before':pan_before,'pan_after':pan_after,'saved':saved,'restored':restored,'scope':'Synthetic work geometry reproducing prior 11-to-10 extent; real mouse pan and persistence'}
    (OUT/'b2-extent.json').write_text(json.dumps(row,ensure_ascii=False,indent=2));await page.screenshot(path=str(OUT/'b2-extent.png'));await context.close();return row
BOX=r'''() => {
 const result={viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,touchZoom:map.touchZoom?.enabled(),zoom:map.getZoom(),boxes:{},buttons:[]};
 for(const sel of ['#panel','#toolPanel','.leaflet-control-zoom','#panelBackdrop','.mapwrap','.leaflet-top.leaflet-left','#panel .panel-scroll','#panel .panel-title-row','#panel .panel-footer']){
  const e=document.querySelector(sel),r=e.getBoundingClientRect(),c=getComputedStyle(e);result.boxes[sel]={box:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},zIndex:c.zIndex,position:c.position,pointerEvents:c.pointerEvents,display:c.display,visibility:c.visibility,transform:c.transform,hidden:e.hidden,clientHeight:e.clientHeight,scrollHeight:e.scrollHeight,overflowY:c.overflowY};
 }
 for(const sel of ['.leaflet-control-zoom-in','.leaflet-control-zoom-out']){const e=document.querySelector(sel),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);result.buttons.push({selector:sel,center:{x,y},disabled:e.classList.contains('leaflet-disabled'),hit:{tag:h?.tagName,id:h?.id,className:h?.className,text:h?.textContent?.trim().slice(0,80),noPainel:document.getElementById('panel').contains(h)},atingivel:e===h||e.contains(h)});}
 return result;
}'''
async def setup(p,state):
 hidden=await p.locator('#panel').evaluate("e=>e.classList.contains('hidden')")
 if state=='fechado':
  if not hidden:await p.locator('#closePanel').click()
 else:
  if hidden:await shared['open_layers'](p)
  collapsed=await p.locator('#panel').evaluate("e=>e.classList.contains('is-collapsed')")
  if collapsed!=(state=='recolhido'):await p.locator('#collapsePanel').click()
 await p.wait_for_timeout(100)
async def snapshot(p):return await p.evaluate("({zoom:map.getZoom(),center:map.getCenter(),events:window.__c05TouchEvents.slice(-12),panelAberto:!document.getElementById('panel').classList.contains('hidden')})")
async def reset_zoom(p):
 await p.evaluate("map.setZoom(Math.max(map.getMinZoom()+2,Math.min(10,map.getMaxZoom()-2)),{animate:false});window.__c05TouchEvents=[]");await p.wait_for_timeout(100)
async def touches(cdp,kind,points):await cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
async def audit(p,c,label,state,native=False):
 await setup(p,state);boxes=await p.evaluate(BOX);metrics=await c.send('Page.getLayoutMetrics');row={'ambiente':label,'estado':state,'hora_utc':datetime.now(timezone.utc).isoformat(),'zoom_nativo':metrics['cssVisualViewport'].get('zoom'),'DOM':boxes,'interacoes':[]}
 if native:assert metrics['cssVisualViewport']['zoom']==2 and boxes['viewport'][0]==683 and boxes['dpr']==2
 if native:
  shot=await c.send('Page.captureScreenshot',{'format':'png','fromSurface':True});(OUT/f'layout-{label}-{state}.png').write_bytes(base64.b64decode(shot['data']))
 else:await p.screenshot(path=str(OUT/f'layout-{label}-{state}.png'),animations='disabled')
 for b in boxes['buttons']:
  await setup(p,state);await reset_zoom(p);before=await snapshot(p);await p.touchscreen.tap(b['center']['x'],b['center']['y']);await p.wait_for_timeout(500);after=await snapshot(p);expected='aumentar'if b['selector'].endswith('-in')else'diminuir'
  diff=after['zoom']-before['zoom'];ok=diff>0 if expected=='aumentar'else diff<0
  row['interacoes'].append({'tipo':'toque no botão '+expected,'antes':before,'depois':after,'respondeu':ok,'delta_zoom':diff,'hit_previo':b['hit'],'atingivel_previo':b['atingivel']})
 for kind in ['pan-toque','pinca-ampliar','pinca-reduzir']:
  await setup(p,state);await reset_zoom(p);layout=await p.evaluate(LAYOUT);point=layout['point']
  if not point:row['interacoes'].append({'tipo':kind,'limite':'Não foi localizada região livre','respondeu':False});continue
  if kind!='pan-toque':
   point=await p.evaluate("""() => {const m=document.getElementById('map').getBoundingClientRect(),c=[];for(let j=1;j<30;j++)for(let i=1;i<30;i++){let x=m.x+m.width*i/30,y=m.y+m.height*j/30;if(x-55<m.left+2||x+55>m.right-2)continue;const ok=[-55,-25,0,25,55].every(d=>{const h=document.elementFromPoint(x+d,y);return h&&document.getElementById('map').contains(h)&&!h.closest('.leaflet-control,.floating-search,#mapStatus,#coords,.mobile-actions')});if(ok)c.push({x,y,d:(x-m.x-m.width/2)**2+(y-m.y-m.height/2)**2})}return c.sort((a,b)=>a.d-b.d)[0]||null}""")
  if not point:row['interacoes'].append({'tipo':kind,'limite':'Região para dois dedos não encontrada','respondeu':False});continue
  x,y=point['x'],point['y']
  points=[(x,y)] if kind=='pan-toque'else[(x-25,y),(x+25,y)]if kind=='pinca-ampliar'else[(x-55,y),(x+55,y)]
  targets=await p.evaluate("pts=>pts.map(([x,y])=>{const h=document.elementFromPoint(x,y);return {x,y,noMapa:document.getElementById('map').contains(h),noPainel:document.getElementById('panel').contains(h)}})",points)
  if not all(t['noMapa']for t in targets):row['interacoes'].append({'tipo':kind,'limite':'Dois pontos livres não confirmados','pontos':targets,'respondeu':False});continue
  before=await snapshot(p)
  await touches(c,'touchStart',[{'x':a,'y':b,'id':i}for i,(a,b)in enumerate(points)])
  for step in range(1,9):
   t=step/8
   if kind=='pan-toque':moved=[(x+30*t,y)]
   elif kind=='pinca-ampliar':moved=[(x-25-30*t,y),(x+25+30*t,y)]
   else:moved=[(x-55+30*t,y),(x+55-30*t,y)]
   await touches(c,'touchMove',[{'x':a,'y':b,'id':i}for i,(a,b)in enumerate(moved)]);await p.wait_for_timeout(35)
  await touches(c,'touchEnd',[]);await p.wait_for_timeout(600);after=await snapshot(p)
  ok=before['center']!=after['center']if kind=='pan-toque'else after['zoom']>before['zoom']if kind=='pinca-ampliar'else after['zoom']<before['zoom']
  row['interacoes'].append({'tipo':kind,'antes':before,'depois':after,'pontos_livres':targets,'respondeu':ok,'delta_zoom':after['zoom']-before['zoom']})
 await setup(p,state)
 if native:
  shot=await c.send('Page.captureScreenshot',{'format':'png','fromSurface':True});(OUT/f'layout-{label}-{state}-apos.png').write_bytes(base64.b64decode(shot['data']))
 else:await p.screenshot(path=str(OUT/f'layout-{label}-{state}-apos.png'),animations='disabled')
 return row
async def zoom_matrix(pw,browser):
    rows=[]
    expected={'desktop':[[True,True]]*3,'tablet':[[True,True],[False,False],[False,True]],'critico600':[[True,True],[False,False],[False,True]],'critico899':[[True,True],[False,False],[False,True]],'celular':[[True,True]]*3,'compacto':[[True,True],[False,False],[True,True]],'zoom200':[[True,True],[False,False],[False,True]]}
    for label,w,h in [('desktop',1366,768),('tablet',768,1024),('critico600',600,1024),('critico899',899,1024),('celular',390,844),('compacto',320,568),('zoom200',683,340)]:
        for i,state in enumerate(['fechado','aberto','recolhido']):
            context,page,cdp,profile=await test_context(pw,browser,label,w,h)
            await page.evaluate("window.__c05TouchEvents=[];['touchstart','touchmove','touchend'].forEach(type=>document.addEventListener(type,e=>window.__c05TouchEvents.push({type,target:e.target.id||e.target.className,points:[...e.touches].map(t=>({x:t.clientX,y:t.clientY}))}),{capture:true,passive:true}))")
            row=await audit(page,cdp,label,state,label=='zoom200');row['historical']=expected[label][i]
            actual=[b['atingivel']for b in row['DOM']['buttons']];row['regressions']=[j for j in range(2)if row['historical'][j]and not actual[j]]
            assert not row['regressions'],row
            assert all(x['respondeu']for x in row['interacoes'][2:]),row
            assert all(x['respondeu']for j,x in enumerate(row['interacoes'][:2])if row['historical'][j]),row
            rows.append(row);(OUT/'zoom-matrix-incremental.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));await context.close()
            if profile:profile.cleanup()
    return rows
async def main():
    report={'phase':PHASE,'evidence':shared['evidence'](),'package_id':PACKAGE_ID,'fixture':{'origin':'explicit-local-override'if fixture_path else'synthetic-local-stdlib','bytes':len(CARTO),'sha256':hashlib.sha256(CARTO).hexdigest(),'scope':'Opaque synthetic raster in controlled responses; NOT orthophoto/GIS service validation','CDN_dependency':'shared harness still downloads Leaflet/Esri from unpkg.com'},'p4':[]}
    async with async_playwright()as pw:
        browser=await pw.chromium.launch(executable_path=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None,headless=True,args=['--no-sandbox'])
        if PHASE not in ['p2-before','p3-before']:
            report['p4']=await p4(browser)
            if PHASE!='p4-before':report['vectors']=await vectors(browser)
            if PHASE=='after':report['b1']=await gis_events(browser)
        if PHASE in ['p2-before','p2-after','after']:report['p2']=await responsive(pw,browser)
        if PHASE in ['p3-before','p3-after','after']:
            report['p3']=await edit_visibility(pw,browser)
            if PHASE!='p3-before':
                report['p3_extra']=await edit_shapes(pw,browser)
                report['b2_extent']=await edit_extent(pw,browser)
        if PHASE=='after':report['zoom_matrix']=await zoom_matrix(pw,browser)
        await browser.close()
    (OUT/f'{PHASE}-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    if 'zoom_matrix'in report:
        report['summary']={'p4_passed':len(report['p4']),'vector_passed':len(report['vectors']),'b1_passed':len(report['b1']),'header_passed':len(report['p2']),'edit_passed':len(report['p3'])+len(report['p3_extra'])+1,'zoom_hits_passed':sum(b['atingivel']for r in report['zoom_matrix']for b in r['DOM']['buttons']),'zoom_hits_failed':sum(not b['atingivel']for r in report['zoom_matrix']for b in r['DOM']['buttons']),'historical_P1_unfixed':True,'new_regressions':sum(len(r['regressions'])for r in report['zoom_matrix']),'map_gestures_passed':sum(i['respondeu']for r in report['zoom_matrix']for i in r['interacoes'][2:]),'skipped':0}
        (OUT/f'{PHASE}-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(report['summary']))
    print(json.dumps({'phase':PHASE,'p4':[{k:r[k]for k in ['scenario','valid','errors','substitutes','state','presentation','message']}for r in report['p4']]},ensure_ascii=False))
if __name__=='__main__':asyncio.run(main())
