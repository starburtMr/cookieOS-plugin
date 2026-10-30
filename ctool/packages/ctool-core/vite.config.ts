import {mkdirSync, writeFileSync, readFileSync, existsSync, rmSync} from "node:fs";
import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import HtmlConfig from "vite-plugin-html-config";
import ReactivityTransform from "@vue-macros/reactivity-transform/vite";
const manifest = JSON.parse(readFileSync(resolve(__dirname, "../../manifest.json"), "utf8"));

for (const name of ["ui", "worker"]) rmSync(resolve(__dirname, `../../.cache/${name}-modules.json`), {force: true});
const moduleInventory = (name: string) => ({
    name: `ctool-inventory-${name}`,
    generateBundle(_options, bundle) {
        mkdirSync(resolve(__dirname, "../../.cache"), {recursive: true});
        const modules = Object.values(bundle).flatMap((entry: any) => entry.type === "chunk" ? Object.keys(entry.modules) : []);
        const file = resolve(__dirname, `../../.cache/${name}-modules.json`);
        const previous: string[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
        writeFileSync(file, JSON.stringify([...new Set([...previous, ...modules])]));
    },
});
export default defineConfig({
    base: "./",
    worker: {format: "es", plugins: () => [moduleInventory("worker")]},
    define: {"__CTOOL_VERSION__": JSON.stringify(manifest.version)},
    plugins: [
        moduleInventory("ui"),
        nodePolyfills({exclude: ["crypto"]}),
        HtmlConfig({
            metas: [
                {
                    name: "ctool-version",
                    content: manifest.version,
                },
                {
                    name: "ctool-build-timestamp",
                    content: `${Date.parse(new Date().toString()) / 1000}`,
                },
            ],
        }),
        vue(),
        ReactivityTransform(),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    build: {
        emptyOutDir: true,
        cssCodeSplit: false,
        rollupOptions: {
            input: resolve(__dirname, "src/tool.ts"),
            output: {
                entryFileNames: "main.js",
                assetFileNames: asset => asset.names.some(n => n.endsWith(".css")) ? "style.css" : "assets/[name]-[hash][extname]",
                // 将大依赖拆分为独立 chunk，按需加载
                manualChunks: {
                    "vendor-monaco": ["monaco-editor", "@monaco-editor/loader"],
                    "vendor-prettier": ["prettier"],
                    "vendor-crypto": ["crypto-js", "jsrsasign", "sm-crypto"],
                    "vendor-lodash": ["lodash"],
                    "vendor-mathjs": ["mathjs"],
                },
            },
        },
        reportCompressedSize: false,
        chunkSizeWarningLimit: 5000,
    },
});
