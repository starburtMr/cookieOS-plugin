import {Base64} from "js-base64";
import BigNumber from "bignumber.js";

export class ToolError extends Error {
    constructor(public code: string, message: string) { super(message); }
}

export function checkTree(value: unknown) {
    const pending: [unknown, number][] = [[value, 0]];
    let nodes = 0;
    while (pending.length) {
        const [item, depth] = pending.pop()!;
        if (++nodes > 50000 || depth > 64) throw new ToolError("input_limit", "内容层级或数量超过上限，请减少内容");
        if (typeof item === "number" && !Number.isFinite(item)) throw new ToolError("invalid_arguments", "非有限数值无法转换，请检查内容");
        if (item && typeof item === "object") for (const entry of Object.values(item)) pending.push([entry, depth + 1]);
    }
}

export function decodeBase64Bytes(text: string) {
    if (!Base64.isValid(text)) throw new ToolError("invalid_arguments", "Base64 格式不正确，请检查输入");
    return Base64.toUint8Array(text);
}

export function decodeBase64(text: string) {
    return new TextDecoder("utf-8", {fatal: true}).decode(decodeBase64Bytes(text));
}

export const defaultAlphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_@";
export function convertRadix(value: string | number, source: number, target: number, alphabet = defaultAlphabet) {
    if (String(value).length > 8192) throw new ToolError("input_limit", "数值过长，请减少位数");
    const BN = BigNumber.clone({ALPHABET: alphabet, EXPONENTIAL_AT: 1e9});
    const input = source <= 36 ? `${value}`.toLowerCase() : `${value}`;
    const result = new BN(input, source);
    if (!result.isFinite()) throw new ToolError("invalid_arguments", "数值或进制不正确，请检查输入");
    return result.toString(target);
}
