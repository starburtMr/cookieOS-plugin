import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {chromium,expect} from '@playwright/test';

async function main(){
    const config=JSON.parse(await readFile(process.argv[2],'utf8'));
    const browser=await chromium.launch({headless:true});
    const context=await browser.newContext({baseURL:config.origin,viewport:{width:1074,height:884},locale:'zh-CN',reducedMotion:'reduce'});
    const split=config.cookie.indexOf('=');
    await context.addCookies([{name:config.cookie.slice(0,split),value:config.cookie.slice(split+1),url:config.origin,httpOnly:true,sameSite:'Strict'}]);
    const errors=[];
    await context.route('**/*',async route=>{
        const request=route.request();const url=new URL(request.url());
        if(url.origin!==config.origin){await route.abort();return;}
        if(/^\/(api|health|agent)(?:\/|$)/.test(url.pathname)){
            await route.fulfill({response:await route.fetch({url:config.apiOrigin+url.pathname+url.search})});return;
        }
        const root=resolve(config.uiRoot);const file=resolve(root,'.'+decodeURIComponent(url.pathname));
        if(!file.startsWith(root+sep)){await route.fulfill({status:404,body:''});return;}
        try{if((await stat(file)).isFile()){await route.fulfill({path:file});return;}}catch{}
        if(request.isNavigationRequest())await route.fulfill({path:join(root,'index.html')});
        else {errors.push('missing frontend resource: '+url.pathname);await route.fulfill({status:404,body:''});}
    });
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    const selector=`iframe[src*="/${config.extensionId}/frame/"]`;
    const frame=()=>page.frameLocator(selector);
    const passed=[];
    await mkdir(config.output,{recursive:true});
    async function surface(name){
        await expect(frame().locator('.ctool-global')).toBeVisible({timeout:30000});
        const content=await (await page.locator(selector).elementHandle()).contentFrame();
        await expect.poll(()=>content.evaluate(()=>window.xhub.runtime.info()).then(v=>v.surface)).toBe(name);
        passed.push('real iframe bridge: '+name);
    }
    try{
        await page.goto('/extensions/'+config.extensionId);
        await surface('view');
        let content=await (await page.locator(selector).elementHandle()).contentFrame();
        await content.evaluate(()=>{location.hash='#/tool/json?input='+encodeURIComponent('{"a":1}');});
        await expect(frame().locator('.monaco-editor').first()).toBeVisible();
        await expect(frame().locator('.ctool-main-tool')).toContainText('a');
        await content.evaluate(()=>{location.hash='#/tool/text?input=hello';});
        const textAction=await content.evaluate(()=>window.$t('main_text_ai_process'));
        await frame().getByRole('button',{name:'✨ '+textAction,exact:true}).click();
        const modal=frame().locator('.ctool-modal:visible, .ctool-modal-mask:visible').last();
        await modal.locator('textarea').fill('改写文本');
        await modal.getByRole('button',{name:/确定|确认/}).click();
        await expect(frame().getByText('使用结果',{exact:true})).toBeVisible({timeout:20000});
        await expect(frame().locator('.ctool-ai-activity')).toContainText('fixture model result');
        await frame().locator('.ctool-global').screenshot({path:join(config.output,'view.png')});
        passed.push('real UI model action uses isolated cookieOS provider');

        await page.goto('/extensions?tab=installed');
        await page.getByRole('textbox',{name:'搜索扩展'}).fill('io.cookieos.ctool');
        const card=page.locator('.extension-card');
        await expect(card).toHaveCount(1);
        await card.getByRole('button',{name:/更多操作/}).click();
        await page.getByRole('menuitem',{name:'浮窗打开',exact:true}).click();
        const floating=page.locator('.extension-floating-window');
        await expect(floating).toBeVisible();
        await surface('window');
        await floating.getByRole('button',{name:'抽屉',exact:true}).click();
        await surface('drawer');
        await frame().locator('.ctool-global').screenshot({path:join(config.output,'drawer.png')});
        content=await (await page.locator(selector).elementHandle()).contentFrame();
        await content.locator('body').click({position:{x:10,y:10}});
        await page.keyboard.press('Escape');
        await expect(page.locator(selector)).toHaveCount(0);
        await card.getByRole('button',{name:/更多操作/}).click();
        const saved=page.waitForResponse(r=>r.url().endsWith('/extensions/preferences')&&r.request().method()==='PATCH');
        await page.getByRole('menuitem',{name:'添加组件到总览',exact:true}).click();
        expect((await saved).ok()).toBe(true);
        await page.goto('/overview');
        await surface('module');
        for(const viewport of [{width:1074,height:884},{width:390,height:844},{width:390,height:442}]){
            await page.setViewportSize(viewport);
            await expect(frame().locator('.ctool-global')).toBeVisible();
            const child=await (await page.locator(selector).elementHandle()).contentFrame();
            expect(await child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        }
        passed.push('module stays mounted without horizontal overflow at desktop, phone and short phone sizes');
        expect(errors).toEqual([]);
        await writeFile(join(config.output,'browser-results.json'),JSON.stringify({passed,pageErrors:errors,model:'local protocol fixture; no real provider inference',frontend:'existing cookieOS dist, real isolated API via Playwright route.fetch'},null,2)+'\n');
        console.log(JSON.stringify({passed,pageErrors:errors}));
    }finally{await context.close();await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
