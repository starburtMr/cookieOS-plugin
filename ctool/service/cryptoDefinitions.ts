import {objectSchema,stringSchema as s} from "ctool-tools";
import {withTextOrFile,definition,choice,integer,boolean,fileRef,fileInfo} from "./definitions";
const keyRef={type:"string",pattern:"^[a-zA-Z0-9_-]{1,80}$"};
const input={text:s,fileRef,encoding:choice("utf-8","gbk")};
const byteInput={...input,output:choice("text","bytes")};
const cipher={...byteInput,operation:choice("encrypt","decrypt"),keyRef,iv:{type:"string",maxLength:128},mode:choice("ECB","CBC","CTR","OFB","CFB"),padding:choice("Pkcs7","Iso97971","AnsiX923","Iso10126","ZeroPadding","NoPadding"),fill:boolean,type:choice("simple","advanced")};
const signature={...input,keyRef,signature:{type:"string",maxLength:32768},algorithm:choice("SHA1withRSA","SHA256withRSA","SHA384withRSA","SHA512withRSA","MD5withRSA"),signatureEncoding:choice("hex","base64")};
export const cryptoTools=[
    withTextOrFile(definition("hash_compute","摘要五算法、盐值模板、逐行；弱算法仅用于兼容",{...input,algorithm:choice("md5","sha1","sha256","sha512","sm3"),salt:{type:"string",maxLength:4096},expression:{type:"string",maxLength:4096},uppercase:boolean,lines:boolean},["algorithm"])),
    ...["aes","des","triple_des","rc4","rabbit"].map(name=>withTextOrFile(definition(name+"_crypt",name+"兼容加解密；密钥来自秘密配置keys引用",["rc4","rabbit"].includes(name)?{...byteInput,operation:choice("encrypt","decrypt"),keyRef}:{...cipher,...(name==="aes"?{key_size:choice("128","192","256")}:{})},["operation","keyRef"]))),
    withTextOrFile(definition("hmac_compute","HMAC；密钥来自秘密配置keys引用",{...input,keyRef,algorithm:choice("md5","sha1","sha256","sha512","sm3","ripemd160"),keyEncoding:choice("utf-8","gbk","hex","base64"),uppercase:boolean},["algorithm","keyRef"])),
    withTextOrFile(definition("rsa_crypt","RSA PKCS1/OAEP加解密；秘密配置PEM引用",{...byteInput,keyRef,operation:choice("encrypt","decrypt"),padding:choice("pkcs1","oaep"),oaepHash:choice("sha1","sha256","sha384","sha512")},["operation","keyRef"])),
    withTextOrFile(definition("signature_sign","RSA签名；秘密配置私钥引用",signature,["keyRef","algorithm"])),
    withTextOrFile(definition("signature_verify","RSA验签；秘密配置公钥引用",signature,["keyRef","algorithm","signature"])),
    definition("key_pair_generate","生成RSA密钥对；结果含私钥，请妥善保存",{bits:{type:"integer",enum:[512,1024,2048,3072,4096]},format:choice("pkcs1","pkcs8")},[],objectSchema({publicKey:s,privateKey:fileInfo}),"dangerous",60),
    withTextOrFile(definition("sm2_crypt","SM2加解密；秘密配置密钥引用",{...byteInput,keyRef,operation:choice("encrypt","decrypt"),mode:{type:"integer",enum:[0,1]}},["operation","keyRef"])),
    withTextOrFile(definition("sm2_sign","SM2签名；秘密配置私钥引用",{...input,keyRef,userId:{type:"string",maxLength:128},der:boolean},["keyRef"])),
    withTextOrFile(definition("sm2_verify","SM2验签；秘密配置公钥引用",{...input,keyRef,userId:{type:"string",maxLength:128},der:boolean,signature:{type:"string",pattern:"^[a-fA-F0-9]+$",maxLength:1024}},["keyRef","signature"])),
    withTextOrFile(definition("sm4_crypt","SM4加解密；秘密配置Hex密钥引用",{...byteInput,keyRef,operation:choice("encrypt","decrypt"),padding:boolean,mode:choice("ecb","cbc"),iv:{type:"string",pattern:"^[a-fA-F0-9]{32}$"}},["operation","keyRef"])),
    definition("bcrypt_hash","Bcrypt哈希（默认10轮；超时可取消）",{text:{type:"string",maxLength:8192},rounds:integer(4,30),version:choice("2a","2b","2y")},["text"],undefined,"read",30),
    definition("bcrypt_verify","Bcrypt比对",{text:{type:"string",maxLength:8192},hash:{type:"string",pattern:"^\\$2[aby]\\$(?:0[4-9]|[12]\\d|30)\\$[./a-zA-Z0-9]{53}$"}},["text","hash"]),
    definition("jwt_decode","解析JWT（不验签）；返回JSON文本",{text:s},["text"]),
    definition("jwt_sign","HS系列JWT签名；秘密配置密钥引用",{header:s,payload:s,keyRef,algorithm:choice("HS256","HS384","HS512")},["payload","keyRef","algorithm"]),
];
