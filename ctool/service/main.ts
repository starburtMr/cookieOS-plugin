import {Buffer} from "node:buffer";
import {createServer} from "node:http";
import {pathToFileURL} from "node:url";
import Ajv from "ajv";
import type {AnySchema} from "ajv";
import {tools, ToolError} from "ctool-tools";
import {networkTools, callNetwork} from "./network";
import {fileTools, extendedTools} from "./definitions";
import {FileStore} from "./files";
import {TaskPool} from "./runtime";
import {textTools} from "./textDefinitions";
import {calculationTools} from "./calculationDefinitions";
import {cryptoTools} from "./cryptoDefinitions";
import {dataTools} from "./dataDefinitions";
import {developerTools} from "./developerDefinitions";
import {miscTools} from "./miscDefinitions";
import {imageTools} from "./imageDefinitions";
import {connectionTools,Connections} from "./connections";
import {modelTools,ModelCalls} from "./models";
export {FileStore} from "./files";

export const allTools = [...tools, ...networkTools, ...fileTools, ...extendedTools, ...textTools, ...calculationTools, ...cryptoTools, ...dataTools, ...developerTools, ...miscTools, ...imageTools, ...connectionTools, ...modelTools];
const ajv = new Ajv({strict: true});
const schemas = new Map(allTools.map(t => [t.name, {input: ajv.compile(t.inputSchema), output: ajv.compile(t.outputSchema as AnySchema)}]));

export function createPluginServer(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
    const token = env.XHUB_SERVICE_TOKEN;
    if (!token) throw new Error("This service must be started by cookieOS");
    let secrets: Record<string, unknown>;
    try { secrets = JSON.parse(env.XHUB_SECRET_CONFIG || "{}"); if (!secrets || typeof secrets !== "object" || Array.isArray(secrets)) throw new Error("Secret configuration must be an object"); }
    catch { throw new Error("Invalid extension secret configuration"); }
    const files = new FileStore(env.XHUB_DATA_DIR);
    const pool = new TaskPool();
    const connections = new Connections(files,fetcher,secrets);
    const models = new ModelCalls(env);
    const active = new Map<string, AbortController>();
    const server = createServer(async (request, response) => {
        const reply = (status: number, value: unknown) => { if (!response.destroyed && !response.writableEnded) { response.writeHead(status, {"Content-Type": "application/json; charset=utf-8"}); response.end(JSON.stringify(value)); } };
        if (request.headers.authorization !== `Bearer ${token}`) return reply(401, {error: "unauthorized"});
        if (request.method === "GET" && request.url === "/healthz") return reply(200, {instanceId: env.XHUB_INSTANCE_ID, version: env.XHUB_VERSION, toolsHash: env.XHUB_TOOLS_HASH});
        if (request.method === "POST" && /^\/xhub\/calls\/[\w-]+\/cancel$/.test(request.url || "")) {
            const id = request.url!.split("/")[3]; const running = active.get(id);
            if (running) running.abort(); return reply(200, {accepted: Boolean(running)});
        }
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
            if (active.has(callId!)) throw new ToolError("call_conflict", "调用号已在处理中");
            const schema = schemas.get(body.tool);
            if (!schema || !schema.input(body.args)) throw new ToolError("invalid_arguments", "参数不正确，请检查输入");
            active.set(callId!, abort);
            let result: unknown;
            const args = body.args;
            if (body.tool === "file_begin") result = files.begin(args.size,args.sha256,args.mime);
            else if (body.tool === "file_chunk") result = files.chunk(args.fileRef,args.offset,args.dataBase64);
            else if (body.tool === "file_commit") result = files.commit(args.fileRef);
            else if (body.tool === "file_status") result = files.status(args.fileRef);
            else if (body.tool === "file_read") result = files.read(args.fileRef,args.offset,args.length);
            else if (body.tool === "file_delete") result = files.remove(args.fileRef);
            else if (networkTools.some(t => t.name === body.tool)) result = await callNetwork(body.tool,args,secrets,abort.signal,fetcher);
            else if (modelTools.some(t => t.name === body.tool)) result = await models.invoke(body.tool,args,abort.signal);
            else {
                const input = args.fileRef ? {...args,bytes:files.bytes(args.fileRef)} : args;
                if(input.bytes?.length>8388608)throw new ToolError('input_limit','工具输入文件超过8 MiB');
                if (args.logoRef) input.logoBytes = files.bytes(args.logoRef);
                if (cryptoTools.some(t => t.name === body.tool) && args.keyRef) {
                    const keys = secrets.keys;
                    if (!keys || typeof keys !== "object" || Array.isArray(keys) || !Object.hasOwn(keys,args.keyRef) || typeof (keys as Record<string,unknown>)[args.keyRef] !== "string") throw new ToolError("configuration_required","请先在秘密配置的 keys 中添加对应密钥");
                    input.secret = (keys as Record<string,unknown>)[args.keyRef];
                }
                if ([...textTools,...dataTools,...developerTools].some(t => t.name === body.tool) && input.bytes && !(body.tool==='msgpack_transform'&&args.operation==='decode')) input.text = new TextDecoder("utf-8", {fatal:true}).decode(input.bytes);
                if (connectionTools.some(t => t.name === body.tool)) result = await connections.invoke(body.tool,input,abort.signal);
                else result = await pool.run(body.tool,input,abort.signal,body.tool==='key_pair_generate'?55000:10000);
            }
            if(body.tool==='key_pair_generate') {
                const pair=result as {publicKey:string;privateKeyBytes:Uint8Array};
                result={publicKey:pair.publicKey,privateKey:files.put(pair.privateKeyBytes,'application/x-pem-file')};
            }
            let value = result as {bytes?:Uint8Array;mime?:string;text?:string};
            if (value?.bytes instanceof Uint8Array) value = {file:files.put(value.bytes,value.mime)} as typeof value;
            else if (!tools.some(t => t.name === body.tool) && typeof value?.text === "string" && Buffer.byteLength(JSON.stringify(value)) > 200000) value = {file:files.put(Buffer.from(value.text),"text/plain; charset=utf-8")} as typeof value;
            result = value;
            if (!schema.output(result)) throw new ToolError(body.tool === "code_run" ? "result_unknown" : "invalid_result", "处理结果格式不正确");
            if (Buffer.byteLength(JSON.stringify({callId,ok:true,result})) > 1048576) throw new ToolError("output_limit", "结果超过上限，请减少输入");
            reply(200, {callId, ok: true, result});
        } catch (error) {
            if (!callId) return reply(400, {error: "invalid_request"});
            const failure = error instanceof ToolError ? error : new ToolError("internal_error", "处理失败，请检查输入或稍后重试");
            reply(200, {callId, ok: false, error: {code: failure.code, message: failure.message}});
        } finally { if (callId && active.get(callId) === abort) active.delete(callId); }
    });
    server.on("close", () => { for (const call of active.values()) call.abort(); models.close(); connections.close(); pool.close(); files.close(); });
    server.requestTimeout = 30000;
    return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    // Native ESM dependencies must load before reporting readiness.
    // eslint-disable-next-line antfu/no-top-level-await
    try {await import('canvas');await import('sharp');}
    catch {console.error('图像运行依赖不可用，请使用适配当前服务器系统和架构的Ctool安装包');process.exit(1);}
    const server = createPluginServer();
    server.listen(Number(process.env.PORT || 0), process.env.XHUB_LISTEN_HOST || "127.0.0.1", () => {
        const address = server.address();
        if (address && typeof address !== "string") console.log(`COOKIEOS_READY ${JSON.stringify({port: address.port, instanceId: process.env.XHUB_INSTANCE_ID})}`);
    });
    for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => { server.close(() => process.exit(0)); server.closeAllConnections(); });
}
