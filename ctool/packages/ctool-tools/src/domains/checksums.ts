import crc from "crc";
import {ToolError} from "./primitives";
export const crcAlgorithms=Object.keys(crc).filter(key=>typeof crc[key as keyof typeof crc]==="function");
export function checksumBytes(bytes:Uint8Array,algorithm:string) {
    let n=0;
    if(algorithm==='bcc'){for(const b of bytes)n^=b;return n;}
    if(algorithm==='lrc'){for(const b of bytes)n+=b;return (-n)&255;}
    const fn=crc[algorithm as keyof typeof crc];if(typeof fn!=='function')throw new ToolError('invalid_arguments','校验算法不正确');
    return fn(bytes);
}
