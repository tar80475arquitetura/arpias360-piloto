const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const text=fs.readFileSync('js/tools.js','utf8');
function harness({mode='consult',target='bairros',reply=[],zoom=17}={}){
 const selections=[],requests=[],hint={textContent:''};
 const c={mode,queryLayer:target,generation:0,overlayDefs:[{id:'bairros',name:'Bairros'},{id:'lotes',name:'Lotes'}],civilDefs:[],reliefDefs:[],map:{getZoom:()=>zoom},URLS:{bairros:'official/bairros',lotes:'official/lotes'},byId:()=>hint,clearSelection:()=>{c.generation++},queryService:async(url)=>{requests.push(url);return reply},select:(f,t,m)=>selections.push({f,m}),showTerritorial:()=>{},console};
 vm.createContext(c);vm.runInContext(text.slice(text.indexOf('  async function query(latlng,hit){'),text.indexOf('  function closeTerritorial()'))+'\nthis.run=query;',c);return {c,selections,requests,hint};
}
test('consultation without a chosen layer or outside consultation ignores map hits',async()=>{for(const options of [{target:null},{mode:'navigate'},{mode:'measure'},{mode:'edit'}]){const h=harness(options);await h.c.run({lat:0,lng:0},{layerId:'bairros',feature:{properties:{}}});assert.equal(h.selections.length,0);assert.equal(h.requests.length,0)}});
test('an overlaid wrong layer cannot become the query target',async()=>{const intended={properties:{nome:'Bairro real'},geometry:{type:'Polygon'}};const h=harness({reply:[intended]});await h.c.run({lat:0,lng:0},{layerId:'lotes',feature:{properties:{nome:'Lote errado'}}});assert.deepEqual(h.requests,['official/bairros']);assert.equal(h.selections[0].m.layerId,'bairros');assert.equal(h.selections[0].f,intended)});
test('empty and failed queries never fabricate a selected point and have distinct feedback',async()=>{for(const reply of [[],null]){const h=harness({reply});await h.c.run({lat:0,lng:0});assert.equal(h.selections.length,0);assert.match(h.hint.textContent,reply===null?/indisponível/:/Nenhuma feição/)}});
test('a stale response after changing the target is ignored',async()=>{const h=harness();h.c.queryService=async()=>{h.c.queryLayer='lotes';return [{properties:{}}]};await h.c.run({lat:0,lng:0});assert.equal(h.selections.length,0)});
test('lot consultation requires cadastral zoom before requesting data',async()=>{const h=harness({target:'lotes',zoom:13});await h.c.run({lat:0,lng:0});assert.equal(h.requests.length,0);assert.match(h.hint.textContent,/zoom 16/)});
test('local relief query uses actual polygons even when a different overlay receives the click',async()=>{const h=harness({target:'relevo'}),f={type:'Feature',properties:{PADRAO:'Colinas'},geometry:{type:'Polygon',coordinates:[[[-43,-23],[-42.99,-23],[-42.99,-22.99],[-43,-23]]]}};h.c.reliefDefs=[{id:'relevo',ready:true,name:'Relevo',source:'CPRM',data:{features:[f]}}];h.c.ARPIASTurf=require('@turf/turf');await h.c.run({lat:-22.999,lng:-42.995},{layerId:'bairros',feature:{properties:{nome:'Outro'}}});assert.equal(h.requests.length,0);assert.equal(h.selections[0].f,f);assert.equal(h.selections[0].m.source,'CPRM')});
test('automatic consultation uses the clicked visible feature and keeps automatic mode',async()=>{
 const f={properties:{nome:'Bairro clicado'},geometry:{type:'Polygon'}};const h=harness({target:'auto'});
 await h.c.run({lat:0,lng:0},{layerId:'bairros',feature:f});assert.equal(h.requests.length,0);assert.equal(h.selections[0].f,f);assert.equal(h.c.queryLayer,'auto');
});
test('automatic consultation on an empty map click requests an explicit choice',async()=>{
 const h=harness({target:'auto'});await h.c.run({lat:0,lng:0});assert.equal(h.requests.length,0);assert.equal(h.selections.length,0);assert.match(h.hint.textContent,/feição visível/);
});
