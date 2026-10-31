import {stringSchema as s} from "ctool-tools";
import {withTextOrFile,definition,choice,boolean,integer,fileRef} from "./definitions";
export const miscTools=[
    definition("password_generate","生成安全随机密码；返回JSON数组文本",{length:integer(1,4096),amount:integer(1,1000),uppercase:boolean,lowercase:boolean,digits:boolean,symbols:boolean,excludeAmbiguous:boolean,ensureEachType:boolean},["length"]),
    definition("color_convert","颜色模型与名称转换",{text:{type:"string",maxLength:4096},from:choice("name","hex","rgb","hsl","hwb","cmyk","lch","hsv","lab","xyz"),to:choice("name","hex","rgb","hsl","hwb","cmyk","lch","hsv","lab","xyz")},["text","from","to"]),
    definition("permission_convert","权限数字、符号与勾选表示互转；不修改文件",{value:{type:"string",maxLength:9},matrix:{type:"array",minItems:3,maxItems:3,items:{type:"array",items:boolean,minItems:3,maxItems:3}},special:{type:"array",minItems:3,maxItems:3,items:boolean}},[]),
    withTextOrFile(definition("asn1_parse","ASN.1节点解析；返回JSON节点、类型、偏移和长度",{fileRef,text:s,encoding:choice("hex","base64")},[])),
];
