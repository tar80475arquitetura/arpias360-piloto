const test=require('node:test');
const assert=require('node:assert/strict');
const location=require('../js/location.js');
const params=query=>new URLSearchParams(query);
test('a coordinate link supports default and optional zoom',()=>{
  assert.deepEqual(location.parse(params('lat=-22.9&lon=-43.1')),{lat:-22.9,lon:-43.1,zoom:17});
  assert.deepEqual(location.parse(params('lat=-22.9&lon=-43.1&zoom=15')),{lat:-22.9,lon:-43.1,zoom:15});
  assert.equal(location.parse(params('other=1')),null);
});
test('invalid, incomplete and ambiguous coordinate links are rejected',()=>{
  for(const query of ['lat=91&lon=0','lat=0&lon=-181','lat=&lon=0','lat=NaN&lon=0','lat=Infinity&lon=0','lat=0x10&lon=0','lat=0','lon=0','lat=0&lat=1&lon=0','lat=<script>&lon=0'])assert.ok(location.parse(params(query)).error,query);
});
test('invalid zoom never causes an unsafe view',()=>{
  for(const zoom of ['0','24','17.5','foo','','Infinity'])assert.ok(location.parse(params('lat=-22&lon=-43&zoom='+zoom)).error);
  assert.ok(location.parse(params('lat=-22&lon=-43&zoom=17&zoom=18')).error);
});
test('shared links remove metadata, fragments and credentials and round-trip',()=>{
  const url=location.build('https://name:secret@example.test/portal/?contact=remove&token=remove#old',-22.942424,-43.055849,16);
  assert.equal(url,'https://example.test/portal/?lat=-22.942424&lon=-43.055849&zoom=16');
  assert.deepEqual(location.parse(new URL(url).searchParams),{lat:-22.942424,lon:-43.055849,zoom:16});
});
test('coordinate links reject unsafe protocols and invalid input',()=>{
  assert.throws(()=>location.build('javascript:alert(1)',0,0));
  assert.throws(()=>location.build('https://example.test',Infinity,0));
  assert.throws(()=>location.build('https://example.test',0,0,NaN));
  assert.equal(new URL(location.build('http://localhost:8080',0,0,99)).searchParams.get('zoom'),'23');
});
