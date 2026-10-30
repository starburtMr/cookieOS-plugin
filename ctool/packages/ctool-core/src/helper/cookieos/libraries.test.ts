import {secureRandomInt, checkRandomSize} from "./random";
import {describe,expect,it} from "vitest";
import sm from "sm-crypto";
import CryptoJS from "crypto-js";
import {UAParser} from "ua-parser-js";
import {parse} from "csv-parse/browser/esm/sync";
import {evaluate} from "mathjs";
import {KEYUTIL, KJUR} from "jsrsasign";

describe("patched dependency compatibility",()=>{
    it("round trips SM2 text and verifies signatures, rejecting altered text",()=>{
        const pair=sm.sm2.generateKeyPairHex();
        const text="cookieOS 中文";
        expect(sm.sm2.doDecrypt(sm.sm2.doEncrypt(text,pair.publicKey),pair.privateKey)).toBe(text);
        const signature=sm.sm2.doSignature(text,pair.privateKey,{hash:true});
        expect(sm.sm2.doVerifySignature(text,signature,pair.publicKey,{hash:true})).toBe(true);
        expect(sm.sm2.doVerifySignature(text+"!",signature,pair.publicKey,{hash:true})).toBe(false);
    });
    it("keeps the fixed AES CBC byte-key contract",()=>{
        const key=CryptoJS.enc.Hex.parse("000102030405060708090a0b0c0d0e0f");
        const iv=CryptoJS.enc.Hex.parse("101112131415161718191a1b1c1d1e1f");
        const encrypted=CryptoJS.AES.encrypt("hello",key,{iv});
        expect(CryptoJS.AES.decrypt(encrypted.toString(),key,{iv}).toString(CryptoJS.enc.Utf8)).toBe("hello");
    });
    it("supports RSA SHA256 signing without accepting altered messages",()=>{
        const pair=KEYUTIL.generateKeypair("RSA",1024);
        const sign=new KJUR.crypto.Signature({alg:"SHA256withRSA"});sign.init(pair.prvKeyObj);sign.updateString("sample");const signature=sign.sign();
        const verify=new KJUR.crypto.Signature({alg:"SHA256withRSA"});verify.init(pair.pubKeyObj);verify.updateString("altered");expect(verify.verify(signature)).toBe(false);
    });
    it("preserves UA fields, quoted CSV and calculator units",()=>{
        const result=new UAParser("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36").getResult();
        expect(result.browser.name).toBe("Chrome");expect(result.os.name).toBe("Windows");
        expect(parse('name,note\nAda,"hello, world"',{columns:true})).toEqual([{name:"Ada",note:"hello, world"}]);
        expect(evaluate("2 inch to cm").toString()).toBe("5.08 cm");
    });
});

it("bounds random generation and uses the browser CSPRNG range",()=>{
    expect(secureRandomInt(1)).toBe(0);
    expect(()=>secureRandomInt(0)).toThrow();
    expect(()=>checkRandomSize(4096,1000)).toThrow();
    expect(()=>checkRandomSize(1,-1)).toThrow();
    expect(()=>checkRandomSize(32,10)).not.toThrow();
});
