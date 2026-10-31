import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createPluginServer, allTools} from '../dist/extension/service/main.mjs';
let server, base;
const token = 'test-token';
before(async () => {
    server = createPluginServer({XHUB_SERVICE_TOKEN: token, XHUB_INSTANCE_ID: 'fixture-instance', XHUB_VERSION: '0.1.0', XHUB_TOOLS_HASH: 'fixture-hash'});
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
async function invoke(tool, args, address = base, key = token) {
    const response = await fetch(address + '/xhub/agent-tool', {method: 'POST', headers: {'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json'}, body: JSON.stringify({tool, args, callId: 'contract-call'})});
    const body = await response.json();
    if (response.ok) assert.equal(body.callId, 'contract-call');
    return {status: response.status, ...body};
}
const samples = [
    ['json_format', {text:'{"n":9007199254740993}', indent:0}, r => assert.equal(r.text,'{"n":9007199254740993}')],
    ['json_validate', {text:'{bad'}, r => assert.equal(r.valid,false)],
    ['base64_encode', {text:'你好'}, r => assert.equal(r.text,'5L2g5aW9')],
    ['base64_decode', {text:'5L2g5aW9'}, r => assert.equal(r.text,'你好')],
    ['url_encode', {text:'a+b &中'}, r => assert.equal(r.text,'a%2Bb%20%26%E4%B8%AD')],
    ['url_decode', {text:'a%2Bb'}, r => assert.equal(r.text,'a+b')],
    ['hash_digest', {text:'abc', algorithm:'sha256'}, r => assert.equal(r.digest,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')],
    ['time_convert', {value:'0',from:'seconds',timezone:'Asia/Shanghai'}, r => assert.equal(r.iso,'1970-01-01T08:00:00.000+08:00')],
    ['radix_convert', {value:'9007199254740993',fromBase:10,toBase:16}, r => assert.equal(r.value,'20000000000001')],
    ['cron_parse', {expression:'0 * * * *',timezone:'UTC',currentDate:'2026-01-01T00:00:00Z',count:1}, r => assert.deepEqual(r.dates,['2026-01-01T01:00:00.000Z'])],
    ['text_process', {text:'a\nb\na',operation:'deduplicateLines'}, r => assert.equal(r.text,'a\nb')],
    ['config_convert', {text:'n: 9007199254740993',from:'yaml',to:'json'}, r => assert.match(r.text,/9007199254740993/)],
    ['url_parse', {text:'https://example.org/a?q=1&q=2#x'}, r => assert.deepEqual(r.query,[{name:'q',value:'1'},{name:'q',value:'2'}])],
    ['uuid_generate', {count:2}, r => {assert.equal(new Set(r.values).size,2);assert.match(r.values[0],/^[a-f0-9]{8}-[a-f0-9]{4}-4/)}],
];
for (const [tool,args,check] of samples) test(tool, async () => {const r = await invoke(tool,args); assert.equal(r.ok,true,JSON.stringify(r)); check(r.result)});
test('authentication and instance health', async () => {
    assert.equal((await invoke('json_validate',{text:'{}'},base,'wrong')).status,401);
    const health = await fetch(base+'/healthz',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json());
    assert.deepEqual(health,{instanceId:'fixture-instance',version:'0.1.0',toolsHash:'fixture-hash'});
    assert.equal(allTools.filter(t=>t.ai&&t.mcp).length,100);
    assert.equal(allTools.find(t=>t.name==='code_run').effect,'dangerous');
    assert.equal(allTools.find(t=>t.name==='code_run').ai,true);
});
test('every tool rejects extra and missing parameters', async () => {
    for(const t of allTools){const r=await invoke(t.name,{unexpected:true});assert.equal(r.ok,false,t.name);assert.equal(r.error.code,'invalid_arguments',t.name)}
});
test('invalid UTF-8, percent escapes, precision, limits and YAML cycles fail',async()=>{
    for(const [tool,args] of [['base64_decode',{text:'/w=='}],['base64_decode',{text:'?!'}],['url_decode',{text:'%E4'}],['radix_convert',{value:'2',fromBase:2,toBase:10}],['json_format',{text:'x'.repeat(204801)}],['config_convert',{text:'a: &x [*x]',from:'yaml',to:'json'}],['time_convert',{value:'NaN',from:'milliseconds',timezone:'UTC'}]]){
        const r=await invoke(tool,args);assert.equal(r.ok,false,tool);
    }
});
test('missing JDoodle configuration never submits code', async()=>{const r=await invoke('code_run',{language:'nodejs',versionIndex:'4',script:'x'});assert.equal(r.error.code,'configuration_required')});
test('external business failure, malformed output and unknown outcome are not success or replay',async()=>{
    for (const [kind,fetcher,expected] of [
        ['http',async()=>new Response('{}',{status:503}),'result_unknown'],
        ['business',async()=>Response.json({error:'private-upstream-detail'}),'upstream_failed'],
        ['malformed',async()=>Response.json({output:42,statusCode:200}),'result_unknown'],
        ['timeout',async()=>{throw new DOMException('fixture timeout','TimeoutError')},'result_unknown'],
        ['interrupted',async()=>new Response('{'), 'result_unknown'],
    ]) {
        let calls=0;
        const candidate=createPluginServer({XHUB_SERVICE_TOKEN:token,XHUB_SECRET_CONFIG:JSON.stringify({jdoodleClientId:'fixture-id',jdoodleClientSecret:'fixture-secret'})},async(...a)=>{calls++;return fetcher(...a)});
        await new Promise(r=>candidate.listen(0,'127.0.0.1',r));
        try {const result=await invoke('code_run',{language:'nodejs',versionIndex:'4',script:'print(1)'},`http://127.0.0.1:${candidate.address().port}`);assert.equal(result.ok,false,kind);assert.equal(result.error.code,expected);assert.equal(calls,1);assert.doesNotMatch(JSON.stringify(result),/fixture-secret|private-upstream-detail/)}
        finally{candidate.closeAllConnections();await new Promise(r=>candidate.close(r))}
    }
});
test('ARM preserves per-architecture failure and JDoodle checks business status',async()=>{
    const candidate=createPluginServer({XHUB_SERVICE_TOKEN:token},async()=>Response.json({hex:{arm64:[true,'200080D2'],thumb:[false,'invalid assembly']}}));
    await new Promise(r=>candidate.listen(0,'127.0.0.1',r));
    try{const r=await invoke('arm_convert',{asm:'mov x0, #1',offset:'0',arch:['arm64','thumb']},`http://127.0.0.1:${candidate.address().port}`);assert.equal(r.ok,true);assert.deepEqual(r.result.hex.thumb,[false,'invalid assembly'])}finally{candidate.closeAllConnections();await new Promise(r=>candidate.close(r))}
});
test('YAML negative and large integers preserve their signs and precision',async()=>{
    const r=await invoke('config_convert',{text:'small: -2\nlarge: -9007199254740993',from:'yaml',to:'json'});
    assert.equal(r.ok,true);assert.match(r.result.text,/"small": -2/);assert.match(r.result.text,/"large": -9007199254740993/);
});
test('nonexistent dates and nonfinite YAML values fail instead of changing data',async()=>{
    for(const [tool,args]of [['time_convert',{value:'2026-02-30T00:00:00Z',from:'iso',timezone:'UTC'}],['config_convert',{text:'x: .nan',from:'yaml',to:'json'}]]){
        const r=await invoke(tool,args);assert.equal(r.ok,false);
    }
});
