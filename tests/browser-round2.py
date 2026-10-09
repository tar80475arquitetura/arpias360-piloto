"""Round 02 browser regressions: actual Leaflet/DOM/canvas, controlled GIS failures.
Synthetic geometries and a plain fixture tile are test inputs, never GIS evidence.
"""
import asyncio
import json
import os
import runpy
from pathlib import Path
from playwright.async_api import async_playwright
shared=runpy.run_path(str(Path(__file__).with_name('browser-operations.py')))
OUT=shared['OUT']

async def main():
    passed=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None,headless=True,args=['--no-sandbox'])
        context=await browser.new_context(viewport={'width':1366,'height':900})
        await context.route('https://**/*',shared['external'])
        page=await context.new_page();errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        await shared['ready'](page)
        # Relevo: real information buttons, before load and after a failed local load.
        await shared['open_layers'](page)
        await page.locator('#layerSearch').fill('padrões de relevo')
        info=page.locator('[data-layer-id="relevo"] .info-button')
        await info.click()
        text=await page.locator('#infoBody').inner_text()
        for expected in ['2017','1:30.000','399','4 classificações','CPRM','Não substitui']:
            assert expected in text,expected
        await page.locator('#closeInfo').click()
        await page.route('**/data/processed/cprm/padroes-relevo.geojson',lambda route:route.fulfill(status=503,body='Intentional local fixture failure'))
        await page.locator('#layer_relevo').check()
        await page.wait_for_function("relief.status.textContent==='Falha de carregamento'")
        await info.click();assert await page.locator('#layerInfo').evaluate('e=>e.open')
        await page.keyboard.press('Escape');assert not await page.locator('#layerInfo').evaluate('e=>e.open')
        await page.unroute('**/data/processed/cprm/padroes-relevo.geojson')
        await page.locator('#layer_relevo').check()
        await page.wait_for_function('relief.ready')
        for field in ['PADRAO','UnGeomorf','UnMorfoest','UnMorfoesc']:
            await page.locator('#reliefClassification').select_option(field)
            assert await page.evaluate('relief.field')==field
            await info.click();assert '399' in await page.locator('#infoBody').inner_text()
            await page.locator('#closeInfo').click()
        passed.append('relief information button before loading, after failure and after all four classifications')
        # Catalogue aliases: actual original and alias switches share state and opacity.
        await page.locator('#layerSearch').fill('pluvi')
        await page.locator('#layer_pluviometros').check()
        await page.wait_for_function('civilDefs[1].layer!==undefined')
        await page.wait_for_function("document.getElementById('layer_alias_climate_layer_pluviometros').checked")
        await page.evaluate("applyLayerOpacity(civilDefs[1],0);document.dispatchEvent(new Event('arpias:opacity'))")
        await page.wait_for_function("[...document.querySelectorAll('[data-layer-id=pluviometros] .catalog-operational')].every(e=>e.textContent.includes('não perceptível'))")
        await page.locator('#layer_alias_climate_layer_pluviometros').uncheck()
        await page.wait_for_function("!document.getElementById('layer_pluviometros').checked")
        await page.wait_for_function("[...document.querySelectorAll('[data-layer-id=pluviometros] .catalog-operational')].every(e=>e.textContent.includes('Camada oculta'))")
        await page.evaluate("const d=civilDefs[1];d.status.textContent='Carregando'")
        await page.wait_for_function("[...document.querySelectorAll('[data-layer-id=pluviometros] .catalog-operational')].every(e=>e.textContent.includes('Carregando'))")
        await page.evaluate("civilDefs[1].status.textContent='Indisponível'")
        await page.wait_for_function("[...document.querySelectorAll('[data-layer-id=pluviometros] .catalog-operational')].every(e=>e.textContent.includes('Falha de carregamento')&&e.textContent.includes('EM INTEGRAÇÃO'))")
        assert await page.evaluate("!document.querySelector('#baseControl').textContent.includes('DISPONÍVEL NO MAPA')")
        assert await page.locator('#catalogSearchStatus').inner_text() # filtered catalogue remains usable
        passed.append('catalogue aliases, loading, failure, hidden layer, zero opacity and independent maturity')
        # Test-only base with a real loaded raster; local data preloaded without activation.
        await page.evaluate('''async()=>{
          closeLayers();map.closePopup();ARPIASUI.closeTerritorial();
          [...overlayDefs,...civilDefs,...reliefDefs].forEach(d=>{d.input.checked=false;if(d.layer)map.removeLayer(d.layer)});
          await Promise.all(civilDefs.map(loadCivil));baseDefs.forEach(d=>map.removeLayer(d.layer));
          const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#eee';ctx.fillRect(0,0,256,256);
          window.fixtureBase=L.tileLayer(c.toDataURL(),{maxZoom:23}).addTo(map);
          activeBaseDef={id:'fixture',name:'BASE SINTÉTICA DE TESTE',layer:fixtureBase};
          window.fixturePart=x=>({type:'Feature',properties:{tx_nome:'Bairro de teste',CPF:'NÃO PUBLICAR'},geometry:{type:'Polygon',coordinates:[[[x,-22.91],[x+.004,-22.91],[x+.004,-22.906],[x,-22.906],[x,-22.91]],[[x+.001,-22.909],[x+.001,-22.908],[x+.002,-22.908],[x+.002,-22.909],[x+.001,-22.909]]]}});
        }''')
        for kind in ['Point','LineString','Polygon','MultiPolygon']:
            for visible in [True,False]:
                await page.evaluate('''({kind,visible})=>{
                  if(window.fixtureOrigin)map.removeLayer(fixtureOrigin);
                  const a=fixturePart(-43.10),b=fixturePart(-43.09);
                  let feature=kind==='MultiPolygon'?ARPIASSearch.selectionFeature({features:[a,b]}):a;
                  if(kind==='Point')feature={...a,geometry:{type:kind,coordinates:[-43.10,-22.91]}};
                  if(kind==='LineString')feature={...a,geometry:{type:kind,coordinates:[[-43.10,-22.91],[-43.09,-22.90]]}};
                  fixtureOrigin=L.geoJSON(feature);if(visible)fixtureOrigin.addTo(map);
                  ARPIASUI.select(feature,'Seleção '+kind,{source:'FONTE SINTÉTICA DE TESTE',origin:'search'});
                  map.closePopup();map.fitBounds(ARPIASUI.selectionBounds(),{maxZoom:16,padding:[60,60],animate:false});
                }''',{'kind':kind,'visible':visible})
                await page.wait_for_function("!fixtureBase.isLoading()&&document.querySelector('#map img.leaflet-tile-loaded')!==null")
                await page.wait_for_timeout(250)
                result=await page.evaluate('''async()=>{
                  const pane=map.getPane('arpiasSelection'),svg=pane.querySelector('svg');
                  const before={center:map.getCenter(),zoom:map.getZoom(),origin:map.hasLayer(fixtureOrigin),feature:JSON.stringify(ARPIASUI.selection().feature)};
                  const withSelection=await ARPIASReport.mapImage();
                  svg.remove();let withoutSelection;try{withoutSelection=await ARPIASReport.mapImage()}finally{pane.append(svg)}
                  const calls=[],native=CanvasRenderingContext2D.prototype.drawImage;
                  CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image.src?.startsWith('data:image/svg+xml'))calls.push(decodeURIComponent(image.src));return native.call(this,image,...args)};
                  try{await ARPIASReport.generate()}finally{CanvasRenderingContext2D.prototype.drawImage=native}
                  const after={center:map.getCenter(),zoom:map.getZoom(),origin:map.hasLayer(fixtureOrigin),feature:JSON.stringify(ARPIASUI.selection().feature)};
                  return {different:withSelection!==withoutSelection,before,after,paths:svg.querySelectorAll('path').length,vectorDraws:calls.length,expectedVectorDraws:document.querySelectorAll('#map .leaflet-overlay-pane svg').length+1,text:document.getElementById('reportBody').textContent,disabled:document.getElementById('printReport').disabled};
                }''')
                assert result['different'],(kind,visible,'selection has no pixel effect',result)
                assert result['before']==result['after'],(kind,visible,'map mutated')
                assert result['paths']==1,result
                assert result['vectorDraws']==result['expectedVectorDraws'],result
                assert not result['disabled'],result
                assert 'FONTE SINTÉTICA DE TESTE' in result['text'] and 'NÃO PUBLICAR' not in result['text'],result
                if kind=='MultiPolygon':assert 'sem união' in result['text']
                await page.screenshot(path=str(OUT/f'report-{kind}-{visible}.png'))
                if kind=='MultiPolygon' and not visible:
                    await page.emulate_media(media='print');await page.pdf(path=str(OUT/'report-multipart-fixture.pdf'));await page.emulate_media(media='screen')
                await page.locator('#closeReport').click()
                passed.append(f'{kind}, origin visible={visible}: real pixels, single selection, public attributes, stable map and report')
        await page.locator('#moreBtn').click();await page.locator('#menuReport').click()
        await page.wait_for_function('!document.getElementById("printReport").disabled')
        await page.locator('#closeReport').click()
        # Capture failure must disable printing instead of emitting an empty document.
        await page.evaluate('''async()=>{
          const Original=window.Image;window.Image=class{set src(value){queueMicrotask(()=>this.onerror())}};
          try{await ARPIASReport.generate()}finally{window.Image=Original}
        }''')
        assert await page.locator('#printReport').is_disabled()
        assert 'Não foi possível capturar' in await page.locator('#reportBody').inner_text()
        await page.locator('#closeReport').click()
        passed.append('capture failure is explicit and printing stays disabled')
        assert not errors,errors
        await context.close();await browser.close()
    (OUT/'round2-results.json').write_text(json.dumps({'evidence':shared['evidence'](),'passed':passed,'external_services':'controlled failures; no real GIS validation','fixtures':'synthetic geometry and tile for capture assertions'},ensure_ascii=False,indent=2))
    print(json.dumps({'passed':len(passed),'groups':passed},ensure_ascii=False,indent=2))

if __name__=='__main__':asyncio.run(main())
