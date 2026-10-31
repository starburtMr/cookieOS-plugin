import {Base64} from "js-base64";
import bs58 from "bs58";
import punycode from "punycode/";
import html from "js-htmlencode";
import pako from "pako";
import {checksumBytes} from "./checksums";
import {Buffer} from "buffer";
import decodeUriComponent from "decode-uri-component";
import Uint from "./uint";
import {encodeBase32, decodeBase32} from "./base32";
import unicode from "./unicode";
import {convent as ascii} from "./ascii";
import {ToolError} from "./primitives";

export function encodeText(text: string, encoding: "utf-8" | "gbk" = "utf-8") { return Uint.fromString(text).to(encoding).uint8Array; }
export function decodeText(bytes: Uint8Array, encoding = "utf-8") { return new TextDecoder(encoding, {fatal: true}).decode(bytes); }
export function strictHex(text: string) {
    text = text.replace(/\\x|\s/g, "");
    if (!/^(?:[a-f0-9]{2})*$/i.test(text)) throw new ToolError("invalid_arguments", "Hex 格式不正确");
    return Uint8Array.from(text.match(/../g) || [], v => parseInt(v, 16));
}
export function compressionBytes(input:Uint8Array,decode:boolean,deflate=false) {
    const stream=decode?new pako.Inflate({chunkSize:65536}):new pako.Deflate({gzip:!deflate,chunkSize:65536});
    let size=0;const parts:Uint8Array[]=[];
    stream.onData=chunk=>{const part=chunk as Uint8Array;size+=part.length;if(size>8388608)throw new ToolError('output_limit','压缩或解压结果超过8 MiB');parts.push(part);};
    stream.push(input,true);if(stream.err)throw new ToolError('invalid_arguments','压缩数据不正确');
    const output=new Uint8Array(size);let offset=0;for(const part of parts){output.set(part,offset);offset+=part.length;}return output;
}
export function transformEncoding(name: string, a: Record<string, any>) {
    let bytes: Uint8Array = a.bytes ?? encodeText(a.text ?? "", a.encoding);
    const decode = a.operation === "decode";
    if(a.bytes && decode && name!=='gzip_transform')a={...a,text:decodeText(a.bytes)};
    if(name==='gzip_transform'&&decode&&!a.bytes){if(!Base64.isValid(a.text))throw new ToolError('invalid_arguments','请输入有效Base64压缩数据');bytes=Base64.toUint8Array(a.text);}
    let value: string | Uint8Array;
    switch (name) {
        case "base64_transform":
            if (decode && !Base64.isValid(a.text)) throw new ToolError("invalid_arguments", "Base64 格式不正确");
            value = decode ? Base64.toUint8Array(a.text) : Base64.fromUint8Array(bytes, a.urlSafe ?? false); break;
        case "base32_transform": value = decode ? decodeBase32(a.text) : encodeBase32(bytes); break;
        case "base58_transform": value = decode ? bs58.decode(a.text) : bs58.encode(bytes); break;
        case "hex_transform": value = decode ? strictHex(a.text) : Buffer.from(bytes).toString("hex"); if (a.uppercase && typeof value === "string") value = value.toUpperCase(); break;
        case "unicode_transform": return {text: unicode[decode ? "decode" : "encode"](a.text, a.format)};
        case "url_transform": return {text: (decode ? a.mode === "uri" ? decodeURI : a.tolerant ? decodeUriComponent : decodeURIComponent : a.mode === "uri" ? encodeURI : encodeURIComponent)(a.text)};
        case "html_entities": return {text: html[decode ? "htmlDecode" : "htmlEncode"](a.text)};
        case "punycode_transform": return {text: punycode[decode ? "toUnicode" : "toASCII"](a.text)};
        case "ascii_lookup": return {text: ascii(a.text, a.from ?? "str", a.to ?? "dec")};
        case "checksum_compute": {
            const n=checksumBytes(bytes,a.algorithm);
            let text = n.toString(a.radix ?? 16);
            if ((a.radix ?? 16) === 16) { text = text.padStart(Math.ceil(text.length / 2) * 2,"0"); if (a.endian === "little") text = text.match(/../g)!.reverse().join(""); }
            return {value: n, text: a.uppercase ? text.toUpperCase() : text};
        }
        case "gzip_transform": {
            value=compressionBytes(bytes,decode,a.format==='deflate');break;
        }
        default: throw new ToolError("unknown_tool", "工具不存在");
    }
    return typeof value === "string" ? {text:value} : a.output === "text" ? {text:decodeText(value,a.encoding)} : {bytes:value, mime:"application/octet-stream"};
}
