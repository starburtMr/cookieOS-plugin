import Ajv from "ajv";
import type {AnySchema} from "ajv";
import {Base64} from "js-base64";
import CryptoJS from "crypto-js";
import BigNumber from "bignumber.js";
import {parse, stringify} from "when-json-met-bigint";
import toml from "@ltd/j-toml";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import cron from "cron-parser";
import {v4} from "uuid";
import yaml from "./yaml";

export {yaml};
dayjs.extend(utc);
dayjs.extend(timezone);

export class ToolError extends Error {
    constructor(public code: string, message: string) { super(message); }
}

export const stringSchema = {type: "string", maxLength: 204800};
export const textResult = {type: "object", properties: {text: {type: "string", maxLength: 1048576}}, required: ["text"], additionalProperties: false};
export const objectSchema = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({type: "object", properties, required, additionalProperties: false});
const choice = (...values: string[]) => ({type: "string", enum: values});
const integer = (minimum: number, maximum: number) => ({type: "integer", minimum, maximum});
type Args = Record<string, unknown>;
const str = (args: Args, key = "text") => args[key] as string;

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

const readJson = (text: string) => { const value = parse(text); checkTree(value); return value; };
const sorted = (value: unknown): unknown => Array.isArray(value) ? value.map(sorted) : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sorted(item)])) : value;

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

type Definition = {
    name: string; title: string; description: string; effect: "read";
    inputSchema: ReturnType<typeof objectSchema>; outputSchema: unknown; ai: boolean; mcp: boolean;
};
const handlers = new Map<string, (args: Args) => unknown>();
function define(name: string, title: string, properties: Record<string, unknown>, required: string[], run: (args: Args) => unknown, outputSchema: unknown = textResult): Definition {
    handlers.set(name, run);
    return {name, title, description: title, effect: "read", inputSchema: objectSchema(properties, required), outputSchema, ai: true, mcp: true};
}

export const tools = [
    define("json_format", "JSON 格式化", {text: stringSchema, indent: integer(0, 8), sortKeys: {type: "boolean"}}, ["text"], a => {
        const value = readJson(str(a));
        return {text: stringify(a.sortKeys ? sorted(value) : value, null, (a.indent as number | undefined) ?? 2)};
    }),
    define("json_validate", "JSON 语法校验", {text: stringSchema}, ["text"], a => {
        try { readJson(str(a)); return {valid: true, issues: []}; }
        catch (e) { if (e instanceof ToolError) throw e; return {valid: false, issues: ["JSON 语法不正确，请检查引号、逗号和括号"]}; }
    }, objectSchema({valid: {type: "boolean"}, issues: {type: "array", items: {type: "string"}, maxItems: 10}})),
    define("base64_encode", "Base64 编码", {text: stringSchema}, ["text"], a => ({text: Base64.encode(str(a))})),
    define("base64_decode", "Base64 解码", {text: stringSchema}, ["text"], a => ({text: decodeBase64(str(a))})),
    define("url_encode", "URL 编码", {text: stringSchema, mode: choice("component", "uri")}, ["text"], a => ({text: (a.mode === "uri" ? encodeURI : encodeURIComponent)(str(a))})),
    define("url_decode", "URL 解码", {text: stringSchema, mode: choice("component", "uri")}, ["text"], a => ({text: (a.mode === "uri" ? decodeURI : decodeURIComponent)(str(a))})),
    define("hash_digest", "文本摘要", {text: stringSchema, algorithm: choice("sha256", "sha512", "md5")}, ["text", "algorithm"], a => ({digest: ({sha256: CryptoJS.SHA256, sha512: CryptoJS.SHA512, md5: CryptoJS.MD5}[str(a, "algorithm")]!)(str(a)).toString()}), objectSchema({digest: {type: "string", pattern: "^[a-f0-9]+$"}})),
    define("time_convert", "时间转换", {value: stringSchema, from: choice("iso", "seconds", "milliseconds"), timezone: stringSchema}, ["value", "from", "timezone"], a => {
        const zone = str(a, "timezone"); new Intl.DateTimeFormat("en", {timeZone: zone}).format();
        const value = str(a, "value");
        let date: ReturnType<typeof dayjs>;
        if (a.from === "iso") {
            if (!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value)) throw new ToolError("invalid_arguments", "ISO 时间需要明确时区");
            const calendar = new Date(value.slice(0, 10) + "T00:00:00.000Z");
            if (!Number.isFinite(calendar.valueOf()) || calendar.toISOString().slice(0, 10) !== value.slice(0, 10)) throw new ToolError("invalid_arguments", "日期不存在，请检查年月日");
            date = dayjs(value);
        } else {
            if (!/^-?\d+$/.test(value)) throw new ToolError("invalid_arguments", "时间戳需要是整数");
            const n = BigInt(value) * (a.from === "seconds" ? 1000n : 1n);
            if (n > 8640000000000000n || n < -8640000000000000n) throw new ToolError("invalid_arguments", "时间超出支持范围");
            date = dayjs(Number(n));
        }
        if (!date.isValid()) throw new ToolError("invalid_arguments", "时间格式不正确");
        return {iso: date.tz(zone).format("YYYY-MM-DDTHH:mm:ss.SSSZ"), seconds: String(Math.floor(date.valueOf() / 1000)), milliseconds: String(date.valueOf())};
    }, objectSchema({iso: stringSchema, seconds: stringSchema, milliseconds: stringSchema})),
    define("radix_convert", "整数进制转换", {value: {type: "string", maxLength: 8192}, fromBase: integer(2, 36), toBase: integer(2, 36)}, ["value", "fromBase", "toBase"], a => {
        if (!/^-?[0-9a-z]+$/i.test(str(a, "value"))) throw new ToolError("invalid_arguments", "请输入整数");
        return {value: convertRadix(str(a, "value"), a.fromBase as number, a.toBase as number)};
    }, objectSchema({value: stringSchema})),
    define("cron_parse", "Cron 下次执行时间", {expression: {type: "string", maxLength: 1000}, timezone: stringSchema, count: integer(1, 20), currentDate: stringSchema}, ["expression", "timezone", "currentDate"], a => {
        const current = str(a, "currentDate");
        if (!/(Z|[+-]\d\d:\d\d)$/.test(current) || !Number.isFinite(Date.parse(current))) throw new ToolError("invalid_arguments", "当前时间需要有效的 ISO 时间与时区");
        new Intl.DateTimeFormat("en", {timeZone: str(a, "timezone")}).format();
        const expression = cron.parseExpression(str(a, "expression"), {tz: str(a, "timezone"), currentDate: current});
        return {dates: Array.from({length: (a.count as number | undefined) ?? 5}, () => expression.next().toISOString())};
    }, objectSchema({dates: {type: "array", items: stringSchema, maxItems: 20}})),
    define("text_process", "文本处理", {text: stringSchema, operation: choice("trim", "upper", "lower", "deduplicateLines")}, ["text", "operation"], a => {
        const text = str(a); return {text: a.operation === "trim" ? text.trim() : a.operation === "upper" ? text.toUpperCase() : a.operation === "lower" ? text.toLowerCase() : [...new Set(text.split(/\r?\n/))].join("\n")};
    }),
    define("config_convert", "JSON YAML TOML 转换", {text: stringSchema, from: choice("json", "yaml", "toml"), to: choice("json", "yaml", "toml")}, ["text", "from", "to"], a => {
        const value = a.from === "json" ? readJson(str(a)) : a.from === "yaml" ? yaml.load(str(a)) : toml.parse(str(a));
        checkTree(value);
        return {text: a.to === "json" ? stringify(value, null, 2) : a.to === "yaml" ? yaml.dump(value) : toml.stringify(value as Parameters<typeof toml.stringify>[0], {newline: "\n", integer: Number.MAX_SAFE_INTEGER})};
    }),
    define("url_parse", "URL 结构解析", {text: stringSchema}, ["text"], a => {
        const u = new URL(str(a)); return {protocol: u.protocol, hostname: u.hostname, port: u.port, pathname: u.pathname, query: [...u.searchParams].map(([name, value]) => ({name, value})), fragment: u.hash};
    }, objectSchema({protocol: stringSchema, hostname: stringSchema, port: stringSchema, pathname: stringSchema, query: {type: "array", items: objectSchema({name: stringSchema, value: stringSchema}), maxItems: 10000}, fragment: stringSchema})),
    define("uuid_generate", "UUID v4 生成", {count: integer(1, 100)}, [], a => ({values: Array.from({length: (a.count as number | undefined) ?? 1}, () => v4())}), objectSchema({values: {type: "array", items: {type: "string", pattern: "^[a-f0-9-]{36}$"}, maxItems: 100}})),
];

const ajv = new Ajv({allErrors: false, strict: true});
const validators = new Map(tools.map(t => [t.name, {input: ajv.compile(t.inputSchema), output: ajv.compile(t.outputSchema as AnySchema)}]));
export function invokePure(name: string, args: unknown) {
    const validator = validators.get(name);
    if (!validator || !validator.input(args)) throw new ToolError("invalid_arguments", "工具或参数不正确，请检查输入");
    try {
        const result = handlers.get(name)!(args as Args);
        if (!validator.output(result) || new TextEncoder().encode(JSON.stringify(result)).length > 1048576) throw new ToolError("output_limit", "结果过大或格式不正确，请减少输入");
        return result;
    } catch (e) {
        if (e instanceof ToolError) throw e;
        throw new ToolError("invalid_arguments", "内容无法处理，请检查格式与参数");
    }
}
