"""Operational regression checks. Requires Playwright Python and system Chromium.
Run the existing server on 8080 before this script. External GIS requests deliberately
return 503: these scenarios validate local data/UI and failure isolation, not live GIS.
CDN dependencies are downloaded with the system TLS trust (no ignored certificates).
"""
import asyncio
import json
import os
from pathlib import Path
import urllib.request
import subprocess
from datetime import datetime, timezone
from playwright.async_api import async_playwright

OUT=Path(os.environ.get('ARPIAS_TEST_OUTPUT','/tmp/arpias-operations'))
OUT.mkdir(parents=True,exist_ok=True)
CDN={}
for path in ['leaflet@1.9.4/dist/leaflet.js','leaflet@1.9.4/dist/leaflet.css','esri-leaflet@3.0.12/dist/esri-leaflet.js']:
    url='https://unpkg.com/'+path
    with urllib.request.urlopen(url,timeout=30) as response:
        CDN[url]=(response.headers.get('Content-Type'),response.read())


def evidence():
    return {'sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
            'dirty':bool(subprocess.check_output(['git','status','--porcelain'],text=True)),
            'recorded_at':datetime.now(timezone.utc).isoformat(),
            'github_run_id':os.environ.get('GITHUB_RUN_ID')}

async def external(route):
    url=route.request.url
    if url in CDN:
        content_type,body=CDN[url]
        await route.fulfill(status=200,content_type=content_type,headers={'access-control-allow-origin':'*'},body=body)
    else:
        await route.fulfill(status=503,headers={'access-control-allow-origin':'*'},body='External outage simulated by test')

async def ready(page):
    await page.goto('http://127.0.0.1:8080',wait_until='load')
    await page.wait_for_function("typeof ARPIASOperations!=='undefined' && catalogSections.length===14")

async def open_layers(page):
    if await page.locator('#panel').evaluate("e=>e.classList.contains('hidden')"):
        await page.locator('#layersBtn').click()
    await page.wait_for_timeout(250)

async def choose_sirens(page):
    await open_layers(page)
    await page.locator('#layerSearch').fill('sirene')
    await page.locator('[data-layer-id="sirenes"] .layer-target').first.click()
    await page.locator('#workingLayerPanel').scroll_into_view_if_needed()

async def main():
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None,headless=True,args=['--no-sandbox'])
        context=await browser.new_context(viewport={'width':1366,'height':768},permissions=['geolocation','clipboard-read','clipboard-write'],geolocation={'latitude':-22.9,'longitude':-43.1})
        await context.route('https://**/*',external)
        page=await context.new_page();errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        await ready(page)
        assert await page.locator('#catalogSearchStatus').text_content()=='14 categorias · 126 itens no catálogo', await page.locator('#catalogSearchStatus').text_content()
        await choose_sirens(page)
        assert not await page.locator('#layer_sirenes').is_checked(), 'Choosing a working layer must not change visibility'
        await page.locator('#workingVisibility').click()
        await page.wait_for_function("civilDefs[0].layer?.getLayers().length===37")
        slider=page.locator('#workingOpacity input')
        await slider.fill('40');await slider.dispatch_event('input')
        assert await page.evaluate('civilDefs[0].layer.getLayers().every(l=>l.options.opacity===.4)')
        await page.locator('#workingFit').click()
        await page.wait_for_function("map.getBounds().contains(civilDefs[0].layer.getBounds())")
        await page.locator('#workingConsult').click()
        assert await page.locator('#queryLayer').input_value()=='sirenes'
        await page.evaluate("map.fire('click',{latlng:civilDefs[0].layer.getLayers()[0].getLatLng()})")
        await page.wait_for_function("ARPIASUI.selection()?.meta.layerId==='sirenes'")
        assert await page.locator('#territorialPanel').is_visible()
        await page.get_by_role('button',name='Copiar coordenadas',exact=True).first.click()
        assert ',' in await page.evaluate('navigator.clipboard.readText()')
        await page.locator('#territorialPanel').get_by_role('button',name='Enquadrar seleção',exact=True).click()
        snapshot=await page.evaluate('JSON.stringify(ARPIASUI.selection().feature)')
        await page.locator('#closeTerritorial').click()
        await page.locator('#exitTool').click()
        assert await page.evaluate('JSON.stringify(ARPIASUI.selection().feature)')==snapshot
        await page.evaluate("selectBase(baseDefs[1]);selectBase(baseDefs[2]);selectBase(baseDefs[0])")
        assert await page.evaluate('JSON.stringify(ARPIASUI.selection().feature)')==snapshot
        assert await page.evaluate("map.getPane('arpiasSelection').style.pointerEvents")=='none'
        assert await page.evaluate("Number(map.getPane('arpiasSelection').style.zIndex)>Number(getComputedStyle(map.getPane('markerPane')).zIndex)")
        results.append('working layer, 37 real sirens, visibility, opacity, bounds, query priority, copy, durable selection and base changes')
        await page.locator('#moreBtn').click();await page.locator('#showSelectionBtn').click()
        assert await page.locator('#territorialPanel').is_visible()
        await page.locator('#closeTerritorial').click()
        await page.locator('#consultBtn').click();await page.locator('#queryLayer').select_option('auto')
        await page.evaluate("const d=civilDefs[0],l=d.layer.getLayers()[1];l.fire('click',{latlng:l.getLatLng()})")
        await page.wait_for_function("ARPIASUI.selection()?.meta.layerId==='sirenes'")
        await page.locator('#closeTerritorial').click()
        await page.locator('#queryLayer').select_option('bairros')
        await page.evaluate("map.fire('click',{latlng:L.latLng(-22.9,-43.1)})")
        await page.wait_for_function("document.getElementById('toolHint').textContent.includes('indisponível')",timeout=16000)
        await page.locator('#exitTool').click()
        results.append('automatic visible-feature query and explicit 503 query failure without fabricated result')
        await choose_sirens(page)
        await page.locator('#layerSearch').fill('');await page.wait_for_timeout(200)
        await page.evaluate("document.querySelector('[data-group=environment]').open=true;selectBase(baseDefs[1])")
        await page.wait_for_timeout(350)
        await page.reload(wait_until='load');await page.wait_for_function("catalogSections.length===14 && civilDefs[0].layer")
        assert await page.locator('#base_osm').is_checked()
        assert await page.locator('#layer_sirenes').is_checked()
        assert await page.evaluate('civilDefs[0].layer.getLayers()[0].options.opacity')==.4
        assert await page.locator('#workingLayerName').inner_text()=='Sirenes de alerta'
        assert await page.locator('[data-group=environment]').evaluate('e=>e.open')
        results.append('reload restores layer visibility, opacity, base, working layer and category expansion')
        await page.locator('#closePanel').click()
        await page.locator('#headerSearchBtn').click();await page.locator('#searchMirror').fill('-22.9, -43.1');await page.locator('#searchMirrorBtn').click()
        await page.wait_for_function("ARPIASUI.selection()?.meta.origin==='search'")
        await page.evaluate('map.closePopup()')
        await page.locator('#locateBtn').click();await page.wait_for_function('userMarker!==null')
        assert abs(await page.evaluate('userMarker.getLatLng().lat')+22.9)<.00001
        await page.evaluate('map.closePopup()')
        results.append('coordinate search and simulated geolocation with replaceable marker')
        await page.locator('#moreBtn').click();await page.locator('#measureBtn').click()
        await page.locator('#measureDistance').click()
        await page.wait_for_timeout(300)
        bounds=await page.locator('#map').bounding_box()
        for x,y in [(bounds['width']*.55,bounds['height']*.35),(bounds['width']*.7,bounds['height']*.4)]:
            await page.mouse.click(bounds['x']+x,bounds['y']+y)
            await page.wait_for_timeout(200)
        await page.locator('#finishDrawing').click()
        await page.screenshot(path=str(OUT/'measure-distance.png'))
        assert 'Distância:' in await page.locator('#toolResult').text_content(), {'result':await page.locator('#toolResult').text_content(),'hint':await page.locator('#toolHint').text_content(),'errors':errors}
        await page.locator('#clearMeasure').click()
        assert await page.evaluate('ARPIASUI.measureGroup.getLayers().length')==0
        await page.locator('#measureArea').click()
        for x,y in [(bounds['width']*.55,bounds['height']*.35),(bounds['width']*.7,bounds['height']*.35),(bounds['width']*.65,bounds['height']*.55)]:
            await page.mouse.click(bounds['x']+x,bounds['y']+y)
            await page.wait_for_timeout(200)
        await page.locator('#finishDrawing').click()
        assert 'Área:' in await page.locator('#toolResult').text_content(), await page.locator('#toolHint').text_content()
        await page.locator('#clearMeasure').click();await page.locator('#measureDistance').click();await page.keyboard.press('Escape')
        await page.locator('#exitTool').click()
        results.append('distance, area, clear measurement and Escape cancellation')
        # Preference reset must not erase separately stored drawings.
        await page.evaluate("localStorage.setItem('arpias360.workspace.v1','sentinel-preserved')")
        await page.locator('#moreBtn').click();await page.locator('#resetPreferences').click();await page.locator('#confirmAccept').click()
        assert await page.evaluate("localStorage.getItem('arpias360.workspace.v1')")=='sentinel-preserved'
        await page.evaluate("localStorage.removeItem('arpias360.workspace.v1')")
        assert await page.locator('#workingLayerControls').is_hidden()
        results.append('reset affects only map preferences')
        # Drag, reload and resize of secondary panels, using actual pointer events.
        await page.locator('#moreBtn').click();await page.locator('#measureBtn').click()
        handle=await page.locator('#toolTitle').bounding_box()
        await page.mouse.move(handle['x']+10,handle['y']+10);await page.mouse.down();await page.mouse.move(900,240,steps=8);await page.mouse.up()
        await page.wait_for_timeout(350)
        assert await page.evaluate("JSON.parse(localStorage.getItem(ARPIASPreferences.key)).windows.toolPanel.x>0")
        await page.reload(wait_until='load');await page.wait_for_function("catalogSections.length===14")
        await page.locator('#moreBtn').click();await page.locator('#measureBtn').click()
        assert await page.locator('#toolPanel').evaluate('e=>parseFloat(e.style.left)>0')
        await page.set_viewport_size({'width':1024,'height':768});await page.wait_for_timeout(300)
        box=await page.locator('#toolPanel').bounding_box();assert box['x']>=0 and box['x']+box['width']<=1024
        await page.locator('#exitTool').click()
        results.append('secondary-panel drag, saved position and clamping after resize')
        assert not errors,errors
        await context.close()
        for width,height in [(1920,1080),(1366,768),(1024,768),(768,1024),(390,844),(320,568)]:
            c=await browser.new_context(viewport={'width':width,'height':height});await c.route('https://**/*',external)
            pg=await c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await ready(pg);await choose_sirens(pg)
            await pg.locator('#workingVisibility').click();await pg.wait_for_function('civilDefs[0].layer')
            await pg.locator('#workingLayerPanel').scroll_into_view_if_needed()
            await pg.wait_for_function("!document.getElementById('toast').classList.contains('show')")
            await pg.screenshot(path=str(OUT/f'layers-{width}.png'))
            box=await pg.locator('#panel').bounding_box()
            assert box['x']>=-1 and box['x']+box['width']<=width+1,(width,box)
            if width<600:assert box['height']<=height*.70,(width,box)
            for button in await pg.locator('.working-layer-actions button').all():
                rect=await button.bounding_box();assert rect['height']>=44 and rect['width']>=44
            assert await pg.evaluate('document.documentElement.scrollWidth<=innerWidth')
            await pg.locator('#workingConsult').click();await pg.evaluate("map.fire('click',{latlng:civilDefs[0].layer.getLayers()[0].getLatLng()})")
            await pg.wait_for_function("ARPIASUI.selection()?.meta.layerId==='sirenes'")
            await pg.wait_for_function("!document.getElementById('toast').classList.contains('show')")
            await pg.screenshot(path=str(OUT/f'info-{width}.png'))
            box=await pg.locator('#territorialPanel').bounding_box()
            assert box['x']>=-1 and box['x']+box['width']<=width+1
            if width<600:
                assert box['height']<=height*.70
                point=await pg.evaluate('map.latLngToContainerPoint(ARPIASUI.selection().ref).y')
                mapbox=await pg.locator('#map').bounding_box()
                assert mapbox['y']+point<box['y'], 'Selection must stay above mobile Info'
            await pg.locator('#layersBtn').click();await pg.wait_for_timeout(250)
            if width<1200:assert await pg.locator('#territorialPanel').is_hidden()
            assert not errs,errs
            results.append(f'{width}×{height}: Camadas / Info / touch targets / no horizontal overflow')
            await c.close()
        c=await browser.new_context();await c.route('https://**/*',external)
        pg=await c.new_page();await ready(pg)
        await pg.evaluate("localStorage.setItem(ARPIASPreferences.key,'{invalid')")
        await pg.reload(wait_until='load');await pg.wait_for_function("catalogSections.length===14")
        await choose_sirens(pg);assert await pg.locator('#workingLayerControls').is_visible()
        results.append('malformed preferences do not stop catalog or working-layer controls')
        await c.close();await browser.close()
    (OUT/'results.json').write_text(json.dumps({'evidence':evidence(),'passed':results,'external_services':'simulated 503, not live validation'},ensure_ascii=False,indent=2))
    print(json.dumps({'passed':len(results),'groups':results,'output':str(OUT)},ensure_ascii=False,indent=2))

if __name__=='__main__':
    asyncio.run(main())
