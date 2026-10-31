import {objectSchema,stringSchema as s} from "ctool-tools";
import {withTextOrFile,definition,choice,boolean,fileRef} from "./definitions";
import {textMethods} from "ctool-tools/domains/textOperations";

const strings={type:"array",items:s,maxItems:1000};
export const textTools=[
    withTextOrFile(definition("text_operate","文本处理；stat 返回 JSON 文本",{text:s,fileRef,operation:choice(...textMethods),options:objectSchema({type:{type:"string",maxLength:64},search:{anyOf:[s,strings]},replace:{anyOf:[s,strings]},lists:{type:"array",items:choice("backslash","single_quote","double_quote","new_line","carriage_return","tab","vertical_tab","backspace","form_feed"),maxItems:9}},[])},["operation"])),
    definition("name_convert","变量命名风格转换",{text:s,style:choice("spaceCase","pascalCaseSpace","kebabCase","upperSnakeCase","pascalCase","camelCase","lowerSnakeCase")},["text","style"]),
    definition("pinyin_convert","中文转拼音",{text:s,delimiter:{type:"string",maxLength:40},options:objectSchema({pattern:choice("pinyin","initial","final","num","first"),tone:choice("symbol","num","none"),replace_v:boolean,multiple_flag:boolean},[])},["text"]),
    definition("zh_number_convert","中文数字和金额转换（不支持金额反解）",{text:s,from:choice("number","lower","upper"),to:choice("number","lower","upper","money"),traditional:boolean},["text","from","to"]),
    withTextOrFile(definition("stacktrace_parse","异常调用栈解析；返回 JSON 文本",{text:s,fileRef},[])),
    withTextOrFile(definition("regex_execute","有界正则匹配、提取、替换；匹配返回 JSON 文本",{text:s,fileRef,pattern:{type:"string",maxLength:4096},flags:{type:"string",pattern:"^[gimsuy]*$",maxLength:6},operation:choice("match","extract","replace","delete"),replacement:s},["pattern","operation"])),
];
