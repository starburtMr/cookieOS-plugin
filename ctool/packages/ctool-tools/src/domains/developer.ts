import formatter from "./formatter/index";
import {generate as httpCode} from "./httpSnippet/util";
import {fillSql} from "./sql";
import {composerize} from "composerize-ts";
import {getDiff} from "recursive-diff";
import {UAParser} from "ua-parser-js";
import {ToolError,checkTree} from "./primitives";
import Json from "./json";
import Serialize from "./serialize/index";

export async function developerOperation(name:string,a:Record<string,any>) {
    if(name==='code_transform') {
        if(!formatter.isEnable(a.language,a.operation))throw new ToolError('unsupported_operation','该语言不支持所选处理方式');
        const key=formatter.allLanguageType.find(v=>v.toLowerCase()===a.language.toLowerCase());
        if(!key)throw new ToolError('invalid_arguments','语言不正确');
        return {text:await (await formatter.load(key as Parameters<typeof formatter.load>[0])).set(a.text,a.options).format(a.operation)};
    }
    if(name==='sql_fill')return {text:fillSql(a.text,a.params)};
    if(name==='http_code_convert')return {text:JSON.stringify(httpCode(a.text,a.source,a.target))};
    if(name==='docker_compose_convert')return {text:composerize(a.text).yaml};
    if(name==='ua_parse')return {text:JSON.stringify(new UAParser(a.text).getResult())};
    if(name==='diff_compute') {
        if(a.format==='json') {const old=Json.parse(a.original); const next=Json.parse(a.modified);checkTree(old);checkTree(next);return {text:Json.stringify(getDiff(old,next))};}
        if(a.format==='yaml'||a.format==='toml'||a.format==='xml') {
            const method={yaml:'formYaml',toml:'formToml',xml:'formXml'}[a.format] as 'formYaml';
            const old=Serialize[method](a.original); const next=Serialize[method](a.modified);if(old.isError()||next.isError())throw new ToolError('invalid_arguments','差异内容无法解析');checkTree(old.content());checkTree(next.content());
            return {text:Json.stringify(getDiff(old.content(),next.content()))};
        }
        return {text:JSON.stringify(getDiff(a.original.split(/\r?\n/),a.modified.split(/\r?\n/)))};
    }
    throw new ToolError('unknown_tool','工具不存在');
}
