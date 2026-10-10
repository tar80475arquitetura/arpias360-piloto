const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const cartography = require('../js/cartography.js');

// Run the production SVG renderer. This minimal DOM records attributes without
// duplicating its drawing logic; layout and accessibility run in Chromium.
function swatches() {
  const source = fs.readFileSync('js/tools.js', 'utf8');
  const document = {
    createElementNS(namespaceURI, tagName) {
      return {namespaceURI, tagName, attributes: {}, children: [],
        setAttribute(name, value) { this.attributes[name] = String(value); },
        append(child) { this.children.push(child); }};
    }
  };
  const context = {document, ARPIASCartography: cartography};
  vm.createContext(context);
  const start = source.indexOf('  function styleSwatch(');
  const end = source.indexOf('  function visibleLegend(', start);
  assert.ok(start >= 0 && end > start, 'Production styleSwatch renderer is present');
  vm.runInContext(source.slice(start, end), context);
  return context.styleSwatch;
}

function presentationHelpers(extra = {}) {
  const source = fs.readFileSync('js/app.js', 'utf8');
  const context = {document:{createElementNS(namespaceURI, tagName) {
    return {namespaceURI, tagName, attributes:{}, children:[],
      setAttribute(name, value) { this.attributes[name] = String(value); },
      append(child) { this.children.push(child); }};
  }}, element:(tagName,textContent) => ({tagName,textContent}), ...extra};
  vm.createContext(context);
  const start = source.indexOf('function uiIcon(');
  const end = source.indexOf('function refreshLayerSymbols(', start);
  assert.ok(start >= 0 && end > start, 'Production presentation helpers are present');
  vm.runInContext(source.slice(start,end), context);
  return context;
}

test('FE-01A vector swatches use real map stroke fill width and dash styles', () => {
  const swatch = swatches();
  for (const id of ['limite', 'bairros', 'hidro', 'zeis', 'zeia', 'appm', 'apa', 'comunidades', 'lotes']) {
    const svg = swatch(id), path = svg.children[0].attributes, style = cartography.style(id);
    assert.equal(svg.attributes.viewBox, '0 0 40 28');
    assert.equal(svg.attributes['aria-hidden'], 'true');
    assert.equal(path.stroke, style.color, id);
    assert.equal(Number(path['stroke-width']), style.weight, id);
    assert.equal(path.fill, id === 'hidro' ? 'none' : style.fillColor || 'none', id);
    assert.equal(Number(path['fill-opacity']), style.fillOpacity || 0, id);
    assert.equal(path['stroke-dasharray'], style.dashArray, id);
  }
});

test('FE-01A swatches retain true style opacity and layer transparency, including zero', () => {
  const swatch = swatches();
  const style = {color:'#705484', fillColor:'#b59bc8', weight:2.5, opacity:.35, fillOpacity:.25, dashArray:'3 4'};
  for (const opacity of [0, .8, 1]) {
    const path = swatch('relevo', opacity, 'Polygon', style).children[0].attributes;
    assert.equal(Number(path['stroke-opacity']), style.opacity * opacity);
    assert.equal(Number(path['fill-opacity']), style.fillOpacity * opacity);
    assert.equal(path.stroke, style.color);
    assert.equal(path.fill, style.fillColor);
    assert.equal(path['stroke-dasharray'], style.dashArray);
  }
});

test('FE-01A line and point samples preserve geometry semantics of the legend', () => {
  const swatch = swatches();
  const line = swatch('work', 1, 'MultiLineString').children[0].attributes;
  assert.equal(line.fill, 'none');
  assert.ok(!/Z$/.test(line.d), 'The line symbol is not a filled polygon');
  const selection = swatch('consult', 1, 'Point', cartography.selectionStyle({}, 'Point')).children[0].attributes;
  assert.equal(Number(selection['fill-opacity']), 0, 'Point consultation keeps its hollow selection circle');
  assert.match(selection.d, /a10/);
});

test('FE-01A operational SVGs have a viewBox and cannot duplicate accessible button names', () => {
  const {uiIcon} = presentationHelpers();
  for (const name of ['search','layers','info','work','loading','error','ready','waiting','collapse','expand','close','raster']) {
    const svg = uiIcon(name);
    assert.equal(svg.attributes.viewBox,'0 0 24 24',name);
    assert.equal(svg.attributes['aria-hidden'],'true',name);
    assert.equal(svg.attributes.focusable,'false',name);
    assert.ok(svg.children[0].attributes.d.length > 5,name);
  }
  assert.throws(() => uiIcon('unimplemented-action'), /Unknown operational icon/);
});

test('FE-01A operational feedback preserves maturity and visibility text alongside distinct state icons', () => {
  let value;
  const ctx = presentationHelpers({layerPresentation:() => value});
  const node = {replaceChildren(...children) { this.children = children; }};
  const cases = [
    ['EM INTEGRAÇÃO · Falha de carregamento · Camada oculta','error'],
    ['EM INTEGRAÇÃO · Carregando · Camada visível','loading'],
    ['EM INTEGRAÇÃO · Carregado · Camada no mapa · opacidade zero (não perceptível)','ready'],
    ['EM INTEGRAÇÃO · Aguardando carregamento · Camada oculta','waiting']
  ];
  const shapes = new Set();
  for (const [text,kind] of cases) {
    value = text;
    ctx.renderLayerPresentation(node,'layer_pluviometros');
    assert.equal(node.children[1].textContent,text);
    const path = node.children[0].children[0].attributes.d;
    assert.equal(path,ctx.uiIcon(kind).children[0].attributes.d);
    shapes.add(path);
  }
  assert.equal(shapes.size,4,'Operational states remain recognizable without color');
});

test('FE-01A category counts use canonical visibility and never double-count aliases', () => {
  const inputs = {layer_a:{id:'layer_a',checked:true},layer_b:{id:'layer_b',checked:false}};
  const badge = {classList:{add() {}},textContent:''};
  const section = {id:'risk',querySelector:() => badge};
  const rows = ['a','a','b'].map(id => ({dataset:{layerId:id}}));
  const ctx = presentationHelpers({document:{getElementById:id=>inputs[id]},catalogSections:[{section,rows}]});
  ctx.refreshCategoryCounts();
  assert.equal(badge.textContent,'3 itens · 1 ligada');
  inputs.layer_b.checked = true;
  ctx.refreshCategoryCounts();
  assert.equal(badge.textContent,'3 itens · 2 ligadas');
  inputs.layer_a.checked = inputs.layer_b.checked = false;
  ctx.refreshCategoryCounts();
  assert.equal(badge.textContent,'3 itens · 0 ligadas');
});

test('FE-01A category counts include basemap aliases that render a button rather than another input', () => {
  const input = {id:'base_recent',checked:true};
  const badge = {classList:{add() {}},textContent:''};
  const section = {id:'climate',querySelector:() => badge};
  const rows = [{dataset:{controlId:'base_recent'}},{dataset:{controlId:'base_recent'}}];
  const ctx = presentationHelpers({document:{getElementById:id=>id==='base_recent'?input:null},catalogSections:[{section,rows}]});
  ctx.refreshCategoryCounts();
  assert.equal(badge.textContent,'2 itens · 1 ligada');
  input.checked = false;
  ctx.refreshCategoryCounts();
  assert.equal(badge.textContent,'2 itens · 0 ligadas');
});
