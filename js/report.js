/* Browser-only printable evidence; only public, selected attributes are used. */
const ARPIASReport=(()=>{
  const byId=id=>document.getElementById(id);
  function loadImage(src,crossOrigin=false){return new Promise((resolve,reject)=>{const image=new Image();if(crossOrigin)image.crossOrigin='anonymous';const timer=setTimeout(()=>reject(Error('Tempo excedido ao capturar imagem')),8000);image.onload=()=>{clearTimeout(timer);resolve(image);};image.onerror=()=>{clearTimeout(timer);reject(Error('Imagem sem acesso para exportação'));};image.src=src;});}
  async function mapImage(){
    const frame=map.getContainer().getBoundingClientRect();const factor=Math.min(2,1800/frame.width);
    const canvas=document.createElement('canvas');canvas.width=Math.round(frame.width*factor);canvas.height=Math.round(frame.height*factor);
    const ctx=canvas.getContext('2d');ctx.scale(factor,factor);ctx.fillStyle='#e7eee7';ctx.fillRect(0,0,frame.width,frame.height);
    const tiles=[...document.querySelectorAll('#map img.leaflet-tile-loaded')].filter(image=>{const r=image.getBoundingClientRect();return image.complete&&image.naturalWidth&&r.right>frame.left&&r.left<frame.right&&r.bottom>frame.top&&r.top<frame.bottom;});
    const loaded=await Promise.all(tiles.map(async tile=>({tile,image:await loadImage(tile.currentSrc||tile.src,true)})));
    loaded.forEach(({tile,image})=>{const r=tile.getBoundingClientRect();ctx.drawImage(image,r.left-frame.left,r.top-frame.top,r.width,r.height);});
    for(const node of document.querySelectorAll('#map .leaflet-overlay-pane canvas,#map .leaflet-overlay-pane svg')){
      const r=node.getBoundingClientRect();if(!r.width||!r.height)continue;
      let image=node;
      if(node.tagName.toLowerCase()!=='canvas'){const copy=node.cloneNode(true);const originalPaths=node.querySelectorAll('path');copy.querySelectorAll('path').forEach((path,index)=>{path.style.filter=getComputedStyle(originalPaths[index]).filter;});image=await loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(copy)));}
      ctx.drawImage(image,r.left-frame.left,r.top-frame.top,r.width,r.height);
    }
    for(const marker of document.querySelectorAll('#map .civil-marker,#map .work-point')){
      const r=marker.getBoundingClientRect();if(!r.width||!r.height||r.right<frame.left||r.left>frame.right||r.bottom<frame.top||r.top>frame.bottom)continue;
      const color=getComputedStyle(marker).color;ctx.fillStyle='#fff';ctx.strokeStyle=color;ctx.lineWidth=2;
      ctx.beginPath();if(marker.classList.contains('work-point'))ctx.rect(r.left-frame.left+1,r.top-frame.top+1,r.width-2,r.height-2);else ctx.arc(r.left-frame.left+r.width/2,r.top-frame.top+r.height/2,r.width/2-1,0,Math.PI*2);ctx.fill();ctx.stroke();
      const svg=marker.querySelector('svg');if(svg){const copy=svg.cloneNode(true);copy.setAttribute('color',color);copy.setAttribute('width','24');copy.setAttribute('height','24');copy.setAttribute('fill','none');copy.setAttribute('stroke',color);copy.setAttribute('stroke-width','1.8');const image=await loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(copy)));ctx.drawImage(image,r.left-frame.left+4,r.top-frame.top+4,r.width-8,r.height-8);}else{ctx.fillStyle=color;ctx.font='16px system-ui';ctx.fillText('✎',r.left-frame.left+5,r.top-frame.top+21);}
    }
    for(const label of document.querySelectorAll('#map .territory-label')){
      const r=label.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(label).visibility==='hidden')continue;
      ctx.fillStyle='#fff';ctx.fillRect(r.left-frame.left,r.top-frame.top,r.width,r.height);ctx.fillStyle='#172f29';ctx.font=getComputedStyle(label).font;ctx.fillText(label.textContent,r.left-frame.left+6,r.top-frame.top+r.height-6);
    }
    const y=frame.height/2;const meters=map.distance(map.containerPointToLatLng([20,y]),map.containerPointToLatLng([120,y]));
    const magnitude=10**Math.floor(Math.log10(meters));const rounded=([5,2,1].find(n=>n*magnitude<=meters)||1)*magnitude;const width=rounded/meters*100;
    ctx.fillStyle='#fff';ctx.fillRect(12,frame.height-54,width+22,42);ctx.strokeStyle='#172f29';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(22,frame.height-22);ctx.lineTo(22+width,frame.height-22);ctx.stroke();ctx.fillStyle='#172f29';ctx.font='13px system-ui';ctx.fillText(ARPIASUI.distanceLabel(rounded),22,frame.height-31);
    ctx.fillStyle='#fff';ctx.fillRect(frame.width-49,12,37,55);ctx.fillStyle='#172f29';ctx.font='bold 16px system-ui';ctx.fillText('N',frame.width-36,30);ctx.beginPath();ctx.moveTo(frame.width-31,35);ctx.lineTo(frame.width-37,55);ctx.lineTo(frame.width-31,49);ctx.lineTo(frame.width-25,55);ctx.closePath();ctx.fill();
    return canvas.toDataURL('image/png');
  }
  function visibleLayers(){
    const result=overlayDefs.filter(d=>map.hasLayer(d.layer)).map(d=>({name:d.name,source:'Prefeitura Municipal de Niterói / GeoNit',color:d.layer.options.style?.color||'#536976'}));
    reliefDefs.filter(d=>d.layer&&map.hasLayer(d.layer)).forEach(d=>result.push({name:d.name,source:d.source+' · '+ARPIASGeomorphology.warning}));
    civilDefs.filter(d=>d.layer&&map.hasLayer(d.layer)).forEach(d=>result.push({name:d.name,source:'Prefeitura de Niterói / GeoNit / Defesa Civil'}));
    if(ARPIASUI.workGroup.getLayers().some(layer=>map.hasLayer(layer)))result.push({name:'Minhas camadas',source:'Camadas de trabalho / não oficiais'});return result;
  }
  async function nearby(s){
    const rows=[];await Promise.all(civilDefs.map(async d=>{
      const layer=await loadCivil(d);if(!layer)return;
      let nearest=null,minimum=Infinity;layer.eachLayer(marker=>{const ll=marker.getLatLng(),distance=ARPIASGeometry.distance([s.metrics.lon,s.metrics.lat],[ll.lng,ll.lat]);if(distance<minimum){minimum=distance;nearest=marker;}});
      if(nearest)rows.push([d.name,`${nearest.feature.properties.nome} · ${ARPIASUI.distanceLabel(minimum)}`]);
    }));return rows;
  }
  function incidence(s){
    const rows=[];const p=ARPIASTurf.point([s.metrics.lon,s.metrics.lat]);
    overlayDefs.filter(d=>map.hasLayer(d.layer)).forEach(d=>{
      const hits=[];d.layer.eachFeature(layer=>{const f=layer.toGeoJSON();try{if(/Polygon/.test(f.geometry.type)&&ARPIASTurf.booleanPointInPolygon(p,f))hits.push(safeName(f.properties));else if(/LineString/.test(f.geometry.type)&&ARPIASTurf.booleanPointOnLine(p,f))hits.push(safeName(f.properties));}catch(error){/* unsupported geometry is not assigned an incident status */}});
      if(hits.length)rows.push([d.name,[...new Set(hits)].join(', ')]);
    });return rows;
  }
  async function generate(){
    const s=ARPIASUI.selection();if(!s){toast('Selecione um local para gerar a ficha técnica.');return;}
    if(byId('technicalReport').open)return;
    const body=byId('reportBody');body.replaceChildren(element('p','Preparando mapa e dados reais da seleção…'));byId('printReport').disabled=true;byId('technicalReport').showModal();
    ARPIASUI.fitSelection();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(activeBaseDef.layer.isLoading())await Promise.race([new Promise(resolve=>activeBaseDef.layer.once('load',resolve)),new Promise(resolve=>setTimeout(resolve,6000))]);
    try{
      const [image,nearest]=await Promise.all([mapImage(),nearby(s)]);
      if(ARPIASUI.selection()!==s){byId('technicalReport').close();toast('A seleção mudou. Gere novamente o relatório.');return;}
      const date=new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
      body.replaceChildren(element('h1','ARPIAS360'),element('p','Avaliação de Riscos e Planejamento Integrado de Áreas Sensíveis'),element('h2','RELATÓRIO TÉCNICO DO LOCAL SELECIONADO'),element('p',`${date} · America/Sao_Paulo`,'report-date'));
      const img=element('img');img.src=image;img.alt='Mapa enquadrado com seleção, camadas visíveis, escala geográfica e norte';img.className='report-map';body.append(img);
      body.append(content('Identificação',[
        ['Seleção',s.title],['Município',s.context.municipio||'Não confirmado · piloto Niterói/RJ'],['Bairro',s.context.bairro||'Não identificado'],['Região administrativa',s.context.regiao||'Não identificada'],['Mapa-base',activeBaseDef.name],['Inscrição municipal','Dado ainda não integrado'],['Identificador ARPIAS','Integração futura']
      ]),content('Geometria e localização',ARPIASUI.measurementRows(s.metrics),'Estimativas geográficas por Turf 7.2.0, sem precisão cadastral certificada. Centroide dos polígonos: centro de massa, ponderado por área nas geometrias multipartes.'));
      ARPIASUI.publicAttributes(s.feature.properties).forEach(group=>body.append(content(group.title,group.rows)));
      if(s.meta.layerId==='relevo')body.append(content('Referência geomorfológica',[['Fonte',ARPIASGeomorphology.source]],ARPIASGeomorphology.warning));
      if(s.meta.work)body.append(content('Geometria de trabalho / não oficial',[['Referência original',s.feature.arpiasOrigin?`${s.feature.arpiasOrigin.layer} · ${s.feature.arpiasOrigin.id}`:'Desenho do usuário'],['Persistência','Local neste dispositivo; sem sincronização com servidor']]));
      const incident=incidence(s);body.append(content('Características territoriais no ponto de referência',incident,incident.length?'Incidências entre as feições oficiais carregadas das camadas visíveis; não é uma análise integral da extensão da seleção.':'Nenhuma incidência foi confirmada entre as feições carregadas. Isso não comprova ausência de restrições ou riscos.'));
      body.append(content('Riscos e Proteção Civil · referências próximas',nearest,'Distâncias em linha reta até locais cadastrados. Não confirmam funcionamento atual, abertura, atendimento ou condição de risco.'));
      body.append(content('Índice ARPIAS de Fragilidade Urbana',[['Status','Em desenvolvimento metodológico · sem pontuação calculada']]));
      const visible=visibleLayers();body.append(content('Legenda · camadas visíveis',visible.map(layer=>[layer.name,'Camada ativada na captura']),'A barra representa distância no terreno; o norte indica a orientação do mapa. A escala varia com o enquadramento.'),ARPIASUI.visibleLegend());
      const sources=new Set(visible.map(layer=>layer.source));sources.add(activeBaseDef.id==='ortho'?'Prefeitura Municipal de Niterói / SIGeo · Ortofoto 2019':activeBaseDef.id==='osm'?'OpenStreetMap contributors':`NASA GIBS / VIIRS · ${recentDate}`);
      if(nearest.length)sources.add('Prefeitura de Niterói / GeoNit / Defesa Civil');if(s.meta.source)sources.add(s.meta.source);if(s.context.bairro||s.context.regiao||s.context.municipio)sources.add('Geoportal oficial de Niterói · identificação territorial');
      body.append(content('Fontes efetivamente utilizadas',[...sources].map(source=>['Fonte',source])));
      const observations=element('label',undefined,'report-notes-input');observations.append(element('strong','Observações técnicas (opcional)'));const textarea=element('textarea');textarea.id='reportNotes';textarea.maxLength=4000;observations.append(textarea);body.append(observations);
      const note=element('p',undefined,'report-observation');note.hidden=true;body.append(note);
      const share=ARPIASLocation.build(location.href,s.metrics.lat,s.metrics.lon,map.getZoom());body.append(element('p',`Referência compartilhável: ${share}`,'report-link'));
      body.append(element('footer','Documento gerado pelo protótipo experimental ARPIAS360. As informações devem ser verificadas junto às fontes oficiais antes de uso administrativo, jurídico ou decisório.'));
      byId('printReport').disabled=false;
    }catch(error){console.error('Relatório:',error);body.replaceChildren(element('p','Não foi possível capturar o mapa para o relatório. Verifique a disponibilidade e as permissões CORS da fonte e tente novamente.'));toast('Não foi possível gerar a ficha técnica com imagem.');}
  }
  byId('closeReport').addEventListener('click',()=>byId('technicalReport').close());
  byId('printReport').addEventListener('click',()=>{
    const text=byId('reportNotes').value.trim(),note=document.querySelector('.report-observation');note.hidden=!text;note.textContent=text;
    window.print();
  });
  return {generate,mapImage};
})();
