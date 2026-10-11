const test=require('node:test');const assert=require('node:assert/strict');
const portal=require('../js/portal.js'),location=require('../js/location.js');
const catalog=require('../data/catalogo.json');
function storage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),values};}
test('four tools reference only existing categories, preserve all catalog ids and canonical free order',()=>{
 assert.deepEqual(portal.modes.map(m=>m.id),['resilience','territorial','integrated','free']);
 const ids=catalog.groups.map(g=>g.id);
 for(const mode of portal.modes){assert.ok(mode.groups.every(id=>ids.includes(id)));const ordered=portal.order(ids,mode.id);assert.equal(ordered.length,ids.length);assert.deepEqual([...ordered].sort(),[...ids].sort());if(mode.groups.length)assert.equal(ordered[0],mode.groups[0]);}
 assert.deepEqual(portal.order(ids,'free'),ids);assert.equal(portal.mode('unsafe').id,'free');
});
test('portal preference isolates navigation from layers, work, selections, identities and privileges',()=>{
 const s=storage();s.setItem('arpias360.preferences.v1','map prefs');s.setItem('drawings','work');
 assert.ok(portal.write(s,{version:1,mode:'integrated',profile:'researcher',visible:['sirenes'],privilege:'admin'}));
 assert.deepEqual(portal.read(s),{version:1,mode:'integrated',profile:'researcher'});
 assert.equal(s.getItem('arpias360.preferences.v1'),'map prefs');assert.equal(s.getItem('drawings'),'work');
 assert.deepEqual(portal.profiles,['citizen','manager','business','researcher']);
});
test('invalid, obsolete, malformed or unavailable storage never supplies arbitrary context/profile',()=>{
 for(const v of [null,[],{version:2},{mode:'free'},'x'])assert.equal(portal.validate(v),null);
 assert.deepEqual(portal.validate({version:1,mode:'<script>',profile:'admin'}),{version:1,mode:'free',profile:''});
 const s=storage();s.setItem(portal.key,'{broken');assert.equal(portal.read(s),null);
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('quota')}};
 assert.equal(portal.read(denied),null);assert.equal(portal.write(denied,{version:1,mode:'free'}),false);
 assert.equal(portal.write(s,{version:99}),false);
});
test('root and unknown params show portal; recognized coordinate links and errors keep existing URL contract',()=>{
 for(const query of ['', 'utm_source=qr','zoom=17','feature=unknown'])assert.equal(portal.directLink(new URLSearchParams(query),location),false);
 for(const query of ['lat=-22.9&lon=-43.1&zoom=17','lat=no&lon=-43.1','lat=-22.9','lat=999&lon=0','lat=0&lon=0&lat=1']){
  const params=new URLSearchParams(query),before=params.toString();assert.equal(portal.directLink(params,location),true);assert.equal(params.toString(),before);
 }
});
