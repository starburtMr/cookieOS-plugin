import {Buffer} from "node:buffer";
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {WebSocketServer} from 'ws';
import {createPluginServer} from '../dist/extension/service/main.mjs';

test('server network inputs are bounded and business failures stay failures',async()=>{
    const requests=[];
    const server=createPluginServer({XHUB_SERVICE_TOKEN:'network-fixture',XHUB_SECRET_CONFIG:JSON.stringify({requestHeaders:{fixture:{Authorization:'Bearer test-key'}}})},async(url,init)=>{requests.push(String(url));if(String(url).includes('/authenticated'))assert.equal(init.headers.Authorization,'Bearer test-key');if(String(url).includes('geojs'))return Response.json({ip:'192.0.2.1',country:'Example'});return new Response('fixture',{headers:{'content-type':'text/plain'}});});
    await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
    const call=(tool,args)=>fetch(base+'/xhub/agent-tool',{method:'POST',headers:{Authorization:'Bearer network-fixture'},body:JSON.stringify({tool,args,callId:randomUUID()})}).then(r=>r.json());
    try {
        const ip=await call('ip_query',{});assert.equal(ip.ok,true);assert.equal(JSON.parse(ip.result.text).subject,'management_server_egress');
        const file=await call('input_fetch',{url:'https://example.org/input'});assert.equal(file.ok,true);const read=await call('file_read',{fileRef:file.result.file.fileRef,offset:0});assert.equal(Buffer.from(read.result.dataBase64,'base64').toString(),'fixture');
        assert.equal((await call('input_fetch',{url:'https://example.org/authenticated',secretRef:'fixture'})).ok,true);
        assert.equal((await call('input_fetch',{url:'https://example.org/authenticated',secretRef:'missing'})).error.code,'configuration_required');
        const count=requests.length;
        for(const url of ['file:///etc/passwd','https://user:password@example.org'])assert.equal((await call('input_fetch',{url})).ok,false);
        assert.equal(requests.length,count);
        assert.equal((await call('ip_query',{ip:'invalid'})).ok,false);
    } finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('WebSocket session references support text/binary echo, state and cleanup',async()=>{
    const remote=new WebSocketServer({port:0,host:'127.0.0.1'});await new Promise(r=>remote.once('listening',r));
    remote.on('connection',s=>s.on('message',(bytes,binary)=>s.send(bytes,{binary})));
    const server=createPluginServer({XHUB_SERVICE_TOKEN:'ws-fixture'});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
    const call=(tool,args)=>fetch(base+'/xhub/agent-tool',{method:'POST',headers:{Authorization:'Bearer ws-fixture'},body:JSON.stringify({tool,args,callId:randomUUID()})}).then(r=>r.json());
    try{
        const opened=await call('websocket_open',{url:`ws://127.0.0.1:${remote.address().port}`});assert.equal(opened.ok,true,JSON.stringify(opened));const socketRef=JSON.parse(opened.result.text).socketRef;
        assert.equal((await call('websocket_send',{socketRef,messageId:'text-one',text:'中文'})).ok,true);
        let messages=[];for(let i=0;i<20&&!messages.length;i++){await new Promise(r=>setTimeout(r,10));messages=JSON.parse((await call('websocket_receive',{socketRef})).result.text).messages;}
        assert.deepEqual(messages,[{sequence:1,kind:'text',data:'中文'}]);
        const data=Buffer.from([0,255,1]);const begun=await call('file_begin',{size:data.length,sha256:createHash('sha256').update(data).digest('hex')});const fileRef=begun.result.fileRef;
        await call('file_chunk',{fileRef,offset:0,dataBase64:data.toString('base64')});await call('file_commit',{fileRef});
        assert.equal((await call('websocket_send',{socketRef,messageId:'binary-one',fileRef})).ok,true);
        messages=[];for(let i=0;i<20&&!messages.length;i++){await new Promise(r=>setTimeout(r,10));messages=JSON.parse((await call('websocket_receive',{socketRef,cursor:1})).result.text).messages;}
        assert.equal(messages[0].sequence,2);assert.equal(messages[0].kind,'binary');
        const read=await call('file_read',{fileRef:messages[0].file.fileRef,offset:0});assert.equal(read.result.dataBase64,'AP8B');
        const replay=JSON.parse((await call('websocket_receive',{socketRef,cursor:1})).result.text).messages;assert.deepEqual(replay,messages);
        assert.equal((await call('websocket_send',{socketRef,messageId:'text-one',text:'changed'})).error.code,'message_conflict');
        assert.equal(JSON.parse((await call('websocket_send',{socketRef,messageId:'text-one',text:'中文'})).result.text).duplicate,true);
        assert.equal(JSON.parse((await call('websocket_status',{socketRef,messageId:'text-one'})).result.text).message.state,'sent');
        assert.equal(JSON.parse((await call('websocket_status',{socketRef})).result.text).state,'open');
        assert.equal(JSON.parse((await call('websocket_close',{socketRef})).result.text).closed,true);
        assert.equal((await call('websocket_status',{socketRef})).error.code,'resource_expired');
        assert.equal((await call('websocket_status',{socketRef:'x'.repeat(43)})).ok,false);
    }finally{server.closeAllConnections();await new Promise(r=>server.close(r));for(const s of remote.clients)s.terminate();await new Promise(r=>remote.close(r));}
});

test('WebSocket overflow closes the connection and idle references expire',async()=>{
    const remote=new WebSocketServer({port:0,host:'127.0.0.1'});await new Promise(r=>remote.once('listening',r));
    remote.on('connection',(s,req)=>{if(req.url==='/overflow')for(let i=0;i<65;i++)s.send('message '+i);});
    const server=createPluginServer({XHUB_SERVICE_TOKEN:'ws-limits'});await new Promise(r=>server.listen(0,'127.0.0.1',r));
    const call=(tool,args)=>fetch(`http://127.0.0.1:${server.address().port}/xhub/agent-tool`,{method:'POST',headers:{Authorization:'Bearer ws-limits'},body:JSON.stringify({tool,args,callId:randomUUID()})}).then(r=>r.json());
    try{
        const opened=await call('websocket_open',{url:`ws://127.0.0.1:${remote.address().port}/overflow`});assert.equal(opened.ok,true);
        const {socketRef}=JSON.parse(opened.result.text);let status;
        for(let i=0;i<30;i++){status=JSON.parse((await call('websocket_status',{socketRef})).result.text);if(status.state==='overflow')break;await new Promise(r=>setTimeout(r,10));}
        assert.equal(status.state,'overflow');assert.equal(status.queued,64);assert.equal(status.dropped,1);
        const first=JSON.parse((await call('websocket_receive',{socketRef,count:2})).result.text);assert.equal(first.nextCursor,2);
        const next=JSON.parse((await call('websocket_receive',{socketRef,cursor:2,count:2})).result.text);assert.equal(next.messages[0].sequence,3);
        const stale=JSON.parse((await call('websocket_receive',{socketRef,cursor:0})).result.text);assert.equal(stale.gap,true);
        const original=Date.now;Date.now=()=>original()+300001;
        try{assert.equal((await call('websocket_status',{socketRef})).error.code,'resource_expired');}finally{Date.now=original;}
    }finally{server.closeAllConnections();await new Promise(r=>server.close(r));for(const s of remote.clients)s.terminate();await new Promise(r=>remote.close(r));}
});
