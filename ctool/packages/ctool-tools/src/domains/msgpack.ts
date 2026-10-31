import {ExtData} from "@msgpack/msgpack";
import {Buffer} from "buffer";
export function normalizeMsgpack(value: unknown): unknown {
    if(value instanceof Uint8Array)return {$type:'binary',hex:Buffer.from(value).toString('hex'),base64:Buffer.from(value).toString('base64')};
    if(value instanceof ExtData)return {$type:'extension',extType:value.type,data:normalizeMsgpack(typeof value.data==='function'?value.data(0):value.data)};
    if(value instanceof Date)return {$type:'date',value:value.toISOString()};
    if(Array.isArray(value))return value.map(normalizeMsgpack);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalizeMsgpack(v)]));
    return value;
}
