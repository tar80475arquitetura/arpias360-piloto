const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/app.js','utf8');
function setup(){const context={civilDefs:[],reliefStyle:()=>({})};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function applyLayerOpacity('),source.indexOf('function appendOpacity(')),context);return context;}
test('invalid opacity never changes a layer; zero remains a valid invisible style',()=>{
 const c=setup(),values=[],d={opacity:.6,layer:{setOpacity:value=>values.push(value)}};
 for(const value of [-1,1.01,NaN,Infinity,'0.5',null])assert.equal(c.applyLayerOpacity(d,value,true),false);
 assert.equal(d.opacity,.6);assert.deepEqual(values,[]);assert.equal(c.applyLayerOpacity(d,0,true),true);assert.deepEqual(values,[0]);
});
test('vector opacity preserves the original fill/line ratio across repeated changes',()=>{
 const c=setup();let style;const d={layer:{options:{style:()=>({opacity:.8,fillOpacity:.2,color:'green'})},setStyle:fn=>{style=fn({});}}};
 c.applyLayerOpacity(d,.5);assert.equal(style.opacity,.4);assert.equal(style.fillOpacity,.1);c.applyLayerOpacity(d,1);assert.equal(style.opacity,.8);assert.equal(style.fillOpacity,.2);assert.equal(style.color,'green');
});
test('civil markers and unloaded layers accept the same validated opacity',()=>{
 const c=setup(),values=[],d={layer:{eachLayer:fn=>{fn({setOpacity:v=>values.push(v)});fn({setOpacity:v=>values.push(v)});}}};c.civilDefs.push(d);
 c.applyLayerOpacity(d,.35);assert.deepEqual(values,[.35,.35]);const unloaded={};assert.equal(c.applyLayerOpacity(unloaded,.2),true);assert.equal(unloaded.opacity,.2);
});
