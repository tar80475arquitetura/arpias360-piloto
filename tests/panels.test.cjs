const test=require('node:test'),assert=require('node:assert/strict');
const {clamp}=require('../js/panels.js');
const prefs=require('../js/preferences.js');
test('movable windows stay fully within their frame at every edge',()=>{
  assert.deepEqual(clamp(-40,-80,350,580,1366,680),{x:0,y:0});
  assert.deepEqual(clamp(2000,2000,350,580,1366,680),{x:1016,y:100});
  assert.deepEqual(clamp(120,50,350,580,1366,680),{x:120,y:50});
});
test('moving windows keeps their handle reachable in a smaller frame',()=>{
  assert.deepEqual(clamp(500,500,350,580,320,460),{x:0,y:0});
  assert.deepEqual(clamp(300,300,304,352,320,460),{x:16,y:108});
});
test('preferences validate new movable panels and reject unknown or invalid positions',()=>{
  const windows={panel:{x:10,y:20},territorialPanel:{x:30,y:40},querySheet:{x:0,y:60},arbitrary:{x:0,y:0},toolPanel:{x:-1,y:10},aboutPanel:{x:Infinity,y:20}};
  const valid=prefs.validate({version:1,windows},[],[]);
  assert.deepEqual(valid.windows,{panel:{x:10,y:20},territorialPanel:{x:30,y:40},querySheet:{x:0,y:60}});
});
