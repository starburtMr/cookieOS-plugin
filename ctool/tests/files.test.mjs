import {Buffer} from "node:buffer";
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createHmac, randomBytes, randomUUID} from 'node:crypto';
import {createPluginServer,FileStore} from '../dist/extension/service/main.mjs';
import {mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('8 MiB bytes upload, retry, hash, process and download through authenticated protocol', async () => {
    const server = createPluginServer({XHUB_SERVICE_TOKEN:'files-fixture',XHUB_SECRET_CONFIG:JSON.stringify({keys:{fixture:'fixture-key'}})});
    await new Promise(r => server.listen(0,'127.0.0.1',r));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function call(tool,args) {
        const encoded=JSON.stringify({tool,args,callId:randomUUID()});
        assert.ok(Buffer.byteLength(encoded)<=262144);
        return fetch(base+'/xhub/agent-tool',{method:'POST',headers:{Authorization:'Bearer files-fixture'},body:encoded}).then(r=>r.json());
    }
    const hash = b => createHash('sha256').update(b).digest('hex');
    try {
        const bytes=randomBytes(8*1024*1024);
        const started=await call('file_begin',{size:bytes.length,sha256:hash(bytes)});assert.equal(started.ok,true);
        const fileRef=started.result.fileRef;
        assert.equal((await call('base64_transform',{fileRef,operation:'encode'})).error.code,'file_incomplete');
        for(let offset=0;offset<bytes.length;offset+=49152) {
            const dataBase64=bytes.subarray(offset,offset+49152).toString('base64');
            assert.equal((await call('file_chunk',{fileRef,offset,dataBase64})).ok,true);
            if(offset===0) {
                assert.equal((await call('file_chunk',{fileRef,offset,dataBase64})).result.nextOffset,49152);
                assert.equal((await call('file_chunk',{fileRef,offset,dataBase64:Buffer.alloc(49152).toString('base64')})).error.code,'file_conflict');
            }
        }
        assert.equal((await call('file_commit',{fileRef})).ok,true);
        for(const algorithm of ['md5','sha1','sha256','sha512','sm3']){
            const digest=await call('hash_compute',{fileRef,algorithm});assert.equal(digest.ok,true,algorithm+': '+JSON.stringify(digest));
            assert.equal(digest.result.text,createHash(algorithm).update(bytes).digest('hex'));
        }
        for(const algorithm of ['md5','sha1','sha256','sha512','sm3','ripemd160']){
            const digest=await call('hmac_compute',{fileRef,algorithm,keyRef:'fixture'});assert.equal(digest.ok,true,algorithm+': '+JSON.stringify(digest));
            assert.equal(digest.result.text,createHmac(algorithm,'fixture-key').update(bytes).digest('hex'));
        }
        const encoded=await call('hex_transform',{fileRef,operation:'encode'});assert.equal(encoded.ok,true,JSON.stringify(encoded));
        assert.equal(encoded.result.file.size,16*1024*1024);
        const parts=[];let offset=0;
        for(;;){const r=await call('file_read',{fileRef:encoded.result.file.fileRef,offset});assert.equal(r.ok,true);parts.push(Buffer.from(r.result.dataBase64,'base64'));offset=r.result.nextOffset;if(r.result.eof)break;}
        const downloaded=Buffer.concat(parts);assert.equal(hash(downloaded),encoded.result.file.sha256);
        assert.ok(Buffer.from(downloaded.toString(),'hex').equals(bytes));
        assert.equal((await call('file_delete',{fileRef})).result.deleted,true);
        assert.equal((await call('file_status',{fileRef})).error.code,'resource_expired');
        const empty=await call('file_begin',{size:0,sha256:hash(Buffer.alloc(0))});
        assert.equal((await call('file_commit',{fileRef:empty.result.fileRef})).ok,true);
        assert.equal((await call('file_read',{fileRef:empty.result.fileRef,offset:0})).result.eof,true);
        assert.equal((await call('file_status',{fileRef:'../etc/passwd'})).ok,false);
        assert.equal((await call('file_begin',{size:8388609,sha256:'0'.repeat(64)})).ok,false);
    } finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('file quota reservation, checksum failure, expiration, restart and close stay isolated',()=>{
    const dir=mkdtempSync(join(tmpdir(),'ctool-file-lifecycle-'));
    const store=new FileStore(dir);let next;
    const hash=b=>createHash('sha256').update(b).digest('hex');
    try {
        const refs=Array.from({length:8},()=>store.begin(8388608,'0'.repeat(64)));
        assert.throws(()=>store.begin(1,'0'.repeat(64)),e=>e.code==='quota_exceeded');
        for(const r of refs)store.remove(r.fileRef);
        const bad=store.begin(1,'0'.repeat(64));store.chunk(bad.fileRef,0,'YQ==');
        assert.throws(()=>store.commit(bad.fileRef),e=>e.code==='checksum_mismatch');assert.equal(store.remove(bad.fileRef).deleted,false);
        const file=store.begin(1,hash(Buffer.from('a')));store.chunk(file.fileRef,0,'YQ==');store.commit(file.fileRef);
        const original=Date.now;Date.now=()=>file.expiresAt+1;
        try{assert.throws(()=>store.status(file.fileRef),e=>e.code==='resource_expired');}finally{Date.now=original;}
        const old=store.put(Buffer.from('retained only for this instance'));
        next=new FileStore(dir);assert.throws(()=>next.status(old.fileRef),e=>e.code==='resource_expired');
        const owned=readdirSync(dir).filter(n=>n.startsWith('ctool-files-'));assert.equal(owned.length,2,'active store directories must not be swept');
    }finally{store.close();next?.close();assert.deepEqual(readdirSync(dir),[]);rmSync(dir,{recursive:true,force:true});}
});
