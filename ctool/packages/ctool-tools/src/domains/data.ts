import Ajv from "ajv";
import {encode,decode} from "@msgpack/msgpack";
import {normalizeMsgpack} from "./msgpack";
import {JSONPath} from "jsonpath-plus";
import jmespath from "jmespath";
import Json from "./json";
import jsonUtil from "./jsonUtil";
import Serialize from "./serialize/index";
import {transform as toType} from "./toObject/index";
import {checkTree,ToolError,decodeBase64Bytes} from "../index";

const sources={json:"formJson",yaml:"formYaml",toml:"formToml",xml:"formXml",csv:"formCsv",html_table:"formTable",php_array:"formPhpArray",php_serialize:"formPhpSerialize",properties:"formProperties",http_query_string:"formQueryString",text:"formText"} as const;
const targets={json:"toJson",yaml:"toYaml",toml:"toToml",xml:"toXml",csv:"toCsv",html_table:"toTable",php_array:"toPhpArray",php_serialize:"toPhpSerialize",properties:"toProperties",http_query_string:"toQueryString",text:"toText"} as const;
const read=(text:string,repair=false)=>{const v=Json.parse(text,{JSON_REPAIR:repair});checkTree(v);return v;};
export async function dataOperation(name:string,a:Record<string,any>) {
    if(name==='msgpack_transform')return a.operation==='encode'?{bytes:encode(read(a.text),{useBigInt64:true}),mime:'application/msgpack'}:{text:Json.stringify(normalizeMsgpack(decode(a.bytes ?? decodeBase64Bytes(a.text),{useBigInt64:true,maxStrLength:8388608,maxBinLength:8388608,maxArrayLength:50000,maxMapLength:50000,maxExtLength:8388608})))};
    if(name==='config_transform'||name==='serialize_transform') {
        if(a.from==='xml'&&/<!DOCTYPE|<!ENTITY/i.test(a.text))throw new ToolError('invalid_arguments','XML不支持文档类型和实体声明');
        const v=Serialize[sources[a.from as keyof typeof sources]](a.text,a.options ?? {});
        if(v.isError())throw new ToolError('invalid_arguments','输入格式无法解析');checkTree(v.content());
        return {text:v[targets[a.to as keyof typeof targets]](a.options ?? {})};
    }
    if(name==='json_query') {
        const v=read(a.text);return {text:Json.stringify(a.language==='jmespath'?jmespath.search(v,a.query):JSONPath({path:a.query,json:v,eval:false,wrap:true}))};
    }
    if(name==='json_schema_validate') {
        const schema=read(a.schema);
        if(schema&&typeof schema==='object'&&schema.$async)throw new ToolError('invalid_arguments','仅支持同步JSON Schema校验');
        const value=read(a.text);const ajv=new Ajv({allErrors:false,strict:true});const validate=ajv.compile(schema);
        return {text:JSON.stringify({valid:validate(value),issues:validate.errors?.map(e=>({path:e.instancePath,keyword:e.keyword,message:e.message})) ?? []})};
    }
    if(name==='json_to_type')return {text:await toType(a.language,a.text,a.options ?? {})};
    if(name==='json_operate') {
        if(a.operation==='repair')return {text:Json.stringify(read(a.text,true),null,a.indent ?? 2)};
        if(a.operation==='escape')return {text:jsonUtil.escape(a.text)};
        if(a.operation==='unescape')return {text:jsonUtil.clearEscape(a.text)};
        if(a.operation==='unicodeDecode')return {text:jsonUtil.unicode2zh(a.text)};
        if(a.operation==='unicodeEncode')return {text:jsonUtil.zh2unicode(a.text)};
        const v=read(a.text);
        return {text:Json.stringify(a.operation==='sortAsc'?jsonUtil.sortAsc(v):a.operation==='sortDesc'?jsonUtil.sortDesc(v):a.operation==='rename'?jsonUtil.rename(v,a.style):v,null,a.operation==='compress'?0:a.indent ?? 2)};
    }
    throw new ToolError('unknown_tool','工具不存在');
}
