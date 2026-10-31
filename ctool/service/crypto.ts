import {publicEncrypt,privateDecrypt,constants,generateKeyPairSync,createSign,createVerify,createHash,createHmac} from "node:crypto";
import {Buffer} from "node:buffer";
import {ToolError,checkTree,decodeBase64Bytes} from "ctool-tools";
import {encodeText,decodeText,strictHex} from "ctool-tools/domains/encoding";
import hash from "ctool-tools/domains/hash";
import hmac from "ctool-tools/domains/hmac";
import {aes,des,tripleDES,rc4,rabbit} from "ctool-tools/domains/cipher";
import {Base64} from "js-base64";
import bcrypt from "bcryptjs";
import sm from "sm-crypto";
import rs from "jsrsasign";

export function cryptoOperation(name: string,a: Record<string,any>) {
    const bytes: Uint8Array=a.bytes ?? encodeText(a.text ?? "",a.encoding);
    const binary=(value:Uint8Array)=>a.output==='text'?{text:decodeText(value,a.encoding)}:{bytes:value,mime:'application/octet-stream'};
    if(name==='hash_compute') {
        const compute=(v:Uint8Array)=>{const value=hash(a.algorithm,v,a.salt ?? '',a.expression ?? '',a.encoding,bytes=>createHash(a.algorithm).update(bytes).digest('hex'));return a.uppercase?value.toUpperCase():value;};
        return {text:a.lines?decodeText(bytes,a.encoding).split(/\r?\n/).map((v:string)=>compute(encodeText(v,a.encoding))).join('\n'):compute(bytes)};
    }
    if(name==='hmac_compute'){const value=hmac(a.algorithm,bytes,a.keyEncoding==='hex'?strictHex(a.secret):a.keyEncoding==='base64'?decodeBase64Bytes(a.secret):encodeText(a.secret,a.keyEncoding),(input,key)=>createHmac(a.algorithm,key).update(input).digest('hex'));return {text:a.uppercase?value.toUpperCase():value};}
    if(['aes_crypt','des_crypt','triple_des_crypt','rc4_crypt','rabbit_crypt'].includes(name)){
        const cipher={aes_crypt:aes,des_crypt:des,triple_des_crypt:tripleDES,rc4_crypt:rc4,rabbit_crypt:rabbit}[name]!;
        const options={...a,key:a.secret};
        if(a.operation==='encrypt'){const value=cipher.encrypt(Base64.fromUint8Array(bytes),options);return a.output==='bytes'?{bytes:Base64.toUint8Array(value),mime:'application/octet-stream'}:{text:value};}
        return binary(Base64.toUint8Array(cipher.decrypt(a.bytes?Base64.fromUint8Array(a.bytes):a.text,options)));
    }
    if(name==='bcrypt_hash') {
        const salt=bcrypt.genSaltSync(a.rounds ?? 10).replace('$2a$',`$${a.version ?? '2b'}$`);
        return {text:bcrypt.hashSync(a.text,salt)};
    }
    if(name==='bcrypt_verify')return {text:JSON.stringify({matches:bcrypt.compareSync(a.text,a.hash)})};
    if(name==='rsa_crypt') {
        const options={key:a.secret,padding:a.padding==='pkcs1'?constants.RSA_PKCS1_PADDING:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:a.oaepHash ?? 'sha1'};
        return a.operation==='encrypt'?binary(publicEncrypt(options,bytes)):binary(privateDecrypt(options,bytes));
    }
    if(name==='signature_sign') {
        const signer=createSign(a.algorithm.replace('withRSA',''));signer.update(bytes);
        return {text:signer.sign(a.secret,a.signatureEncoding ?? 'hex')};
    }
    if(name==='signature_verify') {
        const verifier=createVerify(a.algorithm.replace('withRSA',''));verifier.update(bytes);
        return {text:JSON.stringify({valid:verifier.verify(a.secret,Buffer.from(a.signature,a.signatureEncoding ?? 'hex'))})};
    }
    if(name==='key_pair_generate'){const pair=generateKeyPairSync('rsa',{modulusLength:a.bits ?? 2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:a.format ?? 'pkcs8',format:'pem'}});return {publicKey:pair.publicKey,privateKeyBytes:Buffer.from(pair.privateKey)};}
    if(name==='sm2_crypt')return a.operation==='encrypt'?binary(strictHex(sm.sm2.doEncrypt(Array.from(bytes),a.secret,a.mode ?? 1))):binary(Uint8Array.from(sm.sm2.doDecrypt(Buffer.from(bytes).toString('hex'),a.secret,a.mode ?? 1,{output:'array'}) as unknown as number[]));
    if(name==='sm2_sign')return {text:sm.sm2.doSignature(Array.from(bytes),a.secret,{hash:true,der:a.der ?? true,userId:a.userId})};
    if(name==='sm2_verify')return {text:JSON.stringify({valid:sm.sm2.doVerifySignature(Array.from(bytes),a.signature,a.secret,{hash:true,der:a.der ?? true,userId:a.userId})})};
    if(name==='sm4_crypt') {
        if(!/^[a-f0-9]{32}$/i.test(a.secret))throw new ToolError('configuration_required','SM4密钥需要32位Hex');
        return binary(Uint8Array.from(sm.sm4[a.operation as 'encrypt'|'decrypt'](Array.from(bytes),a.secret,{mode:a.mode==='cbc'?'cbc':undefined,iv:a.iv,padding:a.padding===false?'none':'pkcs#5',output:'array'}) as unknown as number[]));
    }
    if(name==='jwt_decode') {
        const parts=a.text.split('.');if(parts.length!==3)throw new ToolError('invalid_arguments','JWT格式不正确');
        const header=JSON.parse(decodeText(Base64.toUint8Array(parts[0])));const payload=JSON.parse(decodeText(Base64.toUint8Array(parts[1])));checkTree(header);checkTree(payload);
        return {text:JSON.stringify({header,payload,verified:false})};
    }
    if(name==='jwt_sign') {
        const header=JSON.parse(a.header ?? '{}');const payload=JSON.parse(a.payload);checkTree(header);checkTree(payload);
        return {text:rs.KJUR.jws.JWS.sign(a.algorithm,JSON.stringify({...header,typ:header.typ ?? 'JWT',alg:a.algorithm}),JSON.stringify(payload),a.secret)};
    }
    throw new ToolError('unknown_tool','工具不存在');
}
