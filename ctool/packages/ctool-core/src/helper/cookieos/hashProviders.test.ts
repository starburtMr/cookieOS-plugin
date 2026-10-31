import {describe,it,expect} from "vitest";
import {createHash,createHmac} from "node:crypto";
import hash,{methods as hashes} from "ctool-tools/domains/hash";
import hmac,{methods as hmacs} from "ctool-tools/domains/hmac";
const bytes=new TextEncoder().encode("Ctool 中文\0😀");
const key=new TextEncoder().encode("密钥");
describe("browser and server cryptographic providers",()=>{
    for(const method of hashes)it(method+" matches for bytes and salt expressions",()=>{
        const native=(input:Uint8Array)=>createHash(method).update(input).digest("hex");
        for(const expression of ["","hash(hash($input.$salt).$salt)"])
            expect(hash(method,bytes,"盐",expression)).toBe(hash(method,bytes,"盐",expression,"utf-8",native));
    });
    for(const method of hmacs)it("HMAC "+method+" matches for UTF8 keys",()=>{
        expect(hmac(method,bytes,key)).toBe(createHmac(method,key).update(bytes).digest("hex"));
    });
});
