// Local HTTP preview; no dependencies and no writes to project data.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const port=Number(process.argv.find(arg=>arg.startsWith('--port='))?.split('=')[1]||8080);
const metrics=process.argv.includes('--metrics');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8'};
http.createServer((req,res)=>{
  const started=process.hrtime.bigint();
  let file;
  try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);res.end();return;}
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(file===root)file=path.join(root,'index.html');
  fs.readFile(file,(error,body)=>{
    if(error){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
    if(metrics)console.log(JSON.stringify({time:new Date().toISOString(),path:path.relative(root,file).replaceAll('\\','/'),bytes:body.length,serverMs:Number(process.hrtime.bigint()-started)/1e6}));
  });
}).listen(port,'127.0.0.1',()=>console.log(`ARPIAS360: http://127.0.0.1:${port}`));
