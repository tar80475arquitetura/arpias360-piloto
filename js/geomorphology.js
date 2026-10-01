(function(root){
  const fields={PADRAO:'Padrão de relevo',UnGeomorf:'Unidade geomorfológica',UnMorfoest:'Unidade morfoestrutural',UnMorfoesc:'Unidade morfoescultural'};
  const warning='Camada geomorfológica de referência, elaborada em 2017. Não substitui mapeamento atualizado de risco, vistoria técnica ou laudo geotécnico.';
  const colors=['#618a63','#387971','#438887','#958450','#b39b62','#bd9b49','#caad72','#737582','#958595','#87726f','#5f727a','#75898c','#426580','#b99652','#a98048','#8e683b','#af7850','#99653e','#795535','#79644c','#367f9b'];
  function validate(data){
    if(data?.type!=='FeatureCollection'||data.features?.length!==399)throw Error('Pacote de relevo incompleto');
    data.features.forEach(f=>{if(f.type!=='Feature'||!['Polygon','MultiPolygon'].includes(f.geometry?.type)||f.properties?.MUNICIPIO!=='Niterói'||f.properties.UF!=='RJ'||Object.keys(fields).some(k=>typeof f.properties[k]!=='string'||!f.properties[k])||!f.properties.COD_REL)throw Error('Feição de relevo inválida');
      const walk=c=>{if(typeof c[0]==='number'){if(!Number.isFinite(c[0])||!Number.isFinite(c[1])||c[0]<-43.3||c[0]>-42.8||c[1]<-23.1||c[1]>-22.7)throw Error('Coordenadas fora de Niterói');}else c.forEach(walk);};walk(f.geometry.coordinates);
    });return data;
  }
  function classes(data,field){if(!fields[field])throw Error('Classificação inválida');const values=new Map();data.features.forEach(f=>{const value=f.properties[field],key=field==='PADRAO'?f.properties.COD_REL:value;if(!values.has(key))values.set(key,{key,name:value,count:0});values.get(key).count++;});return [...values.values()].sort((a,b)=>a.key.localeCompare(b.key,'pt')).map((c,i)=>({...c,color:colors[i%colors.length],dashArray:i%3===1?'6 2':i%3===2?'2 2':null}));}
  function style(data,field,feature){const key=field==='PADRAO'?feature.properties.COD_REL:feature.properties[field],c=classes(data,field).find(c=>c.key===key);return {color:c.color,fillColor:c.color,weight:1.5,opacity:.95,fillOpacity:.25,dashArray:c.dashArray};}
  const api={fields,warning,validate,classes,style,source:'CPRM / Serviço Geológico do Brasil · 2017 · 1:30.000',url:'https://rigeo.sgb.gov.br/handle/doc/17483'};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASGeomorphology=api;
})(typeof window==='object'?window:globalThis);
