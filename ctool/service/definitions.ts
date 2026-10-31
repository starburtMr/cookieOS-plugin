import {crcAlgorithms} from "ctool-tools/domains/checksums";
import {objectSchema, stringSchema} from "ctool-tools";
export const choice = (...values: string[]) => ({type:"string",enum:values});
export const integer = (minimum: number, maximum: number) => ({type:"integer",minimum,maximum});
export const boolean = {type:"boolean"};
export const fileRef = {type:"string",pattern:"^[A-Za-z0-9_-]{43}$"};
const s = stringSchema;
export const fileInfo = objectSchema({fileRef,size:integer(0,16777216),sha256:{type:"string",pattern:"^[a-f0-9]{64}$"},mime:{type:"string",maxLength:128},expiresAt:integer(0,Number.MAX_SAFE_INTEGER)});
const result = {oneOf:[objectSchema({text:{type:"string",maxLength:1048576}}),objectSchema({file:fileInfo})]};
export function definition(name: string, title: string, properties: Record<string,unknown>, required: string[], outputSchema: object = result, effect = "read", timeoutSeconds = 30) {
    return {name,title,description:title,effect,ai:true,mcp:true,timeoutSeconds,inputSchema:objectSchema(properties,required),outputSchema};
}
export const withTextOrFile = (tool:ReturnType<typeof definition>) => ({...tool,inputSchema:{...tool.inputSchema,oneOf:[{properties:{text:tool.inputSchema.properties.text},required:['text']},{properties:{fileRef:tool.inputSchema.properties.fileRef},required:['fileRef']}]}});
export const fileTools = [
    definition("file_begin","开始分块上传（8 MiB 上限）",{size:integer(0,8388608),sha256:{type:"string",pattern:"^[a-f0-9]{64}$"},mime:{type:"string",maxLength:128}},["size","sha256"],fileInfo,"write"),
    definition("file_chunk","上传分块（原始字节最多48 KiB）",{fileRef,offset:integer(0,8388608),dataBase64:{type:"string",maxLength:65536}},["fileRef","offset","dataBase64"],objectSchema({nextOffset:integer(0,8388608)}),"write"),
    definition("file_commit","确认上传大小和SHA256",{fileRef},["fileRef"],fileInfo,"write"),
    definition("file_status","查询临时文件状态",{fileRef},["fileRef"],{...fileInfo,properties:{...fileInfo.properties,state:choice("ready","uploading"),nextOffset:integer(0,16777216)},required:[...fileInfo.required,"state","nextOffset"]}),
    definition("file_read","分块读取临时文件",{fileRef,offset:integer(0,16777216),length:integer(1,49152)},["fileRef","offset"],{...fileInfo,properties:{...fileInfo.properties,dataBase64:{type:"string",maxLength:65536},offset:integer(0,16777216),nextOffset:integer(0,16777216),eof:boolean},required:[...fileInfo.required,"dataBase64","offset","nextOffset","eof"]}),
    definition("file_delete","删除临时文件",{fileRef},["fileRef"],objectSchema({deleted:boolean}),"write"),
];
const binaryCodecs=["base64","base32","base58","hex","gzip"];
const binaryInput={text:s,fileRef,operation:choice("encode","decode"),encoding:choice("utf-8","gbk"),output:choice("text","bytes")};
export const extendedTools = [
    ...binaryCodecs.map(codec=>withTextOrFile(definition(codec+"_transform",codec+"编解码；decode文本是编码串（gzip为Base64），或使用fileRef",{...binaryInput,...(codec==='base64'?{urlSafe:boolean}:{}),...(codec==='hex'?{uppercase:boolean}:{}),...(codec==='gzip'?{format:choice("gzip","deflate")}: {})},["operation"]))),
    definition("url_transform","URI/组件编解码；宽容组件解码可保留坏字节",{text:s,operation:choice("encode","decode"),mode:choice("uri","component"),tolerant:boolean},["text","operation"]),
    definition("unicode_transform","Unicode转义与文本互转",{text:s,operation:choice("encode","decode"),format:choice("unicode_point_default","unicode_point_wide","unicode_point_wide_brace","unicode_number","html_entity_10","html_entity_16","css_entity")},["text","operation"]),
    definition("punycode_transform","域名Punycode转换",{text:s,operation:choice("encode","decode")},["text","operation"]),
    definition("html_entities","HTML 实体编码与解码",{text:s,operation:choice("encode","decode")},["text","operation"]),
    definition("ascii_lookup","ASCII 字符和进制转换",{text:s,from:choice("str","dec","hex","oct","bin"),to:choice("str","dec","hex","oct","bin")},["text","from","to"]),
    definition("checksum_compute","BCC LRC CRC 校验",{text:s,fileRef,encoding:choice("utf-8","gbk"),algorithm:choice("bcc","lrc",...crcAlgorithms),radix:{type:"integer",enum:[2,8,10,16]},endian:choice("big","little"),uppercase:boolean},["algorithm"],objectSchema({value:integer(0,4294967295),text:s})),
];
