import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {languageMetadata as languages} from '../../packages/ctool-core/src/helper/languageMetadata';
import {fixture} from './fixture';

test('hash is usable without editor, maths or formatter downloads',async({page})=>{
    await fixture(page);const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
    await page.goto('/');await page.locator('.ctool-main-tool textarea:not([readonly])').first().fill('abc');
    await expect(page.locator('textarea[placeholder="md5"]')).toHaveValue('900150983cd24fb0d6963f7d28e17f72');
    const graph=JSON.parse(readFileSync('.cache/ui-chunks.json','utf8'));
    const heavy=Object.entries(graph).filter(([,v]:any)=>v.modules.some((m:string)=>/node_modules\/(monaco-editor|mathjs|prettier|quicktype)/.test(m))).map(([k])=>k);
    expect(requests.filter(url=>heavy.some(name=>url.includes('/'+name)))).toEqual([]);
});
test('optional delayed preferences do not block hash or trigger model calls',async({page})=>{
    await fixture(page,{delays:{'ctool.pref.ai_model':5000}});
    await page.goto('/');await page.locator('.ctool-main-tool textarea:not([readonly])').first().fill('abc');
    await expect(page.locator('textarea[placeholder="md5"]')).toHaveValue('900150983cd24fb0d6963f7d28e17f72');
    expect(await page.evaluate(()=>(window as any).fixture.calls)).toEqual([]);
    expect(await page.evaluate(()=>(window as any).fixture.writes)).toEqual([]);
});
test('native UTF-8 and upstream GBK encoding remain selectable after pruning',async({page})=>{
    await fixture(page);await page.goto('/#/tool/base64/encoder');
    await page.locator('.ctool-main-tool textarea:not([readonly])').fill('中文');
    await expect(page.locator('.ctool-main-tool textarea[readonly]')).toHaveValue('5Lit5paH');
    await page.getByRole('button',{name:'utf-8',exact:true}).click();await page.getByText('gbk',{exact:true}).click();
    await expect(page.locator('.ctool-main-tool textarea[readonly]')).toHaveValue('1tDOxA==');
    await page.getByRole('button',{name:'gbk',exact:true}).click();await page.getByText('utf-8',{exact:true}).click();
    await expect(page.locator('.ctool-main-tool textarea[readonly]')).toHaveValue('5Lit5paH');
});
test('failed settings retry preserves input without persisting defaults',async({page})=>{
    await fixture(page,{failures:['ctool.pref.zoom']});await page.goto('/');
    await page.locator('.ctool-main-tool textarea:not([readonly])').first().fill('abc');
    await expect(page.getByText('部分设置未能读取')).toBeVisible();
    await page.evaluate(()=>(window as any).fixture.failures=[]);
    await page.getByRole('button',{name:'重新读取',exact:true}).click();
    await expect(page.getByText('部分设置未能读取')).toHaveCount(0);
    await expect(page.locator('textarea[placeholder="md5"]')).toHaveValue('900150983cd24fb0d6963f7d28e17f72');
    expect(await page.evaluate(()=>(window as any).fixture.writes)).toEqual([]);
});
test('editor chunk failure retries locally and retains JSON input',async({page})=>{
    await fixture(page);let blocked=true;
    await page.route('**/assets/Editor-*.js',route=>blocked?route.abort():route.continue());
    await page.goto('/#/tool/json?input='+encodeURIComponent('{"retained":1}'));
    await expect(page.getByRole('button',{name:'重试',exact:true}).first()).toBeVisible();
    blocked=false;await page.getByRole('button',{name:'重试',exact:true}).first().click();
    await expect(page.locator('.ctool-main-tool .monaco-editor').first()).toContainText('retained',{timeout:20000});
    expect(await page.evaluate(()=>(window as any).fixture.calls)).toEqual([]);
});
test('failed route retains the previous tool and retries the target',async({page})=>{
    await fixture(page);await page.goto('/');await page.locator('.ctool-main-tool textarea:not([readonly])').first().fill('abc');
    let blocked=true;await page.route('**/assets/Unit-*.js',route=>blocked?route.abort():route.continue());
    await page.evaluate(()=>{location.hash='#/tool/unit'});
    await expect(page.getByRole('button',{name:'重试',exact:true}).first()).toBeVisible();
    await expect(page.locator('textarea[placeholder="md5"]')).toHaveValue('900150983cd24fb0d6963f7d28e17f72');
    blocked=false;await page.getByRole('button',{name:'重试',exact:true}).first().click();
    await page.locator('.ctool-main-tool input[type=number]').fill('2');
    await expect(page.locator('.ctool-unit-all')).toContainText('2000');
});
test('quick navigation releases editor models and preserves full language metadata and JSON worker',async({page})=>{
    await fixture(page);await page.goto('/#/tool/json?input='+encodeURIComponent('{"x":1}'));
    await expect(page.locator('.ctool-main-tool .monaco-editor').first()).toBeVisible();
    const graph=JSON.parse(readFileSync('.cache/ui-chunks.json','utf8'));
    const chunk=Object.keys(graph).find(k=>graph[k].modules.some((v:string)=>v.endsWith('/components/editor/monaco.ts')))!;
    const inspect=async()=>page.evaluate(async path=>{
        const module=await import('/ui/'+path);const api:any=Object.values(module).find((v:any)=>v?.languages?.getLanguages);
        if(!api)throw new Error('Monaco runtime export missing');
        return{languages:api.languages.getLanguages().map(({id,aliases}:any)=>({id,...(aliases?{aliases}:{})})),models:api.editor.getModels().length};
    },chunk);
    const before=await inspect();
    expect(before.languages.sort((a,b)=>a.id.localeCompare(b.id))).toEqual([...languages].sort((a,b)=>a.id.localeCompare(b.id)));
    for(let i=0;i<10;i++){
        await page.evaluate(()=>{location.hash='#/tool/hash'});await expect(page.locator('textarea[placeholder="md5"]')).toBeVisible();
        expect((await inspect()).models).toBe(0);
        await page.evaluate(()=>{location.hash='#/tool/json?input='+encodeURIComponent('{"x":1}')});await expect(page.locator('.ctool-main-tool .monaco-editor').first()).toBeVisible();
    }
    expect((await inspect()).models).toBe(before.models);
    const diagnostics=await page.evaluate(async path=>{
        const module=await import('/ui/'+path);const api:any=Object.values(module).find((v:any)=>v?.languages?.getLanguages);
        const model=api.editor.createModel('{"broken":','json');
        try{const worker=await api.languages.json.getWorker();const client=await worker(model.uri);return(await client.doValidation(model.uri.toString())).length;}finally{model.dispose()}
    },chunk);
    expect(diagnostics).toBeGreaterThan(0);
});

test('two windows save unrelated settings and new instances restore both',async({browser})=>{
    const stored=new Map<string,unknown>([['ctool.pref.locale','zh_CN'],['ctool.pref.auto_save_copy',false]]);
    async function window(){
        const page=await browser.newPage();await fixture(page);
        await page.exposeFunction('prefBackendGet',(key:string)=>stored.get(key)??null);
        await page.exposeFunction('prefBackendSet',(key:string,value:unknown)=>{stored.set(key,value)});
        await page.goto('/');await expect(page.locator('.ctool-global')).toBeVisible();return page;
    }
    const a=await window();const b=await window();
    await a.locator('.ctool-bottom-right .ctool-icon').nth(2).click();
    await a.locator('.ctool-setting').getByRole('button',{name:'自动',exact:true}).click();
    await a.getByText('深色',{exact:true}).click();
    await expect.poll(()=>stored.get('ctool.pref.theme')).toBe('dark');
    await b.locator('.ctool-bottom-right .ctool-icon').nth(2).click();
    await b.locator('.ctool-setting').getByRole('button',{name:'100%',exact:true}).click();
    await b.getByText('125%',{exact:true}).click();
    await expect.poll(()=>stored.get('ctool.pref.zoom')).toBe(125);
    expect(stored.get('ctool.pref.theme')).toBe('dark');await a.close();await b.close();
    const reopened=await window();await expect(reopened.locator('html')).toHaveAttribute('data-theme','dark');
    await expect(reopened.locator('html')).toHaveAttribute('style',/font-size: 125%/);await reopened.close();
});
test('rapid pending navigations settle on the latest usable tool',async({page})=>{
    await fixture(page);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
    await page.evaluate(async()=>{for(let i=0;i<20;i++){location.hash=i%2?'#/tool/json':'#/tool/code/code';await new Promise(r=>setTimeout(r,20))}location.hash='#/tool/base64/encoder'});
    await expect(page.locator('.ctool-main-tool textarea[readonly]')).toHaveCount(1);
    await page.locator('.ctool-main-tool textarea:not([readonly])').fill('abc');
    await expect(page.locator('.ctool-main-tool textarea[readonly]')).toHaveValue('YWJj');
    expect(errors).toEqual([]);
});

test('a stalled initial route leaves the shell usable and completes after recovery',async({page})=>{
    await fixture(page);let release!:()=>void;const waiting=new Promise<void>(r=>{release=r});
    await page.route('**/assets/Unit-*.js',async route=>{await waiting;await route.continue()});
    try{
        await page.goto('/#/tool/unit',{waitUntil:'domcontentloaded'});
        await expect(page.locator('.ctool-global')).toBeVisible({timeout:2000});
        release();await page.locator('.ctool-main-tool input[type=number]').fill('2');
        await expect(page.locator('.ctool-unit-all')).toContainText('2000');
    }finally{release()}
});

test('a new navigation clears the obsolete failed target before its module arrives',async({page})=>{
    await fixture(page);await page.goto('/');await page.route('**/assets/Unit-*.js',route=>route.abort());
    await page.evaluate(()=>{location.hash='#/tool/unit'});await expect(page.getByRole('button',{name:'重试',exact:true})).toBeVisible();
    let release!:()=>void;const waiting=new Promise<void>(r=>{release=r});
    await page.route('**/assets/NumberCalc-*.js',async route=>{await waiting;await route.continue()});
    try{
        await page.evaluate(()=>{location.hash='#/tool/numberCalc'});
        await expect(page.getByRole('button',{name:'重试',exact:true})).toHaveCount(0,{timeout:2000});
        release();await page.locator('.ctool-main-tool textarea[placeholder*="100"]').fill('1,2,3');
        await expect(page.locator('.ctool-main-tool input[readonly]').nth(1)).toHaveValue('6');
    }finally{release()}
});
test('cancelled navigation removes the progress state and leaves the old tool usable',async({page})=>{
    await fixture(page);await page.goto('/#/tool/hash');
    await page.locator('.ctool-main-tool textarea:not([readonly])').first().fill('abc');
    await page.evaluate(()=>{location.hash='#/tool/base64/encoder?category=crypto'});
    await expect(page).toHaveURL(/#\/tool\/hash$/);
    await expect(page.locator('.ctool-route-progress')).toHaveCount(0);
    await expect(page.locator('textarea[placeholder="md5"]')).toHaveValue('900150983cd24fb0d6963f7d28e17f72');
});
test('default selected tool downloads while other necessary settings are still loading',async({page})=>{
    await fixture(page,{delays:{'ctool.pref.zoom':1500}});
    await page.exposeFunction('prefBackendGet',(key:string)=>key==='ctool.pref.common'?['base64']:key==='ctool.pref.locale'?'zh_CN':key==='ctool.pref.auto_save_copy'?false:null);
    const requested=page.waitForRequest('**/assets/Encoder-*.js');
    await page.goto('/',{waitUntil:'domcontentloaded'});await requested;
    await expect(page.locator('.ctool-global')).toHaveCount(0);
    await page.locator('.ctool-main-tool textarea:not([readonly])').fill('abc');
    await expect(page.locator('.ctool-main-tool textarea[readonly]')).toHaveValue('YWJj');
});
test('JSON code generation loads on use and retries without losing the input',async({page})=>{
    await fixture(page);const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
    let blocked=true;await page.route('**/assets/ToObject-*.js',r=>blocked?r.abort():r.continue());
    await page.goto('/#/tool/json?input='+encodeURIComponent('{"name":"sample"}'));
    await expect(page.locator('.ctool-main-tool .monaco-editor').first()).toContainText('sample');
    const graph=JSON.parse(readFileSync('.cache/ui-chunks.json','utf8'));
    const heavy=Object.keys(graph).filter(k=>graph[k].modules.some((m:string)=>m.includes('node_modules/quicktype-core/')));
    expect(heavy.length).toBeGreaterThan(0);expect(requests.filter(u=>heavy.some(k=>u.includes('/'+k)))).toEqual([]);
    await page.getByText('转实体类',{exact:true}).click();
    await expect(page.getByRole('button',{name:'重试',exact:true})).toBeVisible();
    await expect(page.locator('.ctool-main-tool .monaco-editor').first()).toContainText('sample');
    blocked=false;await page.getByRole('button',{name:'重试',exact:true}).click();
    await expect(page.locator('.ctool-main-tool .monaco-editor').last()).toContainText('Ctool');
    await expect(page.locator('.ctool-main-tool .monaco-editor').last()).toContainText('name');
    expect(await page.evaluate(()=>(window as any).fixture.calls)).toEqual([]);
});
