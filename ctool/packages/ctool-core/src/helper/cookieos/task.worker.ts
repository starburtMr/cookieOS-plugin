import {Base64} from "js-base64";
import {checkTree} from "ctool-tools/domains/primitives";

self.onmessage = async ({data: {kind, args}}) => {
    try {
        let value: unknown;
        if (kind === "transform") {
            const [{newVariant, newQuickJSWASMModuleFromVariant}, {default: RELEASE_SYNC}, {default: wasmLocation}, {default: lodashSource}] = await Promise.all([import("quickjs-emscripten-core"), import("@jitl/quickjs-wasmfile-release-sync"), import("@jitl/quickjs-wasmfile-release-sync/wasm?url"), import("lodash/lodash.js?raw")]);
            if (JSON.stringify(args).length > 204800) throw new Error("内容过大，请减少输入");
            checkTree(args.data);
            const memory = new WebAssembly.Memory({initial: 256, maximum: 512});
            const module = await newQuickJSWASMModuleFromVariant(newVariant(RELEASE_SYNC, {wasmLocation, wasmMemory: memory}));
            if (module.getWasmMemory() !== memory) throw new Error("表达式运行环境不可用");
            const runtime = module.newRuntime();
            runtime.setMemoryLimit(8 * 1024 * 1024);
            runtime.setMaxStackSize(512 * 1024);
            const deadline = Date.now() + 1500;
            runtime.setInterruptHandler(() => Date.now() > deadline);
            const context = runtime.newContext();
            try {
                const result = context.evalCode(lodashSource + ";const data = " + JSON.stringify(args.data) + ";JSON.stringify({value:(" + args.expression + ")})");
                if (result.error) { result.error.dispose(); throw new Error("表达式执行失败或超过资源上限"); }
                const encoded = context.getString(result.value); result.value.dispose();
                if (encoded.length > 1048576) throw new Error("结果过大，请减少输入");
                value = JSON.parse(encoded);
            } finally { context.dispose(); runtime.dispose(); }
        } else if (kind === "regex") {
            if (args.content.length > 204800 || args.pattern.length > 4096) throw new Error("内容过大，请减少输入");
            const regex = new RegExp(args.pattern, args.flags);
            value = args.replace === false ? args.content.match(regex) : args.content.replace(regex, args.replace);
        } else if (kind === "schema") {
            const {default: Ajv} = await import("ajv");
            if (args.schema.length > 204800 || JSON.stringify(args.value).length > 204800) throw new Error("内容过大，请减少输入");
            const schema = JSON.parse(args.schema); checkTree(schema); checkTree(args.value);
            const ajv = new Ajv({allErrors: false});
            const validate = ajv.compile(schema);
            value = validate(args.value) ? "ok ^o^" : ajv.errorsText(validate.errors, {separator: "\n"});
        } else if (kind === "inflate" || kind === "gzip") {
            const {compressionBytes} = await import("ctool-tools/domains/encoding");
            const input = Base64.toUint8Array(args.base64);
            if (input.length > 8 * 1024 * 1024) throw new Error("文件超过 8 MiB，请减少内容");
            value = compressionBytes(input,kind === "inflate",args.deflate);
        } else if (kind === "bcrypt_hash" || kind === "bcrypt_compare") {
            const {default: bcrypt} = await import("bcryptjs");
            if (typeof args.input !== "string" || args.input.length > 8192) throw new Error("密码内容过长，请减少输入");
            if (kind === "bcrypt_hash") {
                if (!Number.isSafeInteger(args.rounds) || args.rounds < 4 || args.rounds > 30 || !["2a", "2b", "2y"].includes(args.version)) throw new Error("加密参数不正确");
                const salt = bcrypt.genSaltSync(args.rounds).replace("$2a$", "$" + args.version + "$");
                value = bcrypt.hashSync(args.input, salt);
            } else {
                if (typeof args.hash !== "string" || !/^\$2[aby]\$(?:0[4-9]|[12]\d|30)\$[./a-zA-Z0-9]{53}$/.test(args.hash)) throw new Error("Bcrypt 格式不正确");
                value = bcrypt.compareSync(args.input, args.hash);
            }
        } else if (kind === "qr") {
            const {default: jsQR} = await import("jsqr");
            const bytes = Base64.toUint8Array(args.base64);
            if (bytes.length > 8 * 1024 * 1024) throw new Error("图片超过 8 MiB");
            const bitmap = await createImageBitmap(new Blob([bytes as BlobPart]));
            try {
                if (bitmap.width * bitmap.height > 4 * 1024 * 1024) throw new Error("图片像素过多，请缩小到 400 万像素以内");
                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const context = canvas.getContext("2d");
                if (!context) throw new Error("当前浏览器无法解析图片");
                context.drawImage(bitmap, 0, 0);
                const decoded = jsQR(context.getImageData(0, 0, bitmap.width, bitmap.height).data, bitmap.width, bitmap.height);
                if (!decoded) throw new Error("没有识别到二维码，请更换清晰图片");
                value = decoded.data;
            } finally { bitmap.close(); }
        } else throw new Error("不支持此操作");
        self.postMessage({ok: true, value});
    } catch (error) { self.postMessage({ok: false, error: error instanceof Error ? error.message : "处理失败"}); }
};
