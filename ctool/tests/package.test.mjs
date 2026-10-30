import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import Ajv2020 from 'ajv/dist/2020.js';
import Ajv from 'ajv';
const root=resolve('dist/extension');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
test('runtime identity has one source and all existing tool/data contracts remain compatible',async()=>{
    const source=JSON.parse(await readFile('manifest.json','utf8'));
    const previous=JSON.parse(await readFile('contracts/runtime-v0.1.0.json','utf8'));
    assert.deepEqual(manifest,{...source,tools:manifest.tools});
    for(const key of ['id','hostApi','requires','permissions','ui','service'])assert.deepEqual(manifest[key],previous[key],key);
    const tools=structuredClone(manifest.tools);
    delete tools.find(t=>t.name==='arm_convert').outputSchema.$schema;
    assert.deepEqual(tools,previous.tools,'only the explicit ARM output dialect annotation may change');
    for(const key of ['name','description','author','category'])assert.ok(manifest[key].trim(),key);
    assert.equal(manifest.version,'0.2.0');assert.equal(manifest.category,'开发工具');
});
test('every tool schema compiles with its declared dialect and ARM tuple behavior stays unchanged',async()=>{
    for(const tool of manifest.tools)for(const key of ['inputSchema','outputSchema']){
        const schema=tool[key];
        (schema.$schema?.includes('draft-07')?new Ajv({strict:false}):new Ajv2020({strict:false})).compile(schema);
    }
    const schema=manifest.tools.find(t=>t.name==='arm_convert').outputSchema;
    const previous=JSON.parse(await readFile('contracts/runtime-v0.1.0.json','utf8')).tools.find(t=>t.name==='arm_convert').outputSchema;
    assert.throws(()=>new Ajv2020({strict:false}).compile(previous));
    const currentValidator=new Ajv({strict:false}).compile(schema);
    const oldValidator=new Ajv({strict:false}).compile(previous);
    for(const value of [{asm:{arm64:[true,'mov x0, x1']}},{hex:{arm:[false,'error']}},{asm:{arm64:['true','text']}},{asm:{arm64:[true,'text','extra']}},{}])assert.equal(currentValidator(value),oldValidator(value));
});
test('presentation uses the SDK schema and references bounded real package files',async()=>{
    const raw=await readFile(join(root,'metadata.json'));assert.ok(raw.length<=65536);
    const metadata=JSON.parse(raw);
    const validate=new Ajv2020({strict:false,validateFormats:false}).compile(JSON.parse(await readFile('contracts/metadata.schema.json','utf8')));
    assert.equal(validate(metadata),true,JSON.stringify(validate.errors));
    assert.equal(validate({...metadata,name:manifest.name}),false,'metadata must not duplicate identity');
    assert.ok(metadata.screenshots.length>=2&&metadata.screenshots.length<=4);
    const readme=await readFile(join(root,metadata.readme));assert.ok(readme.length<=16384);new TextDecoder('utf-8',{fatal:true}).decode(readme);
    for(const [name,limit] of [[metadata.icon,512*1024],...metadata.screenshots.map(s=>[s.path,2*1024*1024])])assert.ok((await readFile(join(root,name))).length<=limit);
});
test('package manifest, stable entrypoints, WASM and safe file set',async()=>{
    assert.equal(manifest.id,'io.cookieos.ctool');assert.equal(manifest.tools.length,17);
    for(const file of [manifest.ui.entry,...manifest.ui.styles,manifest.service.entry])assert.ok((await readFile(join(root,file))).length,file);
    const files=[];
    async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){assert.equal(item.isSymbolicLink(),false);const f=join(dir,item.name);if(item.isDirectory())await walk(f);else files.push(f)}}await walk(root);
    assert.ok(files.some(f=>f.endsWith('.wasm')));
    assert.ok(files.some(f=>f.includes('editor.worker')));
    for(const f of files)assert.doesNotMatch(f.slice(root.length),/(^|\/)(\.env|\.agents|\.codex|AGENTS\.md|privatekey|node_modules|Product-Spec\.md|DEV-PLAN\.md)/);
});
test('SDK manifest schema validates the installation manifest',async()=>{
    const schema=JSON.parse(await readFile('contracts/manifest.schema.json','utf8'));
    const validate=new Ajv2020({strict:false,validateFormats:false}).compile(schema);
    assert.equal(validate(manifest),true,JSON.stringify(validate.errors));
});
test('fixed tool schemas compile and UI/AI/MCP definitions are generated once',async()=>{
    const {allTools}=await import('../dist/extension/service/main.mjs');assert.deepEqual(manifest.tools,allTools);
    assert.equal(manifest.tools.filter(t=>t.ai).length,14);
});
test('bundled Node service starts from clean directory without node_modules',async()=>{
    const folder=await mkdtemp(join(tmpdir(),'ctool-package-'));
    let child;
    try{
        await cp(root,folder,{recursive:true});
        child=spawn(process.execPath,[join(folder,manifest.service.entry)],{cwd:folder,env:{PATH:process.env.PATH,PORT:'0',XHUB_SERVICE_TOKEN:'package-fixture',XHUB_INSTANCE_ID:'isolated-fixture',XHUB_VERSION:manifest.version,XHUB_TOOLS_HASH:'fixture'}});
        let output=''; let errors='';child.stderr.on('data',d=>errors+=d);
        const ready=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('service readiness timeout: '+errors)),10000);child.once('exit',code=>{clearTimeout(timer);reject(new Error('service exit '+code+': '+errors))});child.stdout.on('data',d=>{output+=d;const m=output.match(/COOKIEOS_READY (\{[^\n]+\})/);if(m){clearTimeout(timer);resolve(JSON.parse(m[1]))}})});
        assert.equal(ready.instanceId,'isolated-fixture');assert.ok(ready.port>0);
        const response=await fetch(`http://127.0.0.1:${ready.port}/healthz`,{headers:{Authorization:'Bearer package-fixture'}});assert.equal(response.status,200);assert.equal((await response.json()).version,manifest.version);
        assert.equal(errors,'');
    }finally{if(child?.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}await rm(folder,{recursive:true,force:true})}
});
