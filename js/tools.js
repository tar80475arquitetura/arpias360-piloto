/* Intentional consultation and isolated, local working layers. */
const ARPIASUI=(()=>{
  L.drawLocal.draw.handlers.polyline.tooltip={start:'Clique ou toque para iniciar a linha.',cont:'Marque o próximo vértice.',end:'Use Finalizar desenho para concluir.'};
  L.drawLocal.draw.handlers.polygon.tooltip={start:'Clique ou toque para iniciar o polígono.',cont:'Marque o próximo vértice.',end:'Use Finalizar desenho para concluir.'};
  L.drawLocal.draw.handlers.marker.tooltip.start='Clique ou toque para posicionar o ponto.';
  L.drawLocal.edit.handlers.edit.tooltip={text:'Arraste os vértices ou pontos para ajustar.',subtext:'Use Concluir ajuste e salve a camada de trabalho.'};
  const geo=ARPIASGeometry;
  const byId=id=>document.getElementById(id);
  const workGroup=L.featureGroup().addTo(map);
  const measureGroup=L.featureGroup().addTo(map);
  let mode='navigate',changing=false,dirty=false,backup=null,backupTrash=[],handler=null,editing=null;
  let selection=null,selectionLayer=null,generation=0,pending=null,trash=[];
  let vertexCount=0,currentDrawType=null;
  const format=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
  const distanceLabel=value=>value>=1000?`${format.format(value/1000)} km`:`${format.format(value)} m`;
  const areaLabel=value=>value>=10000?`${format.format(value)} m² (${format.format(value/10000)} ha)`:`${format.format(value)} m²`;
  function action(label,run,className=''){const button=element('button',label,className);button.type='button';button.addEventListener('click',run);return button;}
  function confirm(message,accept='Confirmar'){
    return new Promise(resolve=>{
      const dialog=byId('confirmAction');if(dialog.open){resolve(false);return;}
      byId('confirmText').textContent=message;byId('confirmAccept').textContent=accept;
      const finish=value=>{dialog.close();byId('confirmAccept').removeEventListener('click',yes);byId('confirmCancel').removeEventListener('click',no);dialog.removeEventListener('cancel',cancel);resolve(value);};
      const yes=()=>finish(true),no=()=>finish(false),cancel=e=>{e.preventDefault();finish(false);};
      byId('confirmAccept').addEventListener('click',yes);byId('confirmCancel').addEventListener('click',no);dialog.addEventListener('cancel',cancel);dialog.showModal();
    });
  }
  function serialize(){return {type:'FeatureCollection',features:workGroup.getLayers().map(layer=>ARPIASWork.sanitizeFeature(layer.toGeoJSON()))};}
  function workLayer(feature){
    let result;
    L.geoJSON(feature,{style:{color:'#705484',weight:3,fillColor:'#b59bc8',fillOpacity:.16},pointToLayer:(f,ll)=>L.marker(ll,{icon:L.divIcon({className:'work-point',html:'✎',iconSize:[28,28],iconAnchor:[14,14]}),bubblingMouseEvents:false}),onEachFeature:(f,layer)=>{
      layer.on('click',e=>{if(mode==='consult'){const actual=layer.toGeoJSON();select(actual,actual.properties.titulo,{source:actual.properties.source||'Camada de trabalho do usuário',work:true},e.latlng);}});result=layer;
    }});
    return result;
  }
  function restore(collection){workGroup.clearLayers();ARPIASWork.validateCollection(collection).features.forEach(feature=>workGroup.addLayer(workLayer(feature)));renderWork();}
  function stopHandler(){if(handler){handler.disable();handler=null;}if(editing){editing.disable();editing=null;}byId('finishDrawing').hidden=true;byId('finishGeometry').hidden=true;}
  function clearSelection(){generation++;selection=null;if(selectionLayer)map.removeLayer(selectionLayer);selectionLayer=null;if(queryMarker)map.removeLayer(queryMarker);queryMarker=null;map.closePopup();closeTerritorial();byId('shareSelectionBtn').disabled=true;byId('menuReport').disabled=true;byId('coords').textContent='Ative Consultar para investigar um local';}
  async function request(next){
    if(changing)return false;if(mode===next)return true;changing=true;
    try{
      if(mode==='edit'&&dirty){if(!await confirm('Há alterações não salvas. Deseja descartá-las e encerrar a edição?','Descartar e sair'))return false;stopHandler();trash=JSON.parse(JSON.stringify(backupTrash));restore(backup);dirty=false;}
      if(next==='edit'&&!await confirm('Deseja iniciar uma camada de trabalho? As bases oficiais permanecem somente para leitura.','Iniciar edição'))return false;
      stopHandler();if(mode==='consult')clearSelection();closeTerritorial();map.closePopup();closeMore();closeLayers();placeResults.hidden=true;
      mode=next;if(next==='edit'){backup=serialize();backupTrash=JSON.parse(JSON.stringify(trash));}
      byId('toolPanel').hidden=next==='navigate';byId('measureControls').hidden=next!=='measure';byId('editControls').hidden=next!=='edit';
      ['measureDistance','measureArea','clearMeasure'].forEach(id=>byId(id).hidden=false);
      byId('toolTitle').textContent=next==='consult'?'Consultar':next==='measure'?'Medir':'Editar camada de trabalho';
      byId('toolHint').textContent=next==='consult'?'Consulta ativada. Clique ou toque no local que deseja investigar.':next==='measure'?'Escolha distância ou área; marque os vértices no mapa.':'Desenhe ou ajuste suas feições. Nenhuma base oficial é editável.';
      byId('toolResult').textContent='';byId('keepMeasure').hidden=true;
      shell.classList.toggle('has-tool',next!=='navigate');
      ['consultBtn','mobileConsultBtn'].forEach(id=>{byId(id).classList.toggle('active',next==='consult');byId(id).setAttribute('aria-pressed',String(next==='consult'));});
      return true;
    }finally{changing=false;}
  }
  function measurementRows(m){
    const rows=[['Geometria',m.type==='Point'?'Ponto':/Polygon/.test(m.type)?'Polígono':'Linha'],['Latitude de referência',m.lat.toFixed(6)],['Longitude de referência',m.lon.toFixed(6)]];
    if(m.area!==undefined)rows.push(['Área geográfica estimada',areaLabel(m.area)],['Perímetro',distanceLabel(m.perimeter)]);
    if(m.length!==undefined)rows.push(['Comprimento',distanceLabel(m.length)]);
    return rows;
  }
  function select(feature,title,meta={},latlng){
    let m;try{m=geo.metrics(feature);}catch(error){toast('Não foi possível validar a geometria selecionada.');return;}
    clearSelection();const token=++generation;
    selection={feature:JSON.parse(JSON.stringify(feature)),title,meta,metrics:m,ref:L.latLng(m.lat,m.lon),context:{},token};
    selectionLayer=L.geoJSON(feature,{style:{color:'#9b661a',weight:3,fillColor:'#e9ad38',fillOpacity:.3},pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:7,color:'#203e36',weight:3,fillColor:'#e9ad38',fillOpacity:1,renderer:pointRenderer}),interactive:false}).addTo(map);
    byId('shareSelectionBtn').disabled=false;byId('menuReport').disabled=false;byId('coords').textContent=`${m.lat.toFixed(6)}, ${m.lon.toFixed(6)}`;
    summary();resolveContext(selection);return selection;
  }
  function summary(){
    if(!selection)return;
    const s=selection;const rows=[];
    if(s.context.bairro)rows.push(['Bairro',s.context.bairro]);
    if(s.metrics.area!==undefined)rows.push(['Área estimada',areaLabel(s.metrics.area)]);
    rows.push(['Coordenadas',`${s.metrics.lat.toFixed(6)}, ${s.metrics.lon.toFixed(6)}`]);
    const box=content(s.title,rows);
    if(civilDefs.some(d=>d.id===s.meta.layerId))box.append(element('p','Cadastro de localização; não confirma operação atual.','popup-note'));
    const controls=element('div',undefined,'popup-actions selection-actions');
    controls.append(action('ⓘ Informações',showTerritorial),action('◎ Coordenadas',()=>{
      const body=content('Coordenadas',measurementRows(s.metrics));coordinateActions(body,s.ref);body.firstChild.id='infoTitle';byId('infoBody').replaceChildren(body);byId('layerInfo').showModal();
    }),action('Enquadrar seleção',fitSelection));
    if(s.metrics.area!==undefined)controls.append(action('Calcular área',()=>toast(`Área: ${areaLabel(s.metrics.area)} · perímetro: ${distanceLabel(s.metrics.perimeter)}`)));
    box.append(controls);
    const secondary=element('details',undefined,'selection-secondary');secondary.append(element('summary','Mais ações do local'));
    const extra=element('div',undefined,'popup-actions');extra.append(action('Gerar ficha técnica',()=>ARPIASReport.generate()),action('Compartilhar / QR Code',share));secondary.append(extra);coordinateActions(secondary,s.ref);box.append(secondary);
    L.popup(popupOptions()).setLatLng(s.ref).setContent(box).openOn(map);
    if(mode==='consult')byId('toolPanel').hidden=true;
  }
  function queryService(url,latlng){
    return new Promise(resolve=>{
      let finished=false;const timeout=setTimeout(()=>{finished=true;resolve(null);},12000);
      L.esri.query({url}).intersects(latlng).run((error,fc)=>{if(finished)return;clearTimeout(timeout);resolve(error?null:fc?.features||[]);});
    });
  }
  async function resolveContext(s){
    const [neighborhood,region,municipality]=await Promise.all([queryService(URLS.bairros,s.ref),queryService('https://geo.niteroi.rj.gov.br/arcgis/rest/services/dadosabertos/PlanoDiretor/FeatureServer/305',s.ref),queryService(URLS.limite,s.ref)]);
    if(selection!==s)return;
    s.context.bairro=neighborhood?.[0]?safeName(neighborhood[0].properties):null;
    s.context.regiao=region?.[0]?safeName(region[0].properties):null;
    s.context.municipio=municipality?.[0]?'Niterói/RJ':null;
    s.context.checked=true;
    // An asynchronous context response must not steal focus while a new search is being typed.
    const typing=document.activeElement?.matches('input,textarea');
    if(currentPopup&&!typing)summary();if(!byId('territorialPanel').hidden&&!typing)showTerritorial();
  }
  async function query(latlng){
    if(mode!=='consult')return;
    const token=++generation;
    let lotUnavailable=false;
    if(map.getZoom()>=16){
      byId('toolHint').textContent='Consultando o cadastro público neste local…';
      const lots=await queryService(URLS.lotes,latlng);if(mode!=='consult'||token!==generation)return;
      lotUnavailable=lots===null;
      if(lots?.[0]){select(lots[0],'Lote selecionado',{source:'Prefeitura Municipal de Niterói / GeoNit',layerId:'lotes'},latlng);byId('toolHint').textContent='Lote selecionado. Abra Informações para consultar os campos públicos disponíveis.';return;}
    }
    select({type:'Feature',geometry:{type:'Point',coordinates:[latlng.lng,latlng.lat]},properties:{}},'Local selecionado',{},latlng);
    const message=map.getZoom()<16?'Local selecionado. Aproxime o mapa para consultar lotes (zoom 16 ou maior).':lotUnavailable?'Consulta de lotes temporariamente indisponível. O ponto foi selecionado; tente consultar novamente mais tarde.':'Local selecionado. O cadastro consultado não retornou lote neste ponto.';
    byId('toolHint').textContent=message;
    if(lotUnavailable)toast(message);
  }
  function closeTerritorial(){byId('territorialPanel').hidden=true;shell.classList.remove('has-territorial');scheduleResize();}
  function showTerritorial(){
    if(!selection)return;const s=selection;
    const body=byId('territorialBody');body.replaceChildren(content(s.title,measurementRows(s.metrics),'Área, perímetro e comprimento são estimativas geográficas. Centroide de polígonos calculado por centro de massa (Turf), com ponderação por área nas geometrias multipartes.'));
    body.append(content('Identificação territorial',[
      ['Município',s.context.municipio||'Não confirmado · projeto piloto Niterói/RJ'],['Bairro',s.context.bairro||'Não identificado no ponto de referência'],['Região administrativa',s.context.regiao||'Não identificada no ponto de referência'],['Inscrição municipal','Dado ainda não integrado'],['Identificador ARPIAS','Integração futura'],['Fonte da seleção',s.meta.source||'Coordenadas informadas pelo usuário']
    ]));
    geo.publicAttributes(s.feature.properties).forEach(group=>{const detail=element('details',undefined,'attribute-group');detail.append(element('summary',group.title),content('',group.rows));body.append(detail);});
    if(civilDefs.some(d=>d.id===s.meta.layerId))body.append(element('p','Cadastro de localização. Sem confirmação de operação, abertura ou leitura pluviométrica atual. Pluviômetros municipais não são a rede Cemaden.','popup-note'));
    coordinateActions(body,s.ref);body.append(action('Gerar ficha técnica',()=>ARPIASReport.generate(),'quiet-button'));
    map.closePopup();byId('territorialPanel').hidden=false;shell.classList.add('has-territorial');scheduleResize();byId('closeTerritorial').focus({preventScroll:true});
  }
  function fitSelection(){if(!selection)return;closeTerritorial();map.closePopup();const bounds=selectionLayer.getBounds();if(selection.metrics.type==='Point')map.setView(selection.ref,Math.min(17,map.getMaxZoom()));else map.fitBounds(bounds,{padding:[40,40],maxZoom:18});}
  async function share(){
    if(!selection)return;const url=ARPIASLocation.build(location.href,selection.metrics.lat,selection.metrics.lon,map.getZoom());
    byId('shareHint').textContent=['localhost','127.0.0.1','[::1]','0.0.0.0'].includes(location.hostname)?'Este link local só funciona neste dispositivo. Contém as coordenadas e o zoom da seleção.':'Link com as coordenadas e o zoom da seleção.';
    byId('selectionLink').value=url;byId('selectionQR').src=await ARPIASQR.toDataURL(url,{width:220,margin:2});byId('shareDialog').showModal();
  }
  function draw(type){
    if(!['edit','measure'].includes(mode))return;stopHandler();
    vertexCount=0;currentDrawType=type;
    const options={shapeOptions:{color:mode==='edit'?'#705484':'#9b661a',weight:3,fillOpacity:.16},allowIntersection:false,showArea:false};
    handler=type==='point'?new L.Draw.Marker(map,{icon:L.divIcon({className:'work-point',html:'✎',iconSize:[28,28],iconAnchor:[14,14]})}):type==='line'?new L.Draw.Polyline(map,options):new L.Draw.Polygon(map,options);
    handler.enable();byId('finishDrawing').hidden=type==='point';
    // The same explicit finish action is available during editing.
    if(mode==='edit'){byId('measureControls').hidden=false;['measureDistance','measureArea','clearMeasure','keepMeasure'].forEach(id=>byId(id).hidden=true);}
    byId('toolHint').textContent=type==='point'?'Toque ou clique para posicionar o ponto.':'Marque os vértices e use Finalizar desenho; Escape cancela o desenho atual.';
  }
  function finishDraw(){if(!handler||currentDrawType==='point')return;const min=currentDrawType==='polygon'?3:2;if(vertexCount<min){toast(`Marque pelo menos ${min} vértices.`);return;}handler.completeShape();}
  function openForm(layer,isNew){
    pending={layer,isNew};const form=byId('workForm');form.reset();
    const p=layer.feature?.properties||{};ARPIASWork.fields.forEach(key=>{if(p[key]!==undefined)form.elements.namedItem(key).value=p[key];});
    if(!p.data)form.elements.namedItem('data').value=new Date().toISOString().slice(0,10);
    byId('workFormDialog').showModal();
  }
  function cancelForm(){if(pending?.isNew)map.removeLayer(pending.layer);pending=null;byId('workFormDialog').close();}
  byId('workForm').addEventListener('submit',e=>{
    e.preventDefault();if(!pending)return;
    const p=Object.fromEntries(new FormData(e.target).entries());
    try{
      const feature=ARPIASWork.sanitizeFeature({...pending.layer.toGeoJSON(),properties:p});
      pending.layer.feature=feature;
      if(pending.isNew){map.removeLayer(pending.layer);workGroup.addLayer(workLayer(feature));}
      dirty=true;pending=null;byId('workFormDialog').close();renderWork();byId('toolResult').textContent='Alteração aplicada. Salve neste dispositivo para persistir.';
    }catch(error){toast(error.message);}
  });
  byId('cancelWorkForm').addEventListener('click',cancelForm);byId('workFormDialog').addEventListener('cancel',e=>{e.preventDefault();cancelForm();});
  map.on('draw:created',e=>{
    handler=null;byId('finishDrawing').hidden=true;
    if(mode==='measure'){
      const m=geo.metrics(e.layer.toGeoJSON());measureGroup.addLayer(e.layer);byId('toolResult').textContent=m.area!==undefined?`Área: ${areaLabel(m.area)} · perímetro: ${distanceLabel(m.perimeter)}`:`Distância: ${distanceLabel(m.length)}`;e.layer.bindTooltip(element('span',byId('toolResult').textContent),{permanent:true,direction:'center',className:'measurement-label'});byId('keepMeasure').hidden=false;
    }else if(mode==='edit'){e.layer.addTo(map);openForm(e.layer,true);byId('measureControls').hidden=true;}
  });
  map.on('draw:drawstop',()=>{byId('finishDrawing').hidden=true;});
  map.on('draw:drawvertex',e=>{vertexCount=e.layers.getLayers().length;if(mode==='edit')dirty=true;});
  map.on('draw:editmove draw:editvertex',()=>{dirty=true;byId('toolResult').textContent='Geometria ajustada. Conclua o ajuste e salve.';});
  function renderWork(){
    const list=byId('workList');list.replaceChildren();byId('workCount').textContent=`${workGroup.getLayers().length} feições`;byId('restoreWork').disabled=!trash.length;
    workGroup.eachLayer(layer=>{
      const row=element('div',undefined,'work-entry');const p=layer.feature?.properties||{};
      const label=element('label');const visible=element('input');visible.type='checkbox';visible.checked=map.hasLayer(layer);visible.setAttribute('aria-label',`Exibir ${p.titulo}`);
      visible.addEventListener('change',()=>{if(visible.checked)layer.addTo(map);else map.removeLayer(layer);});label.append(visible,element('strong',p.titulo));row.append(label);
      row.append(element('small',`Camada de trabalho · ${p.categoria||'Sem categoria'}`));
      row.append(action('Consultar',()=>select(layer.toGeoJSON(),p.titulo,{source:p.source||'Camada de trabalho do usuário',work:true})),action('Renomear / editar atributos',async()=>{if(await request('edit'))openForm(layer,false);}),action('Excluir',async()=>{
        if(!await request('edit'))return;if(!await confirm(`Excluir a feição de trabalho “${p.titulo}”? Ela poderá ser restaurada.`, 'Excluir feição'))return;
        trash.push(ARPIASWork.sanitizeFeature(layer.toGeoJSON()));workGroup.removeLayer(layer);map.removeLayer(layer);dirty=true;renderWork();
      }));list.append(row);
    });
  }
  function download(name,text,type){const a=element('a');a.download=name;a.href=URL.createObjectURL(new Blob([text],{type}));a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
  byId('workExportGeo').addEventListener('click',()=>download('arpias360-camadas-trabalho.geojson',JSON.stringify(serialize(),null,2),'application/geo+json'));
  byId('workExportCSV').addEventListener('click',()=>download('arpias360-camadas-trabalho.csv','\uFEFF'+geo.csv(serialize()),'text/csv;charset=utf-8'));
  byId('restoreWork').addEventListener('click',async()=>{if(trash.length&&await request('edit')){workGroup.addLayer(workLayer(trash.pop()));dirty=true;renderWork();}});
  byId('saveWork').addEventListener('click',()=>{
    try{if(editing){editing.save();editing.disable();editing=null;byId('finishGeometry').hidden=true;}
      localStorage.setItem('arpias360.workspace.trash.v1',JSON.stringify({type:'FeatureCollection',features:trash}));ARPIASWork.save(localStorage,serialize());dirty=false;backup=serialize();backupTrash=JSON.parse(JSON.stringify(trash));byId('toolResult').textContent='Dados salvos neste dispositivo.';toast('Dados salvos neste dispositivo.');
    }catch(error){toast('Não foi possível salvar neste dispositivo. Exporte suas camadas para preservar o trabalho.');}
  });
  byId('editGeometry').addEventListener('click',()=>{
    if(mode!=='edit'||!workGroup.getLayers().length){toast('Crie uma feição de trabalho antes de editar vértices.');return;}stopHandler();
    workGroup.eachLayer(layer=>{if(!map.hasLayer(layer))layer.addTo(map);});
    editing=new L.EditToolbar.Edit(map,{featureGroup:workGroup,selectedPathOptions:{color:'#9b661a',weight:3,fillOpacity:.25}});editing.enable();byId('finishGeometry').hidden=false;byId('toolHint').textContent='Arraste os vértices ou pontos das suas camadas de trabalho. Bases oficiais protegidas.';
  });
  byId('finishGeometry').addEventListener('click',()=>{if(editing){editing.save();editing.disable();editing=null;dirty=true;renderWork();byId('finishGeometry').hidden=true;}});
  byId('cancelWork').addEventListener('click',()=>request('navigate'));
  ['consultBtn','mobileConsultBtn'].forEach(id=>byId(id).addEventListener('click',()=>request(mode==='consult'?'navigate':'consult')));
  byId('measureBtn').addEventListener('click',()=>request('measure'));byId('editBtn').addEventListener('click',()=>request('edit'));byId('exitTool').addEventListener('click',()=>request('navigate'));
  byId('measureDistance').addEventListener('click',()=>draw('line'));byId('measureArea').addEventListener('click',()=>draw('polygon'));byId('finishDrawing').addEventListener('click',finishDraw);
  ['Point','Line','Polygon'].forEach(type=>byId('draw'+type).addEventListener('click',()=>draw(type.toLowerCase())));
  byId('clearMeasure').addEventListener('click',()=>{stopHandler();measureGroup.clearLayers();byId('toolResult').textContent='Medição limpa.';byId('keepMeasure').hidden=true;});
  byId('keepMeasure').addEventListener('click',()=>request('navigate'));
  byId('clearSelectionBtn').addEventListener('click',()=>{closeMore();clearSelection();});byId('closeTerritorial').addEventListener('click',closeTerritorial);
  byId('shareSelectionBtn').addEventListener('click',()=>{closeMore();share();});byId('closeShare').addEventListener('click',()=>byId('shareDialog').close());
  byId('copySelectionLink').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(byId('selectionLink').value);toast('Link copiado.');}catch(error){byId('selectionLink').focus();byId('selectionLink').select();toast('Copie o link exibido.');}});
  map.on('popupclose',()=>{if(mode==='consult'){byId('toolPanel').hidden=false;byId('toolHint').textContent='Consulta ativada. Clique ou toque no local que deseja investigar.';}});
  function infoModal(title,rows,note){closeMore();const box=content(title,rows,note);box.firstChild.id='infoTitle';byId('infoBody').replaceChildren(box);byId('layerInfo').showModal();}
  byId('menuReport').addEventListener('click',()=>{closeMore();ARPIASReport.generate();});
  byId('helpBtn').addEventListener('click',()=>infoModal('Ajuda',[
    ['Buscar','Procure bairros ou coordenadas. A busca ignora acentos e espaços extras. Ruas ainda em integração.'],['Camadas','Escolha uma base e combine sobreposições temáticas.'],['Consultar','Ativa a consulta por clique; clique novamente em Consultar para encerrar.'],['Minha localização','Solicita ao navegador sua localização aproximada.'],['Mais','Medição, edição local, compartilhamento e relatório.'],['Escala','A barra mostra distância no terreno, não altitude. Varia com o zoom.']
  ]));
  byId('methodBtn').addEventListener('click',()=>infoModal('Metodologia',[
    ['Geometria','Área e distância geográficas por Turf. Estimativas sem certificação cadastral.'],['Referência','Centro de massa dos polígonos; ponderação por área para multipartes.'],['Incidências','Apenas no ponto de referência e entre feições carregadas.'],['Equipamentos','Cadastros de localização; não comprovam operação atual.'],['Dados pessoais','A ficha exibe somente os atributos públicos permitidos.']
  ]));
  function visibleLegend(){
    const box=element('div',undefined,'visible-legend');
    const definitions=[...overlayDefs.filter(d=>map.hasLayer(d.layer)),...civilDefs.filter(d=>d.layer&&d.input.checked)];
    definitions.forEach(d=>{const row=element('div',undefined,'legend-entry');const icon=element('span',undefined,`layer-icon ${d.symbolId||d.id}`);icon.append(symbol(d.symbolId||d.id));row.append(icon,element('span',d.name));box.append(row);});
    if(workGroup.getLayers().some(layer=>map.hasLayer(layer))){const row=element('div',undefined,'legend-entry');row.append(element('span','✎','legend-work'),element('span','Minhas camadas · trabalho do usuário'));box.append(row);}
    if(selection){const row=element('div',undefined,'legend-entry');row.append(element('span','◇','legend-selection'),element('span','Seleção · destaque âmbar'));box.append(row);}
    return box;
  }
  byId('legendBtn').addEventListener('click',()=>{
    const rows=[['Mapa-base',activeBaseDef.name]];
    overlayDefs.filter(d=>map.hasLayer(d.layer)).forEach(d=>rows.push([d.name,'Camada oficial visível']));civilDefs.filter(d=>d.layer&&d.input.checked).forEach(d=>rows.push([d.name,`${d.count} pontos · símbolo próprio`]));
    if(workGroup.getLayers().some(layer=>map.hasLayer(layer)))rows.push(['Minhas camadas','Feições de trabalho do usuário']);infoModal('Legenda das camadas visíveis',rows,'Ativa significa exibida no mapa; não confirma operação atual dos equipamentos.');byId('infoBody').append(visibleLegend());
  });
  byId('sourcesBtn').addEventListener('click',()=>infoModal('Fontes utilizadas',[
    ['Foto Aérea 2019','Prefeitura Municipal de Niterói / SIGeo · imagem histórica de 2019'],['Ruas','OpenStreetMap'],['Satélite recente',`NASA GIBS / VIIRS · ${recentDate} · sem imagem em tempo real`],['Defesa Civil','Prefeitura de Niterói / GeoNit / Defesa Civil'],['Camadas territoriais','Geoportal oficial de Niterói']
  ],'As fontes específicas e limitações das referências futuras estão nas informações do catálogo.'));
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  try{restore(ARPIASWork.read(localStorage));const raw=localStorage.getItem('arpias360.workspace.trash.v1');if(raw)trash=ARPIASWork.validateCollection(JSON.parse(raw)).features;renderWork();}catch(error){toast('Não foi possível ler as camadas locais. Os dados existentes não foram sobrescritos.');}
  const linked=ARPIASLocation.parse(new URLSearchParams(location.search));if(linked&&!linked.error)select({type:'Feature',geometry:{type:'Point',coordinates:[linked.lon,linked.lat]},properties:{}},'Local compartilhado',{},L.latLng(linked.lat,linked.lon));
  return {mode:()=>mode,request,select,query,clearSelection,selection:()=>selection,fitSelection,measurementRows,areaLabel,distanceLabel,publicAttributes:geo.publicAttributes,confirm,workGroup,measureGroup,showTerritorial,closeTerritorial,visibleLegend};
})();
