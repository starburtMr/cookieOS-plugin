import {ToolError, objectSchema, stringSchema} from "ctool-tools";

const tuple = {type: "array", items: [{type: "boolean"}, {type: "string", maxLength: 1048576}], minItems: 2, maxItems: 2, additionalItems: false};
const architectures = ["arm64", "arm", "thumb", "armbe", "thumbbe"];
const archResult = {type: "object", properties: Object.fromEntries(architectures.map(a => [a, tuple])), additionalProperties: false};
export const networkTools = [
    {name: "arm_convert", title: "ARM 在线转换", description: "由用户主动提交到 ARM 转换服务", effect: "read", ai: false, mcp: false, timeoutSeconds: 25,
        inputSchema: {...objectSchema({asm: stringSchema, hex: stringSchema, offset: {type: "string", pattern: "^(?:0x)?[a-fA-F0-9]{0,16}$"}, arch: {type: "array", items: {enum: architectures}, minItems: 1, maxItems: 5, uniqueItems: true}}, ["offset", "arch"]), oneOf: [{required: ["asm"], properties: {asm: stringSchema, hex: false}}, {required: ["hex"], properties: {hex: stringSchema, asm: false}}]},
        outputSchema: {...objectSchema({asm: archResult, hex: archResult}, []), minProperties: 1}},
    {name: "code_run", title: "JDoodle 在线运行", description: "用户主动运行单文件代码，可能消耗外部服务额度", effect: "dangerous", ai: false, mcp: false, timeoutSeconds: 65,
        inputSchema: objectSchema({language: {type: "string", pattern: "^[a-z0-9_+-]{1,40}$"}, versionIndex: {type: "string", pattern: "^\\d{1,3}$"}, script: stringSchema, stdin: stringSchema}, ["language", "versionIndex", "script"]),
        outputSchema: objectSchema({output: stringSchema, memory: {type: "string"}, cpuTime: {type: "string"}, error: {type: "string"}, statusCode: {type: "integer"}})},
    {name: "code_credits", title: "JDoodle 额度查询", description: "查询已用执行额度", effect: "read", ai: false, mcp: false, timeoutSeconds: 15,
        inputSchema: objectSchema({}), outputSchema: objectSchema({used: {type: "number", minimum: 0}})},
];

export async function callNetwork(name: string, args: Record<string, unknown>, secrets: Record<string, unknown>, signal: AbortSignal, fetcher: typeof fetch = fetch) {
    const isArm = name === "arm_convert";
    if (!isArm && (typeof secrets.jdoodleClientId !== "string" || typeof secrets.jdoodleClientSecret !== "string" || !secrets.jdoodleClientId || !secrets.jdoodleClientSecret)) {
        throw new ToolError("configuration_required", "请先在扩展设置的秘密配置中填写 JDoodle 账号信息");
    }
    const url = isArm ? "https://armconverter.com/api/convert" : name === "code_run" ? "https://api.jdoodle.com/v1/execute" : "https://api.jdoodle.com/v1/credit-spent";
    const body = isArm ? args : {clientId: secrets.jdoodleClientId, clientSecret: secrets.jdoodleClientSecret, ...(name === "code_run" ? args : {})};
    try {
        const response = await fetcher(url, {method: "POST", redirect: "error", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(name === "code_run" ? 60000 : isArm ? 20000 : 10000)])});
        if (!response.ok && name === "code_run" && response.status >= 500) throw new ToolError("result_unknown", "外部服务异常，代码可能已执行，请确认结果后再手动重试");
        if (!response.ok) throw new ToolError("upstream_failed", "外部服务未完成请求，请检查配置或稍后手动重试");
        const reader = response.body?.getReader();
        if (!reader) throw new ToolError("upstream_failed", "外部服务未返回结果");
        const chunks: Uint8Array[] = []; let size = 0;
        try {
            for (;;) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > 1048576) throw new ToolError("output_limit", "外部结果超过上限，请减少输入"); chunks.push(value); }
        } finally { await reader.cancel().catch(() => {}); }
        const merged = new Uint8Array(size); let offset = 0;
        for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
        const data = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(merged));
        if (!data || typeof data !== "object" || data.error) throw new ToolError("upstream_failed", "外部服务未完成处理，请检查输入和配置");
        if (isArm) return Object.fromEntries(["asm", "hex"].filter(k => data[k] !== undefined).map(k => [k, data[k]]));
        if (name === "code_credits") return {used: data.used};
        if (data.statusCode === 200 && typeof data.output !== "string") throw new ToolError("result_unknown", "结果格式不正确，代码可能已执行，请先确认结果");
        if (typeof data.output !== "string" || data.statusCode !== 200) throw new ToolError("upstream_failed", "在线运行未完成，请检查输入和剩余额度");
        return {output: data.output, memory: String(data.memory ?? ""), cpuTime: String(data.cpuTime ?? ""), error: "", statusCode: data.statusCode};
    } catch (error) {
        if (error instanceof ToolError) throw error;
        throw new ToolError("result_unknown", "连接中断或等待超时，操作可能已经执行，请先确认结果再手动重试");
    }
}
