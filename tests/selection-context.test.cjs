const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/tools.js','utf8');
function harness({ownPopup=false,info=false,typing=false}={}){
 const selected={ref:{lat:-22.9,lng:-43.1},context:{}},popup={},calls=[];
 const c={selection:selected,selectionPopup:popup,currentPopup:ownPopup?popup:{},URLS:{bairros:'bairros',limite:'limite'},queryService:async()=>[{properties:{nome:'Bairro'}}],safeName:p=>p.nome,document:{activeElement:{matches:()=>typing}},byId:()=>({hidden:!info}),summary:()=>calls.push('summary'),showTerritorial:focus=>calls.push(['info',focus])};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('  async function resolveContext('),source.indexOf('  function queryInstruction(')),c);return {c,selected,calls};
}
test('late selection context never replaces an unrelated popup such as geolocation',async()=>{
 const h=harness();await h.c.resolveContext(h.selected);assert.deepEqual(h.calls,[]);assert.equal(h.selected.context.bairro,'Bairro');
});
test('context refresh keeps the selected result but does not steal Info focus',async()=>{
 const h=harness({info:true,ownPopup:true});await h.c.resolveContext(h.selected);assert.deepEqual(h.calls,[['info',false]]);
 const typing=harness({info:true,typing:true});await typing.c.resolveContext(typing.selected);assert.deepEqual(typing.calls,[]);
});
test('a cleared selection ignores context results still in flight',async()=>{
 const h=harness({ownPopup:true});h.c.selection=null;await h.c.resolveContext(h.selected);assert.deepEqual(h.calls,[]);assert.deepEqual(h.selected.context,{});
});
