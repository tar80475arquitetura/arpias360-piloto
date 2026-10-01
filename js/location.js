/* Coordinate-only links. No identifiers, dataset attributes or unrelated URL parameters. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ARPIASLocation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function validCoordinates(lat,lon){
    return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
  }
  function numeric(value){
    if(typeof value!=='string'||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))return NaN;
    return Number(value.trim());
  }
  function parse(params){
    if(!params.has('lat')&&!params.has('lon'))return null;
    if(params.getAll('lat').length!==1||params.getAll('lon').length!==1)return {error:'O link precisa conter uma latitude e uma longitude.'};
    const lat=numeric(params.get('lat')),lon=numeric(params.get('lon'));
    if(!validCoordinates(lat,lon))return {error:'Coordenadas do link inválidas: latitude entre −90 e 90 e longitude entre −180 e 180.'};
    const zoom=params.has('zoom')?numeric(params.get('zoom')):17;
    if(!Number.isInteger(zoom)||zoom<10||zoom>23||params.getAll('zoom').length>1)return {error:'Zoom do link inválido. Use um número inteiro entre 10 e 23.'};
    return {lat,lon,zoom};
  }
  function build(base,lat,lon,zoom=17){
    if(!validCoordinates(lat,lon)||!Number.isFinite(zoom))throw new Error('Coordenadas ou zoom inválidos');
    const url=new URL(base);
    if(url.protocol!=='https:'&&url.protocol!=='http:')throw new Error('Endereço de compartilhamento inválido');
    url.username='';url.password='';url.search='';url.hash='';
    url.searchParams.set('lat',lat.toFixed(6));url.searchParams.set('lon',lon.toFixed(6));
    url.searchParams.set('zoom',String(Math.min(23,Math.max(10,Math.round(zoom)))));
    return url.href;
  }
  return {validCoordinates,parse,build};
});
