import {fixture} from './fixture';
import {Buffer} from "node:buffer";
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,privateDecrypt,publicEncrypt,constants} from 'node:crypto';
import {getTool} from 'ctool-config';
const generated=readFileSync('packages/ctool-core/src/buildDataTemp.ts','utf8');
const routes=[...generated.matchAll(/tool: "([^"]+)",\s*feature: "([^"]+)"/g)].map(([,tool,feature])=>({tool,feature,path:getTool(tool as any).getFeature(feature as any).getRouter()}));
test('all 88 registered routes mount without runtime or resource errors',async({page})=>{
    await fixture(page);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const missing:string[]=[];page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:4173')&&r.status()>=400)missing.push(r.url())});
    await page.goto('/');await expect(page.locator('.ctool-global')).toBeVisible();
    expect(routes.length).toBe(88);
    for(const {path}of routes){
        await page.evaluate(path=>{location.hash=`#${path}`},path);
        await expect.poll(() => page.locator('.ctool-main-tool > *').count()).toBeGreaterThan(0);
        await page.waitForTimeout(220);
        await expect(page.locator('[data-tool-loading]')).toHaveCount(0);
        await expect.poll(() => page.locator('.ctool-main-tool > *').count()).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);expect(missing).toEqual([]);
    expect(await page.evaluate(()=>[...Object.keys(localStorage)])).toEqual([]);
    const writes=await page.evaluate(()=>(window as any).fixture.writes);expect(writes.every(([k])=>k.startsWith('ctool.pref.'))).toBe(true);
});
test('JSON expression uses packaged WASM, lodash and bounded cancellation',async({page})=>{
    await fixture(page);await page.goto('/#/tool/json?input='+encodeURIComponent('{"a":1,"b":2}'));
    await expect(page.locator('.monaco-editor').first()).toBeVisible();
    await page.getByText('转换', {exact:true}).click();
    const input=page.locator('.ctool-json-transform-header input');await input.fill('_.map(Object.values(data), n => n * 2)');
    await expect(page.locator('.ctool-main-tool')).toContainText('4');
    await input.fill('(()=>{while(true){} })()');
    await expect(page.locator('.ctool-main-tool')).toContainText(/超过资源上限|处理超时/,{timeout:10000});
    await input.fill('[typeof window, typeof process, typeof fetch, typeof xhub]');
    await expect(page.locator('.ctool-main-tool')).toContainText('undefined');
});
test('AI result requires acceptance and stale input never gets overwritten',async({page})=>{
    await fixture(page);await page.goto('/#/tool/json?input='+encodeURIComponent('log: {"a":1}'));
    await expect(page.locator('.monaco-editor').first()).toBeVisible();
    await page.getByText(/AI.*JSON/).first().click();
    await expect(page.getByText('使用结果',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>(window as any).fixture.calls.length)).toBe(1);
    await page.getByText('使用结果',{exact:true}).click();
    await expect(page.locator('.ctool-main-tool')).toContainText('hello');
});

test('editing or leaving a page cancels a late AI result',async({page})=>{
    await fixture(page);await page.goto('/#/tool/json?input='+encodeURIComponent('log: {"a":1}'));
    await expect(page.locator('.monaco-editor').first()).toBeVisible();
    await page.evaluate(()=>(window as any).fixture.mode='slow');
    await page.getByText(/AI.*JSON/).first().click();
    await expect(page.getByText('停止生成',{exact:true})).toBeVisible();
    await page.locator('.monaco-editor textarea').first().focus();
    await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText('new draft');
    await expect(page.locator('.ctool-ai-activity')).toContainText('已停止',{timeout:5000});
    await expect(page.getByText('使用结果',{exact:true})).toHaveCount(0);
    await expect(page.locator('.ctool-main-tool')).toContainText('new draft');
    await page.locator('.ctool-ai-activity').getByText('关闭', {exact:true}).click();
    await page.getByText(/AI.*JSON/).first().click();
    await page.evaluate(()=>{location.hash='#/tool/base64/encoder'});
    await expect(page.locator('.ctool-ai-activity')).toContainText('已停止',{timeout:5000});
    expect(await page.evaluate(()=>(window as any).fixture.calls.length)).toBe(2);
});
test('unknown model result retains partial text, queries original call and never replays',async({page})=>{
    await fixture(page);await page.goto('/#/tool/json?input='+encodeURIComponent('log: {"a":1}'));
    await expect(page.locator('.monaco-editor').first()).toBeVisible();
    await page.evaluate(()=>(window as any).fixture.mode='unknown');
    await page.getByText(/AI.*JSON/).first().click();
    await expect(page.locator('.ctool-ai-activity')).toContainText('结果待确认');
    await expect(page.locator('.ctool-ai-activity')).toContainText('partial');
    await page.getByText('查询状态',{exact:true}).click();
    await expect(page.locator('.ctool-ai-activity')).toContainText('已确认完成');
    expect(await page.evaluate(()=>(window as any).fixture.calls.length)).toBe(1);
    await expect(page.getByText('使用结果',{exact:true})).toHaveCount(0);
});
test('HTML table conversion never inserts untrusted nodes in the live document',async({page})=>{
    await fixture(page);await page.goto('/');
    await expect(page.locator('.ctool-global')).toBeVisible();
    // Select HTML input so this exercises the actual parser, not a JSON syntax failure.
    await page.evaluate(()=>{location.hash='#/tool/configConvert'});
    await expect.poll(() => page.locator('.ctool-main-tool > *').count()).toBeGreaterThan(0);
    await page.locator('.ctool-page-option .ctool-select').first().locator('summary').click();
    await page.locator('.ctool-page-option .ctool-select').first().getByText('HTML Table',{exact:true}).click();
    const requests:string[]=[];page.on('request',r=>{if(r.url().includes('attacker.invalid'))requests.push(r.url())});
    await page.locator('.ctool-main-tool .monaco-editor textarea').first().focus();
    await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText('<table><tr><th>x</th></tr><tr><td><img src="https://attacker.invalid/x" onerror="window.__xss=1">safe</td></tr></table>');
    await page.waitForTimeout(400);
    expect(requests).toEqual([]);expect(await page.evaluate(()=>(window as any).__xss)).toBeUndefined();
    await expect(page.locator('.ctool-main-tool')).toContainText('safe');
});

test('packaged worker rejects huge allocation, validates schema and bounds decompression',async({page})=>{
    const {readdirSync}=await import('node:fs');
    const workerFile=readdirSync('dist/extension/ui/assets').find(n=>n.startsWith('task.worker-'))!;
    await fixture(page);await page.goto('/');await expect(page.locator('.ctool-global')).toBeVisible();
    const results=await page.evaluate(async workerUrl=>{
        const task=(kind:string,args:any)=>new Promise<any>((resolve,reject)=>{
            const w=new Worker(workerUrl,{type:'module'});
            const timer=setTimeout(()=>{w.terminate();reject(new Error('worker failed to return'))},8000);
            w.onmessage=e=>{clearTimeout(timer);w.terminate();resolve(e.data)};
            w.onerror=e=>{clearTimeout(timer);w.terminate();reject(new Error(e.message))};w.postMessage({kind,args});
        });
        const schema=await task('schema',{schema:JSON.stringify({type:'object',required:['name']}),value:{}});
        const huge=await task('transform',{data:{},expression:'new Array(100000000).fill(1)'});
        const zip=new Blob(['hello'],{type:'text/plain'}).stream().pipeThrough(new CompressionStream('gzip'));
        const compressed=new Uint8Array(await new Response(zip).arrayBuffer());
        const inflated=await task('inflate',{base64:btoa(String.fromCharCode(...compressed))});
        const bombStream=new Blob(['a'.repeat(9*1024*1024)]).stream().pipeThrough(new CompressionStream('gzip'));
        const bomb=new Uint8Array(await new Response(bombStream).arrayBuffer());
        const rejected=await task('inflate',{base64:btoa(String.fromCharCode(...bomb))});
        return {schema,huge,inflated:{...inflated,value:Array.from(inflated.value??[])},rejected};
    },'/ui/assets/'+workerFile);
    expect(results.schema.ok).toBe(true);expect(results.schema.value).toContain('name');
    expect(results.huge.ok).toBe(false);expect(results.huge.error).toContain('资源上限');
    expect(results.inflated.ok).toBe(true);expect(results.inflated.value).toEqual([104,101,108,108,111]);
    expect(results.rejected.ok).toBe(false);expect(results.rejected.error).toContain('8 MiB');
});

const aiCases=[
    {tool:'regex',input:'[a-z]+',reply:'字母匹配说明',button:/AI.*解释/},
    {tool:'crontab',input:'0 * * * *',reply:'0 8 * * *',prompt:'每天早上八点'},
    {tool:'sqlFillParameter',input:'select 1',reply:'查询常量'},
    {tool:'stacktrace',input:'Error: sample\n at main (app.js:1:2)',reply:'错误原因说明'},
    {tool:'configConvert',input:'{"a":1}',reply:'json'},
    {tool:'httpSnippet',input:'curl https://example.org',reply:'HTTP 请求说明'},
    {tool:'code',input:'console.log(1)',reply:'打印常量说明'},
    {tool:'text',input:'hello world',reply:'updated text',prompt:'改写这段文本'},
    {tool:'diffs',input:'',reply:'新增字段说明',diff:true},
    {tool:'urlParse',input:'https://example.org/a?q=1',reply:'URL 结构说明'},
    {tool:'userAgent',input:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',reply:'浏览器说明'},
];
for(const item of aiCases)test(`original AI entry ${item.tool} uses the host model`,async({page})=>{
    test.setTimeout(20000);
    await fixture(page);
    const tool=getTool(item.tool as any);
    await page.goto('/#'+tool.firstFeature().getRouter()+'?input='+encodeURIComponent(item.input));
    await expect.poll(() => page.locator('.ctool-main-tool > *').count()).toBeGreaterThan(0);
    await page.evaluate(reply=>{(window as any).fixture.reply=reply},item.reply);
    if(item.diff){
        for(const [index,value]of ['{"a":1}','{"a":1,"b":2}'].entries()){
            await page.locator('.ctool-main-tool .monaco-editor textarea').nth(index).focus();
            await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText(value);
        }
    }
    const button=page.getByRole('button',{name:item.button??/✨.*AI/}).first();
    await button.click();
    if(item.prompt){
        const dialog=page.locator('.ctool-modal:visible, .ctool-modal-mask:visible').last();
        await dialog.locator('textarea').fill(item.prompt);
        await dialog.getByRole('button',{name:/确定|确认/}).click();
    }
    await expect(page.getByText('使用结果',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>(window as any).fixture.calls.length)).toBe(1);
    await page.getByText('使用结果',{exact:true}).click();
    await expect(page.locator('.ctool-ai-activity')).toContainText('已使用');
});

test('QR generated by the original UI can be decoded by the packaged worker',async({page})=>{
    const {readdirSync}=await import('node:fs');
    const workerFile=readdirSync('dist/extension/ui/assets').find(n=>n.startsWith('task.worker-'))!;
    await fixture(page);await page.goto('/#'+getTool('qrCode').firstFeature().getRouter()+'?input=ctool-qr-test');
    const image=page.locator('.ctool-main-tool img').filter({visible:true}).first();
    await expect(image).toHaveAttribute('src',/^data:/);
    const src=await image.getAttribute('src');
    const result=await page.evaluate(async({workerUrl,base64})=>new Promise<any>((resolve,reject)=>{
        const worker=new Worker(workerUrl,{type:'module'});
        const timer=setTimeout(()=>{worker.terminate();reject(new Error('QR deadline'))},6000);
        worker.onmessage=e=>{clearTimeout(timer);worker.terminate();resolve(e.data)};
        worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(new Error(e.message))};worker.postMessage({kind:'qr',args:{base64}});
    }),{workerUrl:'/ui/assets/'+workerFile,base64:src!.split(',')[1]});
    expect(result).toEqual({ok:true,value:'ctool-qr-test'});
});

test('WebSocket sends from the browser and disconnects when leaving the tool',async({page})=>{
    const {createRequire}=await import('node:module');
    const require=createRequire(new URL('../../packages/ctool-core/package.json',import.meta.url));
    const {WebSocketServer}=require('ws');
    const server=new WebSocketServer({port:0,host:'127.0.0.1'});
    await new Promise<void>(resolve=>server.once('listening',resolve));
    const received:string[]=[];
    server.on('connection',client=>client.on('message',data=>{received.push(data.toString());client.send('echo:'+data.toString())}));
    try{
        await fixture(page);await page.goto('/#'+getTool('websocket').firstFeature().getRouter());
        await page.locator('.ctool-page-option input').first().fill(`ws://127.0.0.1:${server.address().port}`);
        await page.getByRole('button',{name:'连接',exact:true}).click();
        await expect(page.locator('.ctool-websocket-logs')).toContainText('连接成功');
        await page.locator('.ctool-main-tool textarea').first().fill('ctool-ws-fixture');
        await page.getByText('发送',{exact:true}).click();
        await expect(page.locator('.ctool-websocket-logs')).toContainText('echo:ctool-ws-fixture');
        expect(received).toEqual(['ctool-ws-fixture']);
        await page.evaluate(()=>{location.hash='#/tool/json'});
        await expect.poll(()=>server.clients.size).toBe(0);
    }finally{for(const client of server.clients)client.terminate();await new Promise<void>(resolve=>server.close(resolve))}
});

test('browser SM2 uses Web Crypto and round trips after removing Node crypto polyfills',async({page})=>{
    test.setTimeout(15000);
    await fixture(page);await page.goto('/#/tool/encrypt/sm2/encrypt?input=ctool-sm2-fixture');
    await page.getByRole('button',{name:/生成.*(?:密钥|公钥)/}).click();
    const publicInput=page.locator('.ctool-page-option input').nth(0);
    const privateInput=page.locator('.ctool-page-option input').nth(1);
    await expect(publicInput).toHaveValue(/^04[a-f0-9]{128}$/i);
    const key=await privateInput.inputValue();expect(key).toMatch(/^[a-f0-9]{64}$/i);
    const output=page.locator('.ctool-main-tool textarea').last();
    await expect(output).toHaveValue(/^[a-f0-9]{100,}$/i);
    const cipher=await output.inputValue();
    await page.evaluate(path=>{location.hash=path},'#/tool/encrypt/sm2/decrypt?input='+cipher);
    await page.locator('.ctool-page-option input').first().fill(key);
    await expect(page.locator('.ctool-main-tool textarea').last()).toHaveValue('ctool-sm2-fixture');
    expect(await page.evaluate(()=>(window as any).fixture.writes.some(([name])=>!name.startsWith('ctool.pref.')))).toBe(false);
});

test('RSA original PKCS1 and OAEP pages interoperate with Node crypto without uploading keys',async({page})=>{
    await fixture(page);const keys=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
    const text='Ctool RSA 中文';
    for(const [mode,padding] of [['pkcs1',constants.RSA_PKCS1_PADDING],['oaep',constants.RSA_PKCS1_OAEP_PADDING]] as const){
        await page.goto('/#'+getTool('rsa').getFeature('encrypt').getRouter()+'?input='+encodeURIComponent(text));
        if(mode==='oaep'){await page.getByRole('button',{name:'PKCS1',exact:true}).click();await page.getByText('PKCS1_OAEP',{exact:true}).click({timeout:5000});}
        await page.getByPlaceholder('公钥(PEM格式)',{exact:true}).fill(keys.publicKey);
        const output=page.locator('.ctool-main-tool textarea').last();await expect(output).toHaveValue(/^[a-z0-9+/]+=*$/i);
        const cipher=Buffer.from(await output.inputValue(),'base64');assertPlain(privateDecrypt({key:keys.privateKey,padding},cipher).toString());
        const encrypted=publicEncrypt({key:keys.publicKey,padding},Buffer.from(text)).toString('base64');
        await page.goto('/#'+getTool('rsa').getFeature('decrypt').getRouter()+'?input='+encodeURIComponent(encrypted));
        if(mode==='oaep'){await page.getByRole('button',{name:'PKCS1',exact:true}).click();await page.getByText('PKCS1_OAEP',{exact:true}).click({timeout:5000});}
        await page.getByPlaceholder('私钥(PEM格式)',{exact:true}).fill(keys.privateKey);
        await expect(page.locator('.ctool-main-tool textarea').last()).toHaveValue(text);
    }
    function assertPlain(value:string){expect(value).toBe(text);}
    expect(await page.evaluate(()=>(window as any).fixture.writes.some(([,value])=>typeof value==='string'&&value.includes('PRIVATE KEY')))).toBe(false);
});

test('Bcrypt hashes and checks without logging the password',async({page})=>{
    await fixture(page);const logs:string[]=[];page.on('console',message=>logs.push(message.text()));
    await page.goto('/#'+getTool('bcrypt').firstFeature().getRouter()+'?input=bcrypt-test-input');
    await page.getByRole('button',{name:/生成/}).click();
    await expect(page.locator('.ctool-main-tool textarea').nth(1)).toHaveValue(/^\$2a\$10\$.{53}$/,{timeout:10000});
    await page.getByRole('button',{name:/校验|验证/}).click();
    await expect(page.getByRole('button',{name:/校验|验证/})).toContainText(/成功|匹配|正确/);
    expect(logs.some(text=>text.includes('bcrypt-test-input'))).toBe(false);
});

for (const viewport of [{width:1074,height:700},{width:390,height:700},{width:390,height:442}]) {
    test(`settings controls remain usable at ${viewport.width}x${viewport.height}`, async ({page}, testInfo) => {
        test.setTimeout(20000);
        await page.setViewportSize(viewport);
        await fixture(page);
        await page.goto('/#/tool/json?input='+encodeURIComponent('log: {"a":1}'));
        await page.getByText(/AI.*JSON/).first().click();
        await expect(page.getByText('使用结果',{exact:true})).toBeVisible();
        await page.locator('.ctool-bottom-right .ctool-icon').nth(2).click();
        const drawer = page.locator('.ctool-drawer').filter({has:page.locator('.ctool-setting')});
        const select = drawer.getByRole('button',{name:'跟随 cookieOS 默认模型'});
        await select.scrollIntoViewIfNeeded();
        await expect(select).toBeVisible();
        expect((await select.boundingBox())!.width).toBeGreaterThan(180);
        const refresh = drawer.getByRole('button',{name:'刷新模型',exact:true});
        await refresh.click();
        await select.click();
        await drawer.getByText('Fixture / Fixture Model',{exact:true}).click();
        await expect(drawer.getByRole('button',{name:'Fixture / Fixture Model',exact:true})).toBeVisible();
        await expect.poll(()=>page.evaluate(()=>(window as any).fixture.writes.some(([k,v])=>k==='ctool.pref.ai_model' && v==='fixture-model'))).toBe(true);
        const history = drawer.getByLabel('本次会话保留普通工具历史');
        await history.check();
        await expect(history).toBeChecked();
        expect(await drawer.locator('.ctool-card-body').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
        const covered = await refresh.evaluate(el=>{
            const r=el.getBoundingClientRect();
            return !el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
        });
        expect(covered).toBe(false);
        await page.screenshot({path:testInfo.outputPath('settings.png')});
        await page.keyboard.press('Escape');
        await expect(drawer).toHaveCount(0);
        await expect(page.locator('.ctool-ai-activity')).toBeVisible();
    });
}
