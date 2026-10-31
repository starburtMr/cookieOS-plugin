import {Buffer} from "node:buffer";
import {ToolError} from "ctool-tools";
import {generatePasswords} from "ctool-tools/domains/password";
import {convertColor} from "ctool-tools/domains/color";
import {permissionFormat,permissionParse} from "ctool-tools/domains/permission";
import {strictHex} from "ctool-tools/domains/encoding";
import ASN1 from "ctool-tools/asn1/asn1";

export function miscOperation(name:string,a:Record<string,any>) {
    if(name==='password_generate')return {text:JSON.stringify(generatePasswords({length:a.length,amount:1,uppercase:true,lowercase:true,digits:true,symbols:true,excludeAmbiguous:false,ensureEachType:true,...a}))};
    if(name==='color_convert')return {text:convertColor(a.text,a.from,a.to)};
    if(name==='permission_convert') {
        if((typeof a.value==='string')===(Array.isArray(a.matrix)))throw new ToolError('invalid_arguments','请选择权限值或勾选矩阵之一');
        return {text:JSON.stringify(a.value?permissionParse(a.value):permissionFormat(a.matrix,a.special ?? [false,false,false]))};
    }
    if(name==='asn1_parse') {
        const bytes=a.bytes ?? (a.encoding==='base64'?Buffer.from(a.text,'base64'):strictHex(a.text));
        let count=0;
        const node=(value:any,depth=0):unknown=>{if(++count>50000||depth>64)throw new ToolError('input_limit','ASN.1节点过多或层级过深');return {type:value.typeName(),offset:value.stream.pos,header:value.header,length:value.length,content:value.content(256),children:value.sub?.map((v:any)=>node(v,depth+1)) ?? []};};
        return {text:JSON.stringify(node(ASN1.decode(bytes,0)))};
    }
    throw new ToolError('unknown_tool','工具不存在');
}
