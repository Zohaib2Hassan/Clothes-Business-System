import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const port = Number(process.env.PORT || 8082);
const types = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.ico':'image/x-icon', '.ttf':'font/ttf', '.svg':'image/svg+xml' };
http.createServer((req,res) => {
  let pathname; try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  let filename=path.resolve(root,'.'+pathname);
  if(!filename.startsWith(root+path.sep) && filename!==root) { res.writeHead(403).end(); return; }
  if(!fs.existsSync(filename)||fs.statSync(filename).isDirectory()) filename=path.join(root,'index.html');
  if(!fs.existsSync(filename)) { res.writeHead(503,{'Content-Type':'text/plain'}).end('Preview is rebuilding. Please refresh shortly.'); return; }
  res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});
  const stream=fs.createReadStream(filename); stream.on('error',()=>res.destroy()); stream.pipe(res);
}).listen(port,'0.0.0.0',()=>console.log(`Threadly Pocket preview: http://localhost:${port}`));
