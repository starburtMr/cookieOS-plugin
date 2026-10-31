import forge from "node-forge";

function pem(value:string) {
    if(!value.trim()||value.length>32768)throw new Error('RSA密钥为空或过长');
    return value.trim();
}
const scheme=(algorithm:string)=>algorithm==='RSA'?'RSAES-PKCS1-V1_5':'RSA-OAEP';
export function rsaBrowserEncrypt(text:string,key:string,algorithm:string):Uint8Array {
    if(new TextEncoder().encode(text).length>8192)throw new Error('RSA输入过长，请减少内容');
    const encrypted:string=forge.pki.publicKeyFromPem(pem(key)).encrypt(forge.util.encodeUtf8(text),scheme(algorithm));
    return Uint8Array.from(encrypted,c=>c.charCodeAt(0));
}
export function rsaBrowserDecrypt(bytes:Uint8Array,key:string,algorithm:string):string {
    if(bytes.length>16384)throw new Error('RSA密文过长，请检查输入');
    const encrypted=Array.from(bytes,b=>String.fromCharCode(b)).join('');
    return forge.util.decodeUtf8(forge.pki.privateKeyFromPem(pem(key)).decrypt(encrypted,scheme(algorithm)));
}
