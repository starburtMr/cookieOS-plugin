import {createServer} from 'node:http';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {join,resolve,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {getTool} from 'ctool-config';
import httpProxy from 'http-proxy';
import {chromium,expect} from '@playwright/test';

async function main(){
const config=JSON.parse(await readFile(process.argv[2],'utf8'));
const proxy=httpProxy.createProxyServer({target:config.apiOrigin,changeOrigin:true});
proxy.on('error',(_error,_request,response)=>{response.writeHead(502);response.end()});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf'};
const root=resolve(config.uiRoot);
const server=createServer(async(req,res)=>{
    if(/^\/(api|health|agent)(\/|$)/.test(req.url)){proxy.web(req,res);return;}
    try{
        let file=resolve(root,'.'+new URL(req.url,config.origin).pathname);
        if(!file.startsWith(root+sep)){res.writeHead(404);res.end();return;}
        if(!await stat(file).then(v=>v.isFile()).catch(()=>false))file=join(root,'index.html');
        res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
    }catch{res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(Number(new URL(config.origin).port),'127.0.0.1',r));
const browser=await chromium.launch({headless:true});
const samples=[];
const errors=[];
const md5='900150983cd24fb0d6963f7d28e17f72';
async function context(){
    const ctx=await browser.newContext({viewport:{width:1074,height:884},locale:'zh-CN'});
    const split=config.cookie.indexOf('=');
    await ctx.addCookies([{name:config.cookie.slice(0,split),value:config.cookie.slice(split+1),url:config.origin,httpOnly:true,sameSite:'Strict'}]);
    await ctx.addInitScript(()=>{
        window.__ctoolPerformance={long:[],supported:PerformanceObserver.supportedEntryTypes.includes('longtask')};
        if(PerformanceObserver.supportedEntryTypes.includes('longtask'))new PerformanceObserver(list=>{window.__ctoolPerformance.long.push(...list.getEntries().map(v=>({start:v.startTime,duration:v.duration})))}).observe({type:'longtask',buffered:true});
    });
    return ctx;
}
async function open(ctx,mode){
    const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.__resourceHeaders=new Map();
    page.on('response',response=>{
        const name=new URL(response.url()).pathname.split('/').pop();
        if(!/\.(js|css|wasm|ttf|woff2?)$/.test(name))return;
        const headers=response.headers();
        page.__resourceHeaders.set(name,{name,cacheControl:headers['cache-control']??null,contentEncoding:headers['content-encoding']??null,etag:headers.etag??null});
    });
    const session=await ctx.newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:4});
    const start=performance.now();await page.goto(config.origin+'/extensions/'+config.extensionId);
    const iframe=page.locator('iframe[src*="/'+config.extensionId+'/frame/"]');await expect(iframe).toBeVisible({timeout:30000});
    const frame=await (await iframe.elementHandle()).contentFrame();
    const input=frame.locator('.ctool-main-tool textarea:not([readonly])').first();await input.fill('abc');
    await expect(frame.locator('.ctool-main-tool textarea[placeholder="md5"]')).toHaveValue(md5);
    samples.push({scenario:mode,ms:performance.now()-start,...await resources(frame)});
    return{page,frame};
}
async function resources(frame){
    const stats = await frame.evaluate(()=>{
        const rows=performance.getEntriesByType('resource').filter(v=>/\.(js|css|wasm|ttf|woff2?)(\?|$)/.test(v.name)).map(v=>({name:new URL(v.name).pathname.split('/').pop(),start:v.startTime,ms:v.duration,transfer:v.transferSize,encoded:v.encodedBodySize,decoded:v.decodedBodySize}));
        return{initialHash:location.hash,allFrameRequests:performance.getEntriesByType("resource").length,requests:rows.length,transfer:rows.reduce((s,v)=>s+v.transfer,0),decodedJS:rows.filter(v=>v.name.endsWith('.js')).reduce((s,v)=>s+v.decoded,0),resources:rows,longTasks:window.__ctoolPerformance.supported?window.__ctoolPerformance.long:null};
    });
    const storageReads = await frame.page().evaluate(()=>performance.getEntriesByType('resource').filter(v=>/\/extensions\/[^/]+\/storage/.test(v.name)).map(v=>({start:v.startTime,ms:v.duration})));
    return{...stats,storageReads,headers:stats.resources.map(r=>frame.page().__resourceHeaders.get(r.name)).filter(Boolean)};
}

async function tool(frame,kind){
    const path=getTool(kind.split('/')[0]).firstFeature().getRouter();
    const start=performance.now();await frame.evaluate(path=>{location.hash='#'+path},path);
    const area=frame.locator('.ctool-main-tool');
    if(kind==='base64/encoder'){
        await expect(area.locator('textarea[readonly]')).toHaveCount(1);
        await area.locator('textarea:not([readonly])').first().fill('abc');await expect(area.locator('textarea[readonly]').last()).toHaveValue('YWJj');
    }else if(kind==='numberCalc'){
        await area.locator('textarea[placeholder*="100"]').fill('1,2,3');await expect(area.locator('input[readonly]').nth(1)).toHaveValue('6');
    }else if(kind==='unit'){
        await area.locator('input[type=number]').first().fill('2');await expect(area.locator('.ctool-unit-all')).toContainText('2000');
    }else if(kind==='diffs'){
        for(const [i,text] of ['before','after'].entries()){
            await area.locator('.monaco-editor textarea').nth(i).focus();
            await frame.page().keyboard.press('ControlOrMeta+A');await frame.page().keyboard.insertText(text);
        }
        await expect(area.locator('input').first()).toHaveValue('1 / 1');
    }else if(kind==='json'||kind==='code'){
        const ed=area.locator('.monaco-editor textarea').first();await ed.focus();await frame.page().keyboard.press('ControlOrMeta+A');await frame.page().keyboard.insertText(kind==='json'?'{"perf":1}':'const perf=1;');
        await area.getByRole('button',{name:'格式化',exact:true}).click();
        await expect(area.locator('.monaco-editor').first()).toContainText(kind==='json'?/"perf":\s+1/:/const\s+perf\s+=\s+1/);
    }
    return performance.now()-start;
}
try{
    if(!config.group||['all','opens'].includes(config.group)){
        for(let i=0;i<5;i++){const ctx=await context();const{page}=await open(ctx,'cold-default');await page.close();await ctx.close();console.log('cold',i+1)}
    }
    const ctx=await context();let active=await open(ctx,'warm-prime');await active.page.close();
    if(!config.group||['all','opens'].includes(config.group)){
        for(let i=0;i<10;i++){active=await open(ctx,'warm-reopen');await active.page.close();console.log('warm',i+1)}
    }
    const kinds=['base64/encoder','json','code','unit','numberCalc','diffs'].filter(kind=>!config.group||config.group==='all'||config.group===kind);
    for(const kind of kinds){
        console.log('tool',kind);
        for(let i=0;i<10;i++){
            active=await open(ctx,'heavy-prime:'+kind);
            for(const phase of ['first','repeat']){
                const ms=await tool(active.frame,kind);samples.push({scenario:'tool:'+kind+':'+phase,ms,...await resources(active.frame)});
                await active.frame.evaluate(()=>{location.hash='#/tool/hash'});await active.frame.locator('.ctool-main-tool textarea[placeholder="md5"]').waitFor();
            }
            await active.page.close();console.log(kind,i+1);
        }
    }
    active=await open(ctx,'catalogue-prime');
    const monaco=samples.flatMap(s=>s.resources||[]).find(r=>r.name.startsWith('vendor-monaco'));
    if(monaco){
        const src=await active.frame.evaluate(name=>performance.getEntriesByType('resource').find(r=>r.name.includes(name))?.name,monaco.name);
        if(src){const languages=await active.frame.evaluate(async url=>{const m=await import(url);for(const v of Object.values(m)){if(v?.languages?.getLanguages)return v.languages.getLanguages().map(({id,aliases})=>({id,...(aliases?{aliases}: {})}));}return null},src);if(languages)await writeFile(join(config.output,'languages.json'),JSON.stringify(languages,null,2)+'\n')}
    }
    await ctx.close();
    const groups={};for(const s of samples){(groups[s.scenario]??=[]).push(s.ms)}
    const summary=Object.fromEntries(Object.entries(groups).map(([k,v])=>{v.sort((a,b)=>a-b);return[k,{n:v.length,median:(v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2,min:v[0],max:v.at(-1)}]}));
    const report={archiveSha256:createHash('sha256').update(await readFile(config.archive)).digest('hex'),browser:browser.version(),profile:'Chromium CPU4x, 1074x884, real isolated host via streaming HTTP proxy, no Playwright routing; provider not invoked',summary,samples,errors};
    await writeFile(join(config.output,'performance.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(summary));if(errors.length)throw new Error('browser errors: '+errors.join('; '));
}catch(error){await writeFile(join(config.output,'partial.json'),JSON.stringify({samples,errors,failure:String(error)},null,2)+'\n');throw error;}finally{await browser.close();proxy.close();server.closeAllConnections();await new Promise(r=>server.close(r))}

}
main().catch(error=>{console.error(error);process.exitCode=1});
