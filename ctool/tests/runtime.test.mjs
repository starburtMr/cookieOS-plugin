import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPluginServer} from '../dist/extension/service/main.mjs';

test('CPU-bound regex does not block health, can be cancelled and worker capacity recovers',async()=>{
    const server=createPluginServer({XHUB_SERVICE_TOKEN:'runtime-fixture'});
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    const base=`http://127.0.0.1:${server.address().port}`;
    const headers={Authorization:'Bearer runtime-fixture'};
    const call=(callId,args)=>fetch(base+'/xhub/agent-tool',{method:'POST',headers,body:JSON.stringify({callId,tool:'regex_execute',args})}).then(r=>r.json());
    try{
        const pending=call('blocked-regex',{text:'a'.repeat(10000)+'!',pattern:'^(a+)+$',operation:'match'});
        await new Promise(r=>setTimeout(r,150));
        const health=await fetch(base+'/healthz',{headers,signal:AbortSignal.timeout(1000)});assert.equal(health.status,200);
        assert.equal((await call('blocked-regex',{text:'x',pattern:'x',operation:'match'})).error.code,'call_conflict');
        const cancelled=await fetch(base+'/xhub/calls/blocked-regex/cancel',{method:'POST',headers}).then(r=>r.json());assert.equal(cancelled.accepted,true);
        assert.equal((await pending).error.code,'cancelled');
        assert.equal((await call('after-cancel',{text:'hello',pattern:'hello',operation:'match'})).ok,true);
        assert.equal((await fetch(base+'/xhub/calls/blocked-regex/cancel',{method:'POST',headers}).then(r=>r.json())).accepted,false);
    }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

test('worker queue rejects overload and real timeout terminates synchronous code',async()=>{
    const server=createPluginServer({XHUB_SERVICE_TOKEN:'queue-fixture'});await new Promise(r=>server.listen(0,'127.0.0.1',r));
    const base=`http://127.0.0.1:${server.address().port}`; const headers={Authorization:'Bearer queue-fixture'};
    const args={text:'a'.repeat(10000)+'!',pattern:'^(a+)+$',operation:'match'};
    const call=id=>fetch(base+'/xhub/agent-tool',{method:'POST',headers,body:JSON.stringify({callId:id,tool:'regex_execute',args})}).then(r=>r.json());
    const stop=id=>fetch(base+'/xhub/calls/'+id+'/cancel',{method:'POST',headers});
    try{
        const ids=Array.from({length:18},(_,i)=>'queue-'+i);const pending=ids.map(call);
        await new Promise(r=>setTimeout(r,200));assert.equal((await call('overflow')).error.code,'busy');
        await Promise.all(ids.map(stop));for(const r of await Promise.all(pending))assert.equal(r.error.code,'cancelled');
        assert.equal((await call('bounded-deadline')).error.code,'timeout');
        assert.equal((await fetch(base+'/healthz',{headers,signal:AbortSignal.timeout(1000)})).status,200);
    }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
