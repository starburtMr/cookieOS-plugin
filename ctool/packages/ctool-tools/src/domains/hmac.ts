import CryptoJS from "crypto-js";
import sm from "sm-crypto";
import {Base64} from "js-base64";
import {Buffer} from "buffer";

export const methods = ["md5", "sha1", "sha256", "sha512", "sm3", "ripemd160"] as const;

export type methodType = typeof methods[number]

const hmacMethod = {
    md5: (message: Uint8Array, secret: Uint8Array): string => {
        return CryptoJS.HmacMD5(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message)), CryptoJS.enc.Base64.parse(Base64.fromUint8Array(secret))).toString();
    },
    sha1: (message: Uint8Array, secret: Uint8Array): string => {
        return CryptoJS.HmacSHA1(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message)), CryptoJS.enc.Base64.parse(Base64.fromUint8Array(secret))).toString();
    },
    sha256: (message: Uint8Array, secret: Uint8Array): string => {
        return CryptoJS.HmacSHA256(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message)), CryptoJS.enc.Base64.parse(Base64.fromUint8Array(secret))).toString();
    },
    sha512: (message: Uint8Array, secret: Uint8Array): string => {
        return CryptoJS.HmacSHA512(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message)), CryptoJS.enc.Base64.parse(Base64.fromUint8Array(secret))).toString();
    },
    sm3: (message: Uint8Array, secret: Uint8Array): string => {
        // The installed library accepts byte views; avoid a Hex round trip.
        // @ts-ignore old upstream declarations omit byte-array HMAC input.
        return sm.sm3(message, {key: Buffer.from(secret).toString("hex")});
    },
    ripemd160: (message: Uint8Array, secret: Uint8Array): string => {
        return CryptoJS.HmacRIPEMD160(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message)), CryptoJS.enc.Base64.parse(Base64.fromUint8Array(secret))).toString();
    },
};


export default (type: methodType, input: Uint8Array, secret: Uint8Array, provider?: (input:Uint8Array,key:Uint8Array)=>string): string => {
    if (!Object.keys(hmacMethod).includes(type)) {
        throw new Error(`hmac method 不存在: ${type}`);
    }
    return provider ? provider(input,secret) : hmacMethod[type](input, secret);
}
