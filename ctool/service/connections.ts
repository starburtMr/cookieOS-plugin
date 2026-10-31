import {Buffer} from "node:buffer";
import {randomBytes,createHash} from "node:crypto";
import {isIP} from "node:net";
import WebSocket from "ws";
import {ToolError,stringSchema as s} from "ctool-tools";
import {withTextOrFile,definition,integer,fileRef} from "./definitions";
import type {FileStore} from "./files";
const secretRef={type:"string",pattern:"^[a-zA-Z0-9_-]{1,80}$"};
const messageId={type:"string",minLength:1,maxLength:80,pattern:"^[a-zA-Z0-9_-]+$"};
const socketRef={type:"string",pattern:"^[A-Za-z0-9_-]{43}$"};
export const connectionTools=[
    definition("input_fetch","从管理服务器下载HTTP(S)输入，最多8 MiB；不是用户电脑",{url:{type:"string",maxLength:4096},secretRef},["url"],undefined,"write"),
    definition("ip_query","指定IP或管理服务器公网出口地理信息（GeoJS）",{ip:{type:"string",maxLength:64}},[]),
    definition("websocket_open","从管理服务器连接WebSocket，返回临时会话引用",{url:{type:"string",maxLength:4096},secretRef,protocols:{type:"array",items:{type:"string",maxLength:128},maxItems:8,uniqueItems:true}},["url"],undefined,"write"),
    withTextOrFile(definition("websocket_send","发送文本或文件字节；messageId防重发；sent仅代表写入socket，不是对端业务成功",{socketRef,messageId,text:s,fileRef},["socketRef","messageId"],undefined,"dangerous")),
    definition("websocket_receive","按cursor重复读取有界队列；二进制返回临时文件",{socketRef,cursor:integer(0,Number.MAX_SAFE_INTEGER),count:integer(1,16)},["socketRef"],undefined,"write"),
    definition("websocket_status","查询会话、队列及指定messageId的发送状态",{socketRef,messageId},["socketRef"]),
    definition("websocket_close","关闭WebSocket会话并释放队列",{socketRef},["socketRef"],undefined,"write"),
];
function urlFor(text:string,protocols:string[]) {let url:URL;try{url=new URL(text);}catch{throw new ToolError('invalid_arguments','请输入完整地址');}if(!protocols.includes(url.protocol)||url.username||url.password)throw new ToolError('invalid_arguments','地址协议不支持或包含账号密码');return url;}
type Message={sequence:number;kind:string;data:string;file?:ReturnType<FileStore['put']>};
type Sent={digest:string;state:'pending'|'sent'|'unknown'};
type Session={socket:WebSocket;queue:Message[];sequence:number;sent:Map<string,Sent>;bytes:number;dropped:number;expiresAt:number;state:string};
export class Connections {
    private sessions=new Map<string,Session>();
    private timer=setInterval(()=>{for(const [id,s] of this.sessions)if(s.expiresAt<Date.now())this.remove(id);},60000);
    constructor(private files:FileStore,private fetcher:typeof fetch=fetch,private secrets:Record<string,unknown>={}){this.timer.unref();}
    private headers(ref?:string) {
        if(!ref)return undefined;
        const configured=this.secrets.requestHeaders;
        const value=configured&&typeof configured==='object'&&!Array.isArray(configured)&&Object.hasOwn(configured,ref)?(configured as Record<string,unknown>)[ref]:undefined;
        if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>32)throw new ToolError('configuration_required','请在秘密配置requestHeaders中设置对应请求头');
        const headers:Record<string,string>={};
        for(const [name,item] of Object.entries(value)){
            if(!/^[!#$%&'*+.^\w`|~-]+$/.test(name)||/^(?:host|connection|content-length|transfer-encoding|upgrade|proxy-|sec-websocket-)/i.test(name)||typeof item!=='string'||item.length>8192||/[\r\n]/.test(item))throw new ToolError('configuration_required','请求头配置不正确');
            headers[name]=item;
        }
        return headers;
    }
    private async closeSession(id:string,s:Session){
        this.sessions.delete(id);
        if(s.socket.readyState===WebSocket.CLOSED)return;
        await new Promise<void>(resolve=>{const finish=()=>{clearTimeout(timer);s.socket.off('close',finish);resolve();};const timer=setTimeout(()=>{s.socket.terminate();finish();},250);s.socket.once('close',finish);s.socket.close();});
    }
    private remove(id:string){const s=this.sessions.get(id);s?.socket.terminate();this.sessions.delete(id);return Boolean(s);}
    async invoke(name:string,a:Record<string,any>,signal:AbortSignal) {
        if(name==='input_fetch'||name==='ip_query') {
            if(a.ip&&!isIP(a.ip))throw new ToolError('invalid_arguments','IP地址不正确');
            const url=name==='ip_query'?new URL(a.ip?`https://get.geojs.io/v1/ip/geo/${a.ip}.json`:'https://get.geojs.io/v1/ip/geo.json'):urlFor(a.url,['https:','http:']);
            const response=await this.fetcher(url,{redirect:'error',credentials:'omit',headers:this.headers(a.secretRef),signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])});
            if(!response.ok||!response.body)throw new ToolError('upstream_failed','下载失败，请检查地址与网络');
            const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
            try {for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>8388608)throw new ToolError('input_limit','下载超过8 MiB');chunks.push(r.value);}}finally{await reader.cancel().catch(()=>{});}
            const bytes=Buffer.concat(chunks);
            if(name==='input_fetch')return {bytes,mime:(response.headers.get('content-type') ?? 'application/octet-stream').slice(0,128)};
            const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!value||typeof value.ip!=='string'||!isIP(value.ip))throw new ToolError('upstream_failed','IP服务返回数据不正确');
            const fields=['ip','country','country_code','region','city','latitude','longitude','timezone','organization','organization_name','asn'];
            return {text:JSON.stringify({...Object.fromEntries(fields.filter(k=>typeof value[k]==='string'||typeof value[k]==='number').map(k=>[k,value[k]])),source:'GeoJS',subject:a.ip?'specified_ip':'management_server_egress'})};
        }
        if(name==='websocket_open') {
            if(this.sessions.size>=8)throw new ToolError('busy','连接数量达到上限，请关闭不用的连接');
            const url=urlFor(a.url,['ws:','wss:']);
            const id=randomBytes(32).toString('base64url');
            const socket=new WebSocket(url,a.protocols ?? [],{headers:this.headers(a.secretRef),handshakeTimeout:10000,maxPayload:262144,followRedirects:false,perMessageDeflate:false});
            const s:Session={socket,queue:[],sequence:0,sent:new Map(),bytes:0,dropped:0,expiresAt:Date.now()+300000,state:'connecting'};this.sessions.set(id,s);
            socket.on('message',(bytes:Buffer,binary:boolean)=>{
                if(s.queue.length>=64||s.bytes+bytes.length>2097152){s.dropped++;s.state='overflow';socket.terminate();return;}
                s.queue.push({sequence:++s.sequence,kind:binary?'binary':'text',data:binary?bytes.toString('base64'):bytes.toString('utf8')});s.bytes+=bytes.length;
            });
            socket.on('error',()=>{s.state='failed';});socket.on('close',()=>{if(!['failed','overflow'].includes(s.state))s.state='closed';});
            try{await new Promise<void>((resolve,reject)=>{const abort=()=>{socket.terminate();done(new ToolError('cancelled','连接已停止'));};const done=(error?:Error)=>{signal.removeEventListener('abort',abort);socket.off('open',open);socket.off('error',errorHandler);socket.off('close',closed);error?reject(error):resolve();};const open=()=>{s.state='open';done();};const errorHandler=()=>done(new ToolError('upstream_failed','WebSocket连接失败'));const closed=()=>done(new ToolError('upstream_failed','连接在打开前关闭'));socket.once('open',open);socket.once('error',errorHandler);socket.once('close',closed);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();});}
            catch(e){this.remove(id);throw e;}
            return {text:JSON.stringify({socketRef:id,state:s.state,expiresAt:s.expiresAt})};
        }
        const s=this.sessions.get(a.socketRef);if(!s||s.expiresAt<Date.now()){this.remove(a.socketRef);throw new ToolError('resource_expired','连接不存在或已过期');}s.expiresAt=Date.now()+300000;
        if(name==='websocket_close'){await this.closeSession(a.socketRef,s);return {text:JSON.stringify({closed:true})};}
        if(name==='websocket_status')return {text:JSON.stringify({state:s.state,queued:s.queue.length,dropped:s.dropped,bufferedAmount:s.socket.bufferedAmount,expiresAt:s.expiresAt,...(a.messageId?{message:{messageId:a.messageId,state:s.sent.get(a.messageId)?.state ?? 'unknown'}}:{})})};
        if(name==='websocket_receive'){
            const cursor=a.cursor ?? 0;
            if(cursor>s.sequence)throw new ToolError('invalid_arguments','消息游标超出当前会话范围');
            const earliestCursor=(s.queue[0]?.sequence ?? s.sequence+1)-1;
            s.queue=s.queue.filter(m=>m.sequence>cursor);
            s.bytes=s.queue.reduce((sum,m)=>sum+(m.kind==='binary'?Buffer.from(m.data,'base64').length:Buffer.byteLength(m.data)),0);
            const messages=s.queue.filter(m=>m.sequence>cursor).slice(0,a.count ?? 16).map(m=>{
                if(m.kind==='text')return {sequence:m.sequence,kind:m.kind,data:m.data};
                try{if(m.file)this.files.status(m.file.fileRef);}catch{m.file=undefined;}
                m.file ??= this.files.put(Buffer.from(m.data,'base64'));
                return {sequence:m.sequence,kind:m.kind,file:m.file};
            });
            return {text:JSON.stringify({state:s.state,messages,nextCursor:messages.at(-1)?.sequence ?? cursor,earliestCursor,gap:cursor<earliestCursor,dropped:s.dropped})};
        }
        if(name==='websocket_send'){
            if((typeof a.text==='string')===(a.bytes instanceof Uint8Array))throw new ToolError('invalid_arguments','请选择文本或文件之一');
            const data=a.bytes ?? a.text;
            if((a.bytes?.length ?? Buffer.byteLength(a.text))>262144)throw new ToolError('input_limit','单条消息超过256 KiB');
            const digest=createHash('sha256').update(a.bytes?'binary:':'text:').update(data).digest('hex');
            const previous=s.sent.get(a.messageId);
            if(previous){
                if(previous.digest!==digest)throw new ToolError('message_conflict','相同消息号的内容不一致');
                if(previous.state!=='sent')throw new ToolError('result_unknown','发送结果待确认，请勿自动重发');
                return {text:JSON.stringify({messageId:a.messageId,sent:true,acknowledged:false,duplicate:true})};
            }
            if(s.state!=='open')throw new ToolError('upstream_failed','连接未打开');
            if(s.socket.bufferedAmount>1048576||s.sent.size>=128)throw new ToolError('busy','发送队列或消息记录已达到上限，请确认结果后新建连接');
            if(signal.aborted)throw new ToolError('cancelled','发送已停止');
            const entry:Sent={digest,state:'pending'};s.sent.set(a.messageId,entry);
            await new Promise<void>((resolve,reject)=>{
                let settled=false;
                const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',abort);entry.state=error?'unknown':'sent';error?reject(error):resolve();};
                const unknown=()=>finish(new ToolError('result_unknown','发送结果待确认，请勿自动重发'));
                const timer=setTimeout(unknown,10000);const abort=unknown;
                signal.addEventListener('abort',abort,{once:true});
                try{s.socket.send(data,error=>error?unknown():finish());}catch{unknown();}
            });
            return {text:JSON.stringify({messageId:a.messageId,sent:true,acknowledged:false,duplicate:false})};
        }
        throw new ToolError('unknown_tool','工具不存在');
    }
    close(){clearInterval(this.timer);for(const id of this.sessions.keys())this.remove(id);}
}
