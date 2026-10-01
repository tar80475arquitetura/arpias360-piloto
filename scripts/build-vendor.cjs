const fs=require('node:fs');
const path=require('node:path');
const esbuild=require('esbuild');
async function build(){
  fs.mkdirSync('js/vendor',{recursive:true});
  await esbuild.build({stdin:{contents:"import {area,length,centroid,centerOfMass,point,booleanPointInPolygon,booleanPointOnLine,distance} from '@turf/turf'; window.ARPIASTurf={area,length,centroid,centerOfMass,point,booleanPointInPolygon,booleanPointOnLine,distance};",resolveDir:process.cwd()},bundle:true,minify:true,outfile:'js/vendor/turf.js',platform:'browser'});
  await esbuild.build({stdin:{contents:"import QRCode from 'qrcode'; window.ARPIASQR=QRCode;",resolveDir:process.cwd()},bundle:true,minify:true,outfile:'js/vendor/qr.js',platform:'browser'});
  const draw=path.dirname(require.resolve('leaflet-draw/package.json'));
  fs.cpSync(path.join(draw,'dist'),'js/vendor/leaflet-draw',{recursive:true});
  for(const [name,dir] of [['turf','@turf/turf'],['leaflet-draw','leaflet-draw'],['qrcode','qrcode']]){
    const base=path.dirname(require.resolve(dir+'/package.json'));
    const license=fs.readdirSync(base).find(file=>/^licen[sc]e/i.test(file));
    if(license)fs.copyFileSync(path.join(base,license),'js/vendor/'+name+'-LICENSE');
  }
}
build().catch(error=>{console.error(error);process.exitCode=1;});
