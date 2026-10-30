import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root=resolve('dist/extension');
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
    try{
        const name=decodeURIComponent(new URL(req.url,'http://test').pathname);
        if(name==='/') {res.setHeader('Content-Type','text/html');return res.end('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/ui/style.css"></head><body><div id="app"></div><script type="module" src="/ui/main.js"></script></body></html>')}
        const file=resolve(root,'.'+name);
        if(!file.startsWith(root+sep)||(await stat(file)).isDirectory()){res.writeHead(404);return res.end()}
        res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
    }catch{res.writeHead(404);res.end()}
});
server.listen(Number(process.env.TEST_PORT||4173),'0.0.0.0',()=>console.log('Local isolated package fixture ready'));
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{server.closeAllConnections();server.close()});
