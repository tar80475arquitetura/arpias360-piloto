"""FE-01A presentation regressions in Chromium against the existing local server.

Uses the established browser-operations fixtures: real vendored/local datasets,
CDN code fetched with normal TLS verification, and deliberately failed external
GIS requests. These checks are not public-site or GIS service homologation.
Run with ARPIAS_TEST_OUTPUT=/tmp/arpias-fe01a python tests/browser-fe01a.py.
The 200% scenario uses Chromium's own zoom preference, not CSS zoom or pinch.
"""
import asyncio
import base64
import json
import math
import os
import runpy
import struct
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright

shared = runpy.run_path(str(Path(__file__).with_name('browser-operations.py')))
OUT = shared['OUT']
PASSED = []
DETAILS = {}

# Alpha-composite actual computed foreground/background through the ancestor
# chain; testing a token against an assumed white background misses regressions.
CONTRAST = r"""elements => {
  const rgba = value => {
    const n = value.match(/[\d.]+/g).map(Number);
    return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
  };
  const over = (a,b) => {
    const alpha = a[3] + b[3] * (1-a[3]);
    return [0,1,2].map(i => (a[i]*a[3] + b[i]*b[3]*(1-a[3])) / alpha).concat(alpha);
  };
  const luminance = color => color.slice(0,3).map(v => {
    v /= 255; return v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4;
  }).reduce((sum,v,i) => sum+v*[.2126,.7152,.0722][i],0);
  return elements.filter(e => e.getClientRects().length && e.textContent.trim()).map(e => {
    const chain=[];for(let n=e;n;n=n.parentElement)chain.unshift(n);
    let background=[255,255,255,1];
    chain.forEach(n => background=over(rgba(getComputedStyle(n).backgroundColor),background));
    const style=getComputedStyle(e), foreground=over(rgba(style.color),background);
    const a=luminance(foreground),b=luminance(background);
    return {text:e.textContent.trim().slice(0,100),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),fontSize:parseFloat(style.fontSize),color:style.color,background};
  });
}"""


async def screen(page, name):
    await page.wait_for_function("!document.getElementById('toast').classList.contains('show')")
    await page.screenshot(path=str(OUT / name),animations='disabled')


async def no_overflow(page):
    assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal document overflow'
    rect = await page.locator('#panel').bounding_box()
    width = await page.evaluate('innerWidth')
    assert rect['x'] >= -1 and rect['x'] + rect['width'] <= width + 1, rect
    assert await page.locator('#panel .panel-scroll').evaluate('e => e.scrollWidth <= e.clientWidth + 1'), 'Layer panel has hidden horizontal content'


async def category_counts(page):
    result = await page.evaluate("""() => catalogSections.map(({section,rows}) => {
      const controls = new Map();
      for(const row of rows){
        const entry=catalogEntries.find(entry=>entry.row===row);
        const input=entry?.item.control?document.getElementById(entry.item.control):row.querySelector('input[type=checkbox],input[type=radio]');
        if(input)controls.set(input.id.replace(/^layer_alias_[^_]+_/,'layer_'),input.checked);
      }
      return {category:section.dataset.group || 'base',expected:[...controls.values()].filter(Boolean).length,
        text:section.querySelector('summary .category-count')?.textContent || ''};
    })""")
    for item in result:
        label = ' base selecionada' if item['category'] == 'base' else ' ligada'
        assert str(item['expected']) + label in item['text'], item
    return result


async def interactions(page, label):
    await shared['ready'](page)
    assert await page.locator('#panel').evaluate("e => e.classList.contains('hidden')")
    zoom = await page.evaluate('map.getZoom()')
    await page.locator('.leaflet-control-zoom-in').click()
    await page.wait_for_function('value => map.getZoom() > value && !map._animatingZoom', arg=zoom)
    await page.locator('.leaflet-control-zoom-out').click()
    await page.wait_for_function('value => map.getZoom() === value && !map._animatingZoom', arg=zoom)
    await screen(page, f'after-{label}-closed.png')
    await shared['open_layers'](page)
    assert not await page.locator('#panel').evaluate("e => e.classList.contains('hidden')")
    assert await page.locator('#catalogSearchStatus').inner_text() == '14 categorias · 126 itens no catálogo'
    assert await page.locator('#layersBtn svg.ui-icon').count() == 1
    await page.locator('#layerSearch').fill('sirene')
    row = page.locator('.layer-control[data-layer-id="sirenes"]').first
    category = page.locator('details[data-group="risk"]')
    await category.locator('summary').click()
    assert not await category.evaluate('e => e.open')
    assert not await row.is_visible()
    await category.locator('summary').click()
    assert await category.evaluate('e => e.open') and await row.is_visible()
    assert not await page.locator('#layer_sirenes').is_checked()
    # The sample symbol is presentation, never another visibility toggle.
    await row.locator('.layer-icon').click()
    assert not await page.locator('#layer_sirenes').is_checked()
    work = row.locator('.layer-work-button')
    await row.locator('.layer-target').focus()
    await page.keyboard.press('Tab')  # Visibility switch.
    await page.keyboard.press('Tab')  # Independent working-layer button.
    focused = await work.evaluate("e => {const s=getComputedStyle(e);return {focus:e.matches(':focus-visible'),outline:s.outlineStyle,width:parseFloat(s.outlineWidth)}}")
    assert focused['focus'] and focused['outline'] != 'none' and focused['width'] > 0, focused
    await page.keyboard.press('Enter')
    assert not await page.locator('#layer_sirenes').is_checked(), 'Choosing work must leave visibility off'
    assert await page.locator('#workingLayerName').inner_text() == 'Sirenes de alerta'
    assert await work.get_attribute('aria-pressed') == 'true'
    name = row.locator('.layer-target')
    assert await row.get_by_role('button', name=await name.inner_text(), exact=True).count() == 1, 'Full name must be keyboard/screen reader accessible'
    await name.focus()
    await page.keyboard.press('Space')
    assert not await page.locator('#layer_sirenes').is_checked()
    await page.locator('#layer_sirenes').check()
    await page.wait_for_function('civilDefs[0].layer?.getLayers().length === 37')
    # Marker in the panel must match the real marker's path and computed color.
    marker = await page.evaluate("""() => {
      const a=document.querySelector('.layer-control[data-layer-id=sirenes] .layer-icon');
      const b=document.querySelector('#map .civil-marker.sirenes');
      return {sample:a.querySelector('path').getAttribute('d'),map:b.querySelector('path').getAttribute('d'),
        sampleColor:getComputedStyle(a).color,mapColor:getComputedStyle(b).color};
    }""")
    assert marker['sample'] == marker['map'] and marker['sampleColor'] == marker['mapColor'], marker
    await page.locator('#layerSearch').fill('pluvi')
    await page.locator('#layer_alias_climate_layer_pluviometros').check()
    await page.wait_for_function('civilDefs[1].layer?.getLayers().length === 38')
    assert await page.locator('#layer_sirenes').is_checked(), 'Multiple thematic layers must remain visible'
    assert await page.locator('#layer_pluviometros').is_checked()
    assert await page.locator('#workingLayerName').inner_text() == 'Sirenes de alerta', 'Visibility must not change working layer'
    await page.locator('.layer-control[data-layer-id="pluviometros"] .layer-work-button').last.click()
    assert await page.locator('#workingLayerName').inner_text() == 'Pluviômetros municipais'
    assert await page.locator('.layer-control[data-layer-id="pluviometros"] .layer-work-button[aria-pressed=true]').count() == 2
    await page.evaluate("applyLayerOpacity(civilDefs[1],0);document.dispatchEvent(new Event('arpias:opacity'))")
    await page.wait_for_function("[...document.querySelectorAll('.layer-control[data-layer-id=pluviometros] .catalog-operational')].every(e=>e.textContent.includes('não perceptível'))")
    await page.locator('#layer_alias_climate_layer_pluviometros').uncheck()
    assert not await page.locator('#layer_pluviometros').is_checked()
    assert await page.locator('#workingLayerName').inner_text() == 'Pluviômetros municipais'
    states = []
    for text, state, readable in [('Carregando','loading','Carregando'),('Indisponível','error','Falha de carregamento'),('Disponível','ready','Carregado')]:
        # Explicit UI event fixtures; this does not claim service availability.
        await page.evaluate('value => {civilDefs[1].status.textContent=value}', text)
        await page.wait_for_function("([state,readable]) => [...document.querySelectorAll('.layer-control[data-layer-id=pluviometros]')].every(e=>e.dataset.state===state && e.querySelector('.catalog-operational').textContent.includes(readable))",arg=[state,readable])
        for item in await page.locator('.layer-control[data-layer-id="pluviometros"]').all():
            status = item.locator('.catalog-operational')
            assert await status.locator('svg').count() >= 1, 'Operational state requires icon and text'
            assert 'EM INTEGRAÇÃO' in await status.inner_text(), 'Loading does not validate maturity'
        states.append({'source_event_fixture':text,'data_state':state})
    DETAILS[label + '-states'] = states
    DETAILS[label + '-counts'] = await category_counts(page)
    await page.locator('#layerSearch').fill('')
    await page.evaluate("document.querySelector('[data-group=risk]').open=true")
    await screen(page, f'after-{label}-open.png')
    await row.scroll_into_view_if_needed()
    await screen(page, f'after-{label}-layer-controls.png')
    await no_overflow(page)
    metadata = await page.locator('#panel .catalog-operational, #panel .catalog-badge, #panel .category-count, #panel .catalog-search-status, #panel .planned-entry small').evaluate_all(CONTRAST)
    assert metadata, 'Metadata measurements are present'
    assert all(item['ratio'] >= 4.5 for item in metadata), [item for item in metadata if item['ratio'] < 4.5]
    assert all(item['fontSize'] >= 13 for item in metadata), [item for item in metadata if item['fontSize'] < 13]
    DETAILS[label + '-metadata'] = metadata
    PASSED.append(label + ': keyboard/focus/name, true marker, independent visibility/work, aliases, operational states, counts, contrast and no overflow')


async def symbols_and_names(page):
    await page.locator('#layerSearch').fill('hidro')
    sample = page.locator('.layer-control[data-layer-id="hidro"] .layer-icon .legend-swatch path').first
    assert await sample.get_attribute('stroke') == await page.evaluate("ARPIASCartography.style('hidro').color")
    assert await sample.get_attribute('fill') == 'none'
    await page.locator('#layerSearch').fill('proteção permanente')
    name = page.locator('.layer-control[data-layer-id="appm"] .layer-target').first
    await name.focus()
    full = await name.inner_text()
    assert full and await page.get_by_role('button',name=full,exact=True).count() >= 1
    assert full in await name.get_attribute('title')
    DETAILS['long-name'] = await name.evaluate("e => ({text:e.textContent,aria:e.getAttribute('aria-label'),height:e.clientHeight,lineHeight:getComputedStyle(e).lineHeight})")
    await page.locator('#layerSearch').fill('relevo')
    assert await page.locator('.layer-control[data-layer-id="relevo"] .layer-icon .legend-swatch').count() == 0, 'Unloaded relief cannot show fabricated classes'
    await page.locator('#layer_relevo').check()
    await page.wait_for_function('relief.ready')
    palettes = []
    for field in ['PADRAO','UnGeomorf','UnMorfoest','UnMorfoesc']:
        await page.locator('#reliefClassification').select_option(field)
        await page.wait_for_timeout(30)
        result = await page.evaluate("""() => {
          const classes=ARPIASGeomorphology.classes(relief.data,relief.field);
          const symbols=[...document.querySelectorAll('.layer-control[data-layer-id=relevo] .layer-icon .legend-swatch path')].map(e=>({stroke:e.getAttribute('stroke'),fill:e.getAttribute('fill'),dash:e.getAttribute('stroke-dasharray')}));
          return {field:relief.field,classes:classes.map(c=>({color:c.color,dash:c.dashArray || null})),symbols};
        }""")
        assert result['symbols'], result
        for item in result['symbols']:
            assert any(item['stroke'] == c['color'] and item['fill'] == c['color'] and item['dash'] == c['dash'] for c in result['classes']), result
        palettes.append(result)
    DETAILS['relief'] = palettes
    await screen(page,'after-relief-classification.png')
    await page.locator('#layerSearch').fill('fragilidade')
    assert await page.locator('.planned-entry:visible .legend-swatch').count() == 0, 'Planned entries cannot invent cartographic styles'
    await screen(page,'after-planned-states.png')
    PASSED.append('real line styles, complete long names, unstyled planned/unloaded data and actual relief classes in all four classifications')


async def main():
    async with async_playwright() as p:
        executable = os.environ.get('ARPIAS_CHROMIUM','/usr/bin/chromium') or None
        browser = await p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
        DETAILS['browser'] = browser.version
        for label, width, height in [('desktop',1366,768),('mobile',390,844)]:
            context = await browser.new_context(viewport={'width':width,'height':height})
            await context.route('https://**/*',shared['external'])
            page = await context.new_page()
            errors = []
            page.on('pageerror',lambda error:errors.append(str(error)))
            await interactions(page,label)
            if label == 'desktop':
                await symbols_and_names(page)
            assert not errors, errors
            await context.close()
        await browser.close()
        # Native Chromium HostZoomMap preference in an isolated, disposable
        # profile. x is Chromium's default storage-partition zoom key.
        with tempfile.TemporaryDirectory(prefix='arpias-fe01a-zoom-') as profile:
            default = Path(profile) / 'Default'
            default.mkdir()
            (default/'Preferences').write_text(json.dumps({'partition':{'default_zoom_level':{'x':math.log(2)/math.log(1.2)}}}))
            # The default CI executable is headless-shell, which does not use
            # Chrome's profile zoom preferences. Select the full Chromium
            # channel for this native-browser scenario, as on the local run.
            context = await p.chromium.launch_persistent_context(profile,executable_path=executable,channel='chromium',headless=True,no_viewport=True,args=['--no-sandbox','--window-size=1366,768'])
            await context.route('https://**/*',shared['external'])
            page = context.pages[0]
            await shared['ready'](page)
            metrics = await page.evaluate('({innerWidth,innerHeight,outerWidth,outerHeight,devicePixelRatio,visualScale:visualViewport.scale})')
            assert metrics['devicePixelRatio'] == 2 and metrics['innerWidth'] == 683 and metrics['visualScale'] == 1, metrics
            DETAILS['native-browser-zoom-200'] = metrics
            await shared['open_layers'](page)
            await page.locator('#layerSearch').fill('sirene')
            await page.locator('.layer-control[data-layer-id="sirenes"] .layer-work-button').first.click()
            assert not await page.locator('#layer_sirenes').is_checked()
            await no_overflow(page)
            await page.locator('.layer-control[data-layer-id="sirenes"]').first.scroll_into_view_if_needed()
            # Playwright's screenshot clip assumes the context's initial DPR;
            # with native browser zoom and no_viewport it crops the surface.
            # Capture Chromium's complete rendered surface without emulating
            # a different viewport, which would close panels on resize.
            await page.wait_for_function("!document.getElementById('toast').classList.contains('show')")
            session = await context.new_cdp_session(page)
            layout = await session.send('Page.getLayoutMetrics')
            assert layout['cssVisualViewport']['zoom'] == 2, layout
            shot = await session.send('Page.captureScreenshot',{'format':'png','fromSurface':True})
            png = base64.b64decode(shot['data'])
            dimensions = struct.unpack('>II',png[16:24])
            assert dimensions[0] == layout['layoutViewport']['clientWidth'], dimensions
            (OUT/'after-native-browser-zoom-200.png').write_bytes(png)
            DETAILS['native-browser-zoom-200']['capturePixels'] = list(dimensions)
            DETAILS['native-browser-zoom-200']['browserZoom'] = layout['cssVisualViewport']['zoom']
            await context.close()
            PASSED.append('native Chromium zoom 200%: verified CSS viewport/DPR, usable work-layer button and no horizontal overflow')
    result = {'evidence':shared['evidence'](),'passed':PASSED,'details':DETAILS,'external_services':'Controlled 503 fixtures; no public-site or live GIS validation'}
    (OUT/'fe01a-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps({'passed':len(PASSED),'groups':PASSED,'output':str(OUT)},ensure_ascii=False,indent=2))


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        # Keep the failing assertion accessible in the CI check annotations,
        # even when downloading the full workflow log is unavailable.
        message = f'{type(error).__name__}: {error}'.replace('%','%25').replace('\r','%0D').replace('\n','%0A')
        print(f'::error title=FE-01A browser regression::{message}',flush=True)
        raise
