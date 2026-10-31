import {Buffer} from "node:buffer";
import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash,generateKeyPairSync} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createPluginServer,allTools} from '../dist/extension/service/main.mjs';
import {gzipSync} from 'node:zlib';
import sharp from 'sharp';
import {encode as encodeBmp} from 'bmp-ts';
import {encodeIco} from 'icojs';
import sm from 'sm-crypto';
const sm2=sm.sm2.generateKeyPairHex();
const token=randomUUID();let server,base;
const rsa=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
before(async()=>{server=createPluginServer({XHUB_SERVICE_TOKEN:token,XHUB_SECRET_CONFIG:JSON.stringify({keys:{smPrivate:sm2.privateKey,smPublic:sm2.publicKey,symmetric:'1234567890123456',private:rsa.privateKey,public:rsa.publicKey,sm4:'0123456789abcdeffedcba9876543210'}})});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
async function call(tool,args){return fetch(base+'/xhub/agent-tool',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:JSON.stringify({tool,args,callId:randomUUID()})}).then(r=>r.json());}
async function ok(tool,args){const r=await call(tool,args);assert.equal(r.ok,true,tool+': '+JSON.stringify(r));return r.result;}
async function bytes(file){const parts=[];let offset=0;for(;;){const r=await ok('file_read',{fileRef:file.fileRef,offset});parts.push(Buffer.from(r.dataBase64,'base64'));offset=r.nextOffset;if(r.eof)break;}return Buffer.concat(parts);}
async function upload(value){const r=await ok('file_begin',{size:value.length,sha256:createHash('sha256').update(value).digest('hex')});for(let offset=0;offset<value.length;offset+=49152)await ok('file_chunk',{fileRef:r.fileRef,offset,dataBase64:value.subarray(offset,offset+49152).toString('base64')});await ok('file_commit',{fileRef:r.fileRef});return r.fileRef;}
const cases=[
    ['base64_transform',{text:'你好',operation:'encode'},'5L2g5aW9'],
    ['base32_transform',{text:'foo',operation:'encode'},'MZXW6==='],
    ['base58_transform',{text:'hello',operation:'encode'},'Cn8eVZg'],
    ['hex_transform',{text:'中',operation:'encode'},'e4b8ad'],
    ['unicode_transform',{text:'中',operation:'encode',format:'unicode_point_wide_brace'},'\\u{4e2d}'],
    ['url_transform',{text:'a+b',operation:'encode'},'a%2Bb'],
    ['html_entities',{text:'<b>',operation:'encode'},'&lt;b&gt;'],
    ['punycode_transform',{text:'例子.com',operation:'encode'},'xn--fsqu00a.com'],
    ['ascii_lookup',{text:'A',from:'str',to:'dec'},'65'],
    ['checksum_compute',{text:'123456789',algorithm:'crc32'},r=>assert.equal(r.value,0xCBF43926)],
    ['text_operate',{text:'a\nb\na',operation:'lineRemoveRepeat'},'a\nb'],
    ['name_convert',{text:'hello world',style:'pascalCase'},'HelloWorld'],
    ['pinyin_convert',{text:'你好',delimiter:' ',options:{tone:'none'}},'ni hao'],
    ['zh_number_convert',{text:'123',from:'number',to:'lower'},'一百二十三'],
    ['stacktrace_parse',{text:'TypeError: invalid\n    at main (/app/test.js:4:2)'},r=>assert.equal(JSON.parse(r.text).language,'JavaScript')],
    ['regex_execute',{text:'ab12cd34',pattern:'(\\d+)',operation:'match',flags:'g'},r=>assert.deepEqual(JSON.parse(r.text).map(x=>x.captures),[['12'],['34']])],
    ['radix_transform',{value:'9007199254740993',fromBase:10,toBase:16},'20000000000001'],
    ['binary_convert',{value:'-1',bits:8,representation:'complement'},'11111111'],
    ['unit_convert',{value:'1',group:'length',from:'km',to:'m'},'1000'],
    ['number_statistics',{text:'1,2,3,4'},r=>assert.equal(JSON.parse(r.text).median,'2.5')],
    ['uuid_operate',{count:2},r=>assert.equal(new Set(JSON.parse(r.text)).size,2)],
    ['random_generate',{alphabet:'x',length:3,count:2},r=>assert.deepEqual(JSON.parse(r.text),['xxx','xxx'])],
    ['objectid_operate',{operation:'parse',value:'000000000102030405000001'},r=>assert.equal(JSON.parse(r.text).iso,'1970-01-01T00:00:00.000Z')],
    ['ip_calculate',{version:'ipv4',operation:'inspect',address:'192.0.2.5',mask:24},r=>assert.equal(JSON.parse(r.text).network,'192.0.2.0')],
    ['cron_inspect',{expression:'0 * * * *',timezone:'UTC',currentDate:'2026-01-01T00:00:00Z',count:1},r=>assert.deepEqual(JSON.parse(r.text).dates,['2026-01-01T01:00:00.000Z'])],
    ['time_operate',{operation:'inspect',value:'0',from:'nanoseconds',timezone:'UTC'},r=>assert.equal(JSON.parse(r.text).iso,'1970-01-01T00:00:00.000+00:00')],
    ['hash_compute',{text:'abc',algorithm:'sha256'},'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['hmac_compute',{text:'abc',keyRef:'symmetric',algorithm:'sha256'},r=>assert.match(r.text,/^[0-9a-f]{64}$/)],
    ['jwt_decode',{text:'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.'},r=>assert.equal(JSON.parse(r.text).verified,false)],
    ['json_operate',{text:'{a:1,}',operation:'repair',indent:0},'{"a":1}'],
    ['json_query',{text:'{"a":[1,2]}',language:'jsonpath',query:'$.a[*]'},'[1,2]'],
    ['json_schema_validate',{text:'{"a":1}',schema:'{"type":"object","properties":{"a":{"type":"number"}},"required":["a"]}'},r=>assert.equal(JSON.parse(r.text).valid,true)],
    ['json_transform',{text:'{"a":2}',expression:'_.mapValues(data,x=>x*3)'},'{"value":{"a":6}}'],
    ['json_to_type',{text:'{"name":"ctool"}',language:'TypeScript',options:{}},r=>assert.match(r.text,/name/)],
    ['serialize_transform',{text:'a: 1',from:'yaml',to:'json'},'{"a":1}'],
    ['config_transform',{text:'a=1',from:'properties',to:'json'},'{"a":"1"}'],
    ['code_transform',{text:'const x=1;',language:'javascript',operation:'beautify'},r=>assert.match(r.text,/const x = 1/)],
    ['sql_fill',{text:"select '?' as literal, x from t where id = ? -- ?",params:'1(Integer)'},r=>{assert.match(r.text,/'\?'/);assert.match(r.text,/id = 1/);assert.match(r.text,/-- \?/)}],
    ['http_code_convert',{text:'curl https://example.org',source:'cURL',target:'node-|-fetch'},r=>assert.match(r.text,/example.org/)],
    ['docker_compose_convert',{text:'docker run -p 8080:80 nginx'},r=>assert.match(r.text,/nginx/)],
    ['ua_parse',{text:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'},r=>assert.equal(JSON.parse(r.text).browser.name,'Chrome')],
    ['diff_compute',{original:'{"a":1}',modified:'{"a":2}',format:'json'},r=>assert.equal(JSON.parse(r.text)[0].op,'update')],
    ['password_generate',{length:16,amount:2},r=>{const values=JSON.parse(r.text);assert.equal(values.length,2);for(const v of values){assert.equal(v.length,16);assert.match(v,/[a-z]/);assert.match(v,/[A-Z]/);assert.match(v,/\d/)}}],
    ['color_convert',{text:'#ff0000',from:'hex',to:'rgb'},'rgb(255, 0, 0)'],
    ['permission_convert',{value:'4755'},r=>{const v=JSON.parse(r.text);assert.equal(v.symbolic,'rwsr-xr-x');assert.equal(v.octal,'4755')}],
    ['asn1_parse',{text:'02012a',encoding:'hex'},r=>assert.equal(JSON.parse(r.text).type,'INTEGER')],
];
for(const [tool,args,check] of cases)test(tool,async()=>{const r=await ok(tool,args);if(typeof check==='function')check(r);else assert.equal(r.text,check);});
test('all original contracts remain unchanged, all 100 names are public',async()=>{
    const legacy=JSON.parse(await readFile(new URL('./fixtures/legacy-tools.json',import.meta.url)));
    assert.equal(allTools.length,100);assert.equal(new Set(allTools.map(t=>t.name)).size,100);
    for(const old of legacy.tools){const actual=allTools.find(t=>t.name===old.name);assert.ok(actual,old.name);for(const key of ['inputSchema','outputSchema','effect'])assert.deepEqual(actual[key],old[key],old.name+' '+key);}
    for(const t of allTools){assert.equal(t.ai,true);assert.equal(t.mcp,true);assert.ok(Buffer.byteLength(t.name)<=40);assert.equal((await call(t.name,{unexpected:true})).ok,false,t.name);}
});
test('bytes codecs, gzip and MessagePack round trip, reject corrupt input',async()=>{
    for(const name of ['base64_transform','base32_transform','base58_transform','hex_transform']){
        const encoded=await ok(name,{text:'中文😀',operation:'encode'});const decoded=await ok(name,{text:encoded.text,operation:'decode',output:'text'});assert.equal(decoded.text,'中文😀',name);
    }
    const zipped=await ok('gzip_transform',{text:'hello '.repeat(100),operation:'encode'});
    const unzipped=await ok('gzip_transform',{fileRef:zipped.file.fileRef,operation:'decode',output:'text'});assert.equal(unzipped.text,'hello '.repeat(100));
    const packed=await ok('msgpack_transform',{text:'{"n":9007199254740993,"s":"中文"}',operation:'encode'});
    const unpacked=await ok('msgpack_transform',{fileRef:packed.file.fileRef,operation:'decode'});assert.equal(unpacked.text,'{"n":9007199254740993,"s":"中文"}');
    for(const [tool,args] of [['hex_transform',{text:'abc',operation:'decode'}],['base32_transform',{text:'A',operation:'decode'}],['base64_transform',{text:'!',operation:'decode'}],['json_query',{text:'{}',query:'$[?(@.constructor)]',language:'jsonpath'}],['unit_convert',{value:'2;import("fs")',group:'length',from:'km',to:'m'}]])assert.equal((await call(tool,args)).ok,false,tool);
});
test('symmetric crypto, RSA, signatures, Bcrypt and JWT work through secret references',async()=>{
    for(const name of ['aes_crypt','des_crypt','triple_des_crypt','rc4_crypt','rabbit_crypt']){
        const encrypted=await ok(name,{text:'中文abc',operation:'encrypt',keyRef:'symmetric'});
        const decrypted=await ok(name,{text:encrypted.text,operation:'decrypt',keyRef:'symmetric',output:'text'});assert.equal(decrypted.text,'中文abc',name);
        const file=await ok(name,{text:'字节密文',operation:'encrypt',keyRef:'symmetric',output:'bytes'});
        assert.equal((await ok(name,{fileRef:file.file.fileRef,operation:'decrypt',keyRef:'symmetric',output:'text'})).text,'字节密文');
        await ok('file_delete',{fileRef:file.file.fileRef});
    }
    for(const padding of ['pkcs1','oaep']){
        const encrypted=await ok('rsa_crypt',{text:'cookieOS',operation:'encrypt',keyRef:'public',padding});
        const decrypted=await ok('rsa_crypt',{fileRef:encrypted.file.fileRef,operation:'decrypt',keyRef:'private',padding,output:'text'});assert.equal(decrypted.text,'cookieOS');
    }
    const signed=await ok('signature_sign',{text:'abc',keyRef:'private',algorithm:'SHA256withRSA'});
    assert.equal(JSON.parse((await ok('signature_verify',{text:'abc',keyRef:'public',algorithm:'SHA256withRSA',signature:signed.text})).text).valid,true);
    assert.equal(JSON.parse((await ok('signature_verify',{text:'different',keyRef:'public',algorithm:'SHA256withRSA',signature:signed.text})).text).valid,false);
    const bcrypt=await ok('bcrypt_hash',{text:'password',rounds:4,version:'2b'});assert.match(bcrypt.text,/^\$2b\$04\$/);
    assert.equal(JSON.parse((await ok('bcrypt_verify',{text:'password',hash:bcrypt.text})).text).matches,true);
    const jwt=await ok('jwt_sign',{payload:'{"sub":"1"}',keyRef:'symmetric',algorithm:'HS256'});assert.equal(JSON.parse((await ok('jwt_decode',{text:jwt.text})).text).payload.sub,'1');
    assert.equal((await call('aes_crypt',{text:'a',operation:'encrypt',keyRef:'missing'})).error.code,'configuration_required');
    const sm4=await ok('sm4_crypt',{text:'abc',operation:'encrypt',keyRef:'sm4'});
    assert.equal((await ok('sm4_crypt',{fileRef:sm4.file.fileRef,operation:'decrypt',keyRef:'sm4',output:'text'})).text,'abc');
});
test('QR and barcode are real images and Chinese QR reads back',async()=>{
    const qr=await ok('qrcode_generate',{text:'cookieOS 中文😀',size:600});const data=await bytes(qr.file);assert.equal(data.subarray(1,4).toString(),'PNG');
    assert.equal((await ok('qrcode_read',{fileRef:qr.file.fileRef})).text,'cookieOS 中文😀');
    const barcode=await ok('barcode_generate',{text:'123456789012',options:{format:'CODE128'}});assert.equal((await bytes(barcode.file)).subarray(1,4).toString(),'PNG');
    const bad=await upload(Buffer.from('not an image'));assert.equal((await call('qrcode_read',{fileRef:bad})).ok,false);
});
test('original QR styles, logo and PNG/JPEG/WebP/GIF/BMP/ICO decoding use real bytes',async()=>{
    const logoRef=await upload(await readFile(new URL('../assets/icon.png',import.meta.url)));
    for(const style of ['square','rounded','extra-rounded','classy','classy-rounded']){
        const qr=await ok('qrcode_generate',{text:'样式 QR '+style,logoRef,size:600,options:{error_correction_level:'H',image_options:{size:2,margin:4},dots_options:{type:style}}});
        assert.equal((await ok('qrcode_read',{fileRef:qr.file.fileRef})).text,'样式 QR '+style);
    }
    const unsafeStyle=await call('qrcode_generate',{text:'样式 QR dots',logoRef,size:600,options:{error_correction_level:'H',image_options:{size:2,margin:4},dots_options:{type:'dots'}}});
    assert.equal(unsafeStyle.ok,false);assert.equal(unsafeStyle.error.code,'not_found','unreadable combinations are rejected rather than returned as usable images');
    const generated=await ok('qrcode_generate',{text:'跨图片格式',size:600});const png=await bytes(generated.file);
    const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const abgr=Buffer.alloc(data.length);for(let i=0;i<data.length;i+=4){abgr[i]=data[i+3];abgr[i+1]=data[i+2];abgr[i+2]=data[i+1];abgr[i+3]=data[i];}
    const formats=[await sharp(png).jpeg().toBuffer(),await sharp(png).webp().toBuffer(),await sharp(png).gif().toBuffer(),Buffer.from(encodeBmp({data:abgr,width:info.width,height:info.height}).data),Buffer.from(await encodeIco([{buffer:await sharp(png).resize(256,256).png().toBuffer()}]))];
    for(const encoded of formats){const ref=await upload(encoded);assert.equal((await ok('qrcode_read',{fileRef:ref})).text,'跨图片格式');await ok('file_delete',{fileRef:ref});}
});
test('numeric precision, signed boundaries, SQL quoting and resource exhaustion regressions',async()=>{
    for(const bits of [8,16,32,64,128,256,512,1024,2048,4096]){
        const min=-(2n**BigInt(bits-1));const result=await ok('binary_convert',{value:String(min),bits,representation:'complement'});assert.equal(result.text,'1'+'0'.repeat(bits-1));
        assert.equal((await call('binary_convert',{value:String(min),bits,representation:'trueForm'})).ok,false);
    }
    assert.equal((await ok('binary_convert',{value:'-0',bits:8,representation:'complement'})).text,'00000000');
    for(const value of ['123456789','-1','-123456789']){const v=JSON.parse((await ok('time_operate',{operation:'inspect',value,from:'nanoseconds',timezone:'UTC'})).text);assert.equal(v.nanoseconds,value);}
    assert.equal((await call('time_operate',{operation:'inspect',value:'2026-02-30T00:00:00Z'})).ok,false);
    const sql=await ok('sql_fill',{text:'select * from t where name=:name',params:"name=O'Reilly(String)"});assert.match(sql.text,/'O''Reilly'/);
    assert.equal((await ok('checksum_compute',{text:'123456789',algorithm:'crc16modbus',endian:'big'})).text,'4b37');
    assert.equal((await ok('checksum_compute',{text:'123456789',algorithm:'crc16modbus',endian:'little'})).text,'374b');
    assert.equal((await ok('checksum_compute',{text:'',algorithm:'lrc'})).value,0);
    assert.equal((await call('json_transform',{text:'{"n":9007199254740993}',expression:'data.n'})).ok,false,'never silently round unsafe integers');
    assert.equal((await call('json_transform',{text:'{}',expression:'(()=>{while(true){}})()'})).ok,false);
    assert.equal((await ok('json_transform',{text:'{}',expression:'typeof process'})).text,'{"value":"undefined"}');
    const bomb=await upload(gzipSync(Buffer.alloc(9*1024*1024)));
    assert.equal((await call('gzip_transform',{fileRef:bomb,operation:'decode'})).error.code,'output_limit');
    await ok('file_delete',{fileRef:bomb});
});
test('properties with prototype names remain data and cannot poison subsequent worker calls',async()=>{
    const parsed=JSON.parse((await ok('config_transform',{from:'properties',to:'json',text:'a=x\na.__proto__.polluted=true\n__proto__.other=value',options:{convertToJsonTree:true}})).text);
    assert.equal(Object.getOwnPropertyDescriptor(parsed.a,"__proto__")?.value.polluted,'true');assert.equal(Object.getOwnPropertyDescriptor(parsed,"__proto__")?.value.other,'value');
    for(let i=0;i<3;i++){const r=await ok('json_transform',{text:'{}',expression:'({polluted:({}).polluted ?? null,other:({}).other ?? null})'});assert.deepEqual(JSON.parse(r.text),{value:{polluted:null,other:null}});}
});

test('SM2 byte encryption and signatures, plus both generated RSA key formats',async()=>{
    for(const mode of [0,1]){
        const encrypted=await ok('sm2_crypt',{text:'中文 SM2',operation:'encrypt',keyRef:'smPublic',mode});
        assert.equal((await ok('sm2_crypt',{fileRef:encrypted.file.fileRef,operation:'decrypt',keyRef:'smPrivate',mode,output:'text'})).text,'中文 SM2');
        await ok('file_delete',{fileRef:encrypted.file.fileRef});
    }
    for(const der of [false,true]){
        const signed=await ok('sm2_sign',{text:'message',keyRef:'smPrivate',der,userId:'fixture'});
        const verify=async text=>JSON.parse((await ok('sm2_verify',{text,keyRef:'smPublic',signature:signed.text,der,userId:'fixture'})).text).valid;
        assert.equal(await verify('message'),true);assert.equal(await verify('changed'),false);
    }
    for(const format of ['pkcs1','pkcs8']){
        const keys=await ok('key_pair_generate',{bits:512,format});
        const privatePem=(await bytes(keys.privateKey)).toString();
        await ok('file_delete',{fileRef:keys.privateKey.fileRef});
        assert.match(keys.publicKey,/BEGIN PUBLIC KEY/);assert.match(privatePem,format==='pkcs1'?/BEGIN RSA PRIVATE KEY/:/BEGIN PRIVATE KEY/);
    }
});

test('user async schemas cannot return a Promise as a successful validity result',async()=>{
    const result=await call('json_schema_validate',{text:'"wrong"',schema:'{"$async":true,"type":"number"}'});
    assert.equal(result.ok,false);assert.equal(result.error.code,'invalid_arguments');
    const next=JSON.parse((await ok('json_schema_validate',{text:'1',schema:'{"type":"number"}'})).text);
    assert.equal(next.valid,true);
});
