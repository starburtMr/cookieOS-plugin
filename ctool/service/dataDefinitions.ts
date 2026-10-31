import {objectSchema,stringSchema as s} from "ctool-tools";
import {withTextOrFile,definition,choice,integer,boolean,fileRef} from "./definitions";
const formats=choice("json","yaml","toml","xml","csv","html_table","php_array","php_serialize","properties","http_query_string","text");
const options=objectSchema({type:choice("row_object","row_array","column_array","keyed"),keyed_key:integer(0,1000),quoted:boolean,header:boolean,attribute_prefix:{type:"string",maxLength:40},convertToJsonTree:boolean,delimiter:{type:"string",maxLength:128},is_add_quote:boolean},[]);
export const dataTools=[
    withTextOrFile(definition("msgpack_transform","MessagePack编码或解码；解码返回JSON文本，二进制有类型标记",{text:s,fileRef,operation:choice("encode","decode")},["operation"])),
    withTextOrFile(definition("json_operate","JSON格式化、修复、转义、Unicode、键排序与命名",{text:s,fileRef,operation:choice("format","compress","repair","escape","unescape","unicodeDecode","unicodeEncode","sortAsc","sortDesc","rename"),indent:integer(0,8),style:choice("spaceCase","pascalCaseSpace","kebabCase","upperSnakeCase","pascalCase","camelCase","lowerSnakeCase")},["operation"])),
    withTextOrFile(definition("json_query","JSONPath安全查询或JMESPath；返回JSON文本",{text:s,fileRef,query:{type:"string",maxLength:4096},language:choice("jsonpath","jmespath")},["query","language"])),
    withTextOrFile(definition("json_schema_validate","JSON Schema draft7校验；不加载外部引用",{text:s,fileRef,schema:s},["schema"])),
    definition("json_transform","QuickJS表达式转换；变量data与lodash _；返回JSON文本",{text:s,expression:{type:"string",maxLength:4096}},["text","expression"]),
    definition("json_to_type","从JSON生成实体类型",{text:s,language:{type:"string",maxLength:80},options:{type:"object",maxProperties:50,additionalProperties:{anyOf:[{type:"string",maxLength:1000},{type:"boolean"},{type:"number"}]}}},["text","language"]),
    ...["serialize_transform","config_transform"].map(name=>withTextOrFile(definition(name,"结构化格式转换；不能表示的类型明确失败",{text:s,fileRef,from:formats,to:formats,options},["from","to"]))),
];
