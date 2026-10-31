import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {createPluginServer} from '../dist/extension/service/main.mjs';

test('all 13 model operations reuse SDK transport, expose status, and never replay a lost run response',async()=>{
    const calls=new Map();let runs=0;
    const model={ref:'fixture/model',modelName:'fixture',capabilities:{text:'supported'}};
    const host=createServer(async(req,res)=>{
        assert.equal(req.headers.authorization,'Bearer model-fixture');assert.equal(req.headers['x-xhub-instance-id'],'fixture-instance');
        const parts=req.url.split('/');const id=parts[2];let data;
        if(req.method==='POST'){let text='';for await(const p of req)text+=p;data=JSON.parse(text);}
        const json=value=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({data:value}));};
        if(req.url==='/calls'){await new Promise(r=>setTimeout(r,10));const id=randomUUID();const value={callId:id,status:'prepared',execution:'not_sent',text:'',model:null,usage:null,finishReason:null,truncated:false,error:null};calls.set(id,value);return json(value);}
        const value=calls.get(id);if(!value){res.writeHead(404);res.end();return;}
        if(parts[3]==='run'){runs++;assert.equal(data.messages[0].role,'system');assert.ok(data.messages[0].content.length>10);assert.equal(data.model.mode,'default');if(data.messages[1].content==='hold'){value.status='running';return json(value);}
        Object.assign(value,{status:'completed',execution:'completed',text:'fixture output',model});if(runs===1){req.socket.destroy();return;}return json(value);}
        if(parts[3]==='events'){res.writeHead(200,{'content-type':'text/event-stream'});res.end('data: '+JSON.stringify({type:value.status,callId:id,result:value})+'\n\n');return;}
        if(parts[3]==='cancel'){value.status='cancelled';return json(value);}
        json(value);
    });
    await new Promise(r=>host.listen(0,'127.0.0.1',r));
    const server=createPluginServer({XHUB_SERVICE_TOKEN:'model-fixture',XHUB_INSTANCE_ID:'fixture-instance',XHUB_HOST_API_URL:`http://127.0.0.1:${host.address().port}`});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
    const call=(tool,args)=>fetch(base+'/xhub/agent-tool',{method:'POST',headers:{Authorization:'Bearer model-fixture'},body:JSON.stringify({tool,args,callId:randomUUID()})}).then(r=>r.json());
    try{
        for(const feature of ['json_extract','regex_generate','regex_explain','cron_generate','sql_explain','stacktrace_analyze','config_detect','http_explain','code_explain','text_process','diff_summarize','url_explain','ua_explain']){
            const start=await call('ai_assist',{feature,text:'fixture input',...(feature==='diff_summarize'?{modified:'new text'}:{})});assert.equal(start.ok,true,JSON.stringify(start));const {callId}=JSON.parse(start.result.text);
            let status;for(let i=0;i<40;i++){status=await call('ai_call_status',{callId});assert.equal(status.ok,true);if(JSON.parse(status.result.text).status==='completed')break;await new Promise(r=>setTimeout(r,10));}
            assert.equal(JSON.parse(status.result.text).text,'fixture output');assert.equal(JSON.parse(status.result.text).execution,'completed');
        }
        assert.equal(runs,13);
        assert.equal((await call('ai_assist',{feature:'text_process',text:'x',modified:'unused'})).ok,false);
        assert.equal((await call('ai_assist',{feature:'diff_summarize',text:'x'})).ok,false);
        const pending=await call('ai_assist',{feature:'text_process',text:'hold'});assert.equal(pending.ok,true);
        const {callId}=JSON.parse(pending.result.text);
        const cancelled=await call('ai_call_cancel',{callId});assert.equal(cancelled.ok,true);assert.equal(JSON.parse(cancelled.result.text).status,'cancelled');

        const starts=await Promise.all(Array.from({length:3},()=>call('ai_assist',{feature:'text_process',text:'hold'})));
        assert.equal(starts.filter(r=>r.ok).length,2);assert.equal(starts.find(r=>!r.ok).error.code,'busy');
        for(const r of starts.filter(r=>r.ok))await call('ai_call_cancel',{callId:JSON.parse(r.result.text).callId});
        assert.equal((await call('ai_call_status',{callId:randomUUID()})).error.code,'resource_expired');
    }finally{server.closeAllConnections();await new Promise(r=>server.close(r));host.closeAllConnections();await new Promise(r=>host.close(r));}
});
