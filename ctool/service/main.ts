import {Buffer} from "node:buffer";
import {createServer} from "node:http";
import {pathToFileURL} from "node:url";
import Ajv from "ajv";
import {tools, invokePure, ToolError} from "ctool-tools";
import {networkTools, callNetwork} from "./network";

export const allTools = [...tools, ...networkTools];
const ajv = new Ajv({strict: true});
const schemas = new Map(networkTools.map(t => [t.name, {input: ajv.compile(t.inputSchema), output: ajv.compile(t.outputSchema)}]));

export function createPluginServer(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
    const token = env.XHUB_SERVICE_TOKEN;
    if (!token) throw new Error("This service must be started by cookieOS");
    let secrets: Record<string, unknown>;
    try { secrets = JSON.parse(env.XHUB_SECRET_CONFIG || "{}"); if (!secrets || typeof secrets !== "object" || Array.isArray(secrets)) throw new Error("Secret configuration must be an object"); }
    catch { throw new Error("Invalid extension secret configuration"); }
    const server = createServer(async (request, response) => {
        const reply = (status: number, value: unknown) => { if (!response.destroyed && !response.writableEnded) { response.writeHead(status, {"Content-Type": "application/json; charset=utf-8"}); response.end(JSON.stringify(value)); } };
        if (request.headers.authorization !== `Bearer ${token}`) return reply(401, {error: "unauthorized"});
        if (request.method === "GET" && request.url === "/healthz") return reply(200, {instanceId: env.XHUB_INSTANCE_ID, version: env.XHUB_VERSION, toolsHash: env.XHUB_TOOLS_HASH});
        if (request.method === "POST" && /^\/xhub\/calls\/[a-z0-9-]+\/cancel$/.test(request.url || "")) return reply(200, {accepted: false});
        if (request.method !== "POST" || request.url !== "/xhub/agent-tool") return reply(404, {error: "not_found"});
        let callId: string | undefined;
        const abort = new AbortController();
        response.on("close", () => { if (!response.writableFinished) abort.abort(); });
        try {
            const chunks: Buffer[] = []; let length = 0;
            for await (const chunk of request) { length += chunk.length; if (length > 262144) return reply(413, {error: "too_large"}); chunks.push(chunk); }
            const body = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(Buffer.concat(chunks)));
            if (!body || typeof body !== "object" || typeof body.callId !== "string" || !body.callId || body.callId.length > 128 || typeof body.tool !== "string" || Object.keys(body).some(k => !["callId", "tool", "args"].includes(k))) return reply(400, {error: "invalid_request"});
            callId = body.callId;
            const schema = schemas.get(body.tool);
            let result: unknown;
            if (schema) {
                if (!schema.input(body.args)) throw new ToolError("invalid_arguments", "参数不正确，请检查输入");
                result = await callNetwork(body.tool, body.args, secrets, abort.signal, fetcher);
                if (!schema.output(result)) throw new ToolError(body.tool === "code_run" ? "result_unknown" : "upstream_failed", "外部结果格式不正确，请稍后手动重试");
            } else result = invokePure(body.tool, body.args);
            reply(200, {callId, ok: true, result});
        } catch (error) {
            if (!callId) return reply(400, {error: "invalid_request"});
            const failure = error instanceof ToolError ? error : new ToolError("internal_error", "处理失败，请检查输入或稍后重试");
            reply(200, {callId, ok: false, error: {code: failure.code, message: failure.message}});
        }
    });
    server.requestTimeout = 30000;
    return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const server = createPluginServer();
    server.listen(Number(process.env.PORT || 0), process.env.XHUB_LISTEN_HOST || "127.0.0.1", () => {
        const address = server.address();
        if (address && typeof address !== "string") console.log(`COOKIEOS_READY ${JSON.stringify({port: address.port, instanceId: process.env.XHUB_INSTANCE_ID})}`);
    });
    for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => { server.close(() => process.exit(0)); server.closeAllConnections(); });
}
