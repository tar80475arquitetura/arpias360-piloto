const test=require('node:test'),assert=require('node:assert/strict');
const prefs=require('../js/preferences.js');
const layers=['bairros','sirenes','relevo'],bases=['ortho','osm','recent'];
test('preferences reject malformed storage and unsupported versions without changing it',()=>{
  for(const raw of ['{','null','[]','{"version":2}']){
    let writes=0;assert.equal(prefs.read({getItem:()=>raw,setItem:()=>writes++},layers,bases),null);assert.equal(writes,0);
  }
  assert.equal(prefs.read({getItem(){throw Error('denied')}},layers,bases),null);
});
test('preferences retain only actual layers, finite opacity, boolean categories and bounded positions',()=>{
  const value=prefs.validate({version:1,base:'fake',visible:['sirenes','sirenes','fake'],workingLayer:'fake',layersOpen:'true',opacity:{sirenes:0,relevo:1,bairros:-1,osm:'0.5',ortho:Infinity},categories:{risk:true,unknown:'yes','__proto__':true},windows:{toolPanel:{x:10,y:20},aboutPanel:{x:NaN,y:100}}},layers,bases);
  assert.deepEqual(value.visible,['sirenes']);assert.deepEqual(value.opacity,{sirenes:0,relevo:1});assert.deepEqual(value.categories,{risk:true});assert.deepEqual(value.windows,{toolPanel:{x:10,y:20}});
  for(const key of ['base','workingLayer','layersOpen'])assert.equal(value[key],undefined);
});
test('map preferences round-trip independently of saved drawings and handle storage quota',()=>{
  const store=new Map([['arpias360.workspace.v1','keep-drawings']]);const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
  const value={version:1,base:'osm',visible:[],workingLayer:'sirenes',layersOpen:false,opacity:{sirenes:.4},categories:{risk:false},windows:{}};
  assert.equal(prefs.write(storage,value,layers,bases),true);assert.deepEqual(prefs.read(storage,layers,bases),value);assert.equal(store.get('arpias360.workspace.v1'),'keep-drawings');
  assert.equal(prefs.write({setItem(){throw Error('quota')}},value,layers,bases),false);
});
