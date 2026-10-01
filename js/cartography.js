/* Display styles only: no source geometry or attributes are changed. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ARPIASCartography=api;})(typeof globalThis==='object'?globalThis:this,()=>{
  const styles={
    limite:{color:'#9b4d17',weight:3.5,fillOpacity:0,dashArray:'10 6'},
    bairros:{color:'#806226',weight:2.5,fillColor:'#d3ae68',fillOpacity:.04},
    hidro:{color:'#216d79',weight:3,opacity:1,fillOpacity:0},
    zeis:{color:'#705484',weight:3,fillColor:'#a77bcc',fillOpacity:.22,dashArray:'8 3'},
    zeia:{color:'#376e4d',weight:3,fillColor:'#75ad7b',fillOpacity:.2,dashArray:'3 4'},
    appm:{color:'#285c3a',weight:3,fillColor:'#4f965b',fillOpacity:.22},
    apa:{color:'#596c2e',weight:3,fillColor:'#95b467',fillOpacity:.18,dashArray:'10 4 2 4'},
    comunidades:{color:'#a14d63',weight:3,fillColor:'#d58e9e',fillOpacity:.22,dashArray:'6 4'},
    lotes:{color:'#77508a',weight:2.5,fillColor:'#b59bc8',fillOpacity:.1},
    work:{color:'#705484',weight:3.5,fillColor:'#b59bc8',fillOpacity:.2,dashArray:'9 4'},
    measure:{color:'#9b661a',weight:4,fillColor:'#e9ad38',fillOpacity:.22,dashArray:'3 5'},
    'measure-kept':{color:'#9b661a',weight:4,fillColor:'#e9ad38',fillOpacity:.22,dashArray:'12 4 2 4'},
    consult:{color:'#9b661a',weight:4.5,fillColor:'#e9ad38',fillOpacity:.08},
    search:{color:'#216d79',weight:4.5,fillColor:'#60a8b3',fillOpacity:.24,dashArray:'10 5'},
    editing:{color:'#705484',weight:5,fillColor:'#b59bc8',fillOpacity:.28,dashArray:'2 4'}
  };
  function style(id){if(!styles[id])throw Error('Unknown cartographic style: '+id);return {...styles[id],className:'cartographic-path cartographic-'+id};}
  function selectionKind(meta={}){return meta.origin==='search'?'search':'consult';}
  function selectionStyle(meta,type){const id=selectionKind(meta),result=style(id);if(id==='consult'&&/Polygon/.test(type)){result.fillOpacity=meta?.layerId==='lotes'?.14:.04;}if(type==='Point'){result.radius=id==='consult'?20:10;result.fillOpacity=id==='consult'?0:1;}return result;}
  return {style,selectionKind,selectionStyle,ids:Object.keys(styles)};
});
