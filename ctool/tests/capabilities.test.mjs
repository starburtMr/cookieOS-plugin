import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createPluginServer,allTools} from '../dist/extension/service/main.mjs';
const fixture=JSON.parse(await readFile(new URL('./fixtures/capability-cases.json',import.meta.url)));
let server,base;
before(async()=>{server=createPluginServer({XHUB_SERVICE_TOKEN:'capability-fixture'});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
for(const c of fixture.cases)test(c.caseId,async()=>{
    const id=randomUUID();
    const response=await fetch(base+'/xhub/agent-tool',{method:'POST',headers:{Authorization:'Bearer capability-fixture'},body:JSON.stringify({tool:c.tool,args:c.args,callId:id})});
    assert.equal(response.status,200);
    const r=await response.json();assert.equal(r.callId,id);
    if(c.expectedError){assert.equal(r.ok,false);assert.equal(r.error.code,c.expectedError);return;}
    assert.equal(r.ok,true,JSON.stringify(r));assert.ok(Object.keys(r.result).length);
    if(c.expectedText!==undefined)assert.equal(r.result.text,c.expectedText);
    if(c.contains!==undefined)assert.ok(r.result.text.includes(c.contains));
});

test('every registered category maps to real tool names, case IDs and retained legacy contracts',async()=>{
    assert.equal(fixture.coverage.length,60);
    assert.equal(fixture.coverage.flatMap(row=>row.entrypoints).length,88);
    const names=new Set(allTools.map(t=>t.name));
    for(const row of fixture.coverage)for(const tool of row.tools)assert.ok(names.has(tool),row.category+': '+tool);
    const old=JSON.parse(await readFile(new URL('./fixtures/legacy-tools.json',import.meta.url)));
    const extras=['file_begin','file_chunk','file_commit','file_read','file_status','file_delete','input_fetch','ai_assist','ai_call_status','ai_call_cancel'];
    const covered=new Set([...fixture.coverage.flatMap(row=>row.tools),...old.tools.map(t=>t.name),...extras]);
    assert.deepEqual([...names].sort(),[...covered].sort());
    for(const [file] of Object.entries(fixture.integrationSuites))assert.ok((await readFile(new URL('./'+file,import.meta.url))).length);
});
