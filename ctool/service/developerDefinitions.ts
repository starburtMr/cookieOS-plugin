import {objectSchema,stringSchema as s} from "ctool-tools";
import {withTextOrFile,definition,choice,integer,boolean,fileRef} from "./definitions";
export const developerTools=[
    withTextOrFile(definition("code_transform","现有15种语言格式化/支持的压缩",{text:s,fileRef,language:choice("javascript","json","typescript","markdown","css","less","scss","yaml","html","xml","php","java","sql","vue","graphql"),operation:choice("beautify","compress"),options:objectSchema({tab:integer(1,8),singleQuote:boolean,semi:boolean,language:{type:"string",maxLength:64}},[])},["language","operation"])),
    definition("sql_fill","MyBatis类型参数填充；不执行SQL，结果会格式化",{text:s,params:s},["text","params"]),
    definition("http_code_convert","cURL或HAR转语言客户端代码；不发送请求",{text:s,source:choice("cURL","HAR"),target:{type:"string",maxLength:80}},["text","source","target"]),
    definition("docker_compose_convert","Docker命令文本转Compose；不运行容器",{text:s},["text"]),
    definition("ua_parse","指定User-Agent解析；返回JSON文本",{text:s},["text"]),
    definition("diff_compute","文本行或结构化差异；返回JSON增删改与路径",{original:s,modified:s,format:choice("text","json","yaml","toml","xml")},["original","modified"]),
];
