import {Buffer} from "node:buffer";
import {mkdirSync, writeFileSync, readFileSync, existsSync, rmSync} from "node:fs";
import { resolve, relative } from "path";
import { defineConfig } from "vite";
import type {Plugin} from "vite";
import vue from "@vitejs/plugin-vue";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import HtmlConfig from "vite-plugin-html-config";
import ReactivityTransform from "@vue-macros/reactivity-transform/vite";
import {gbkIndexes} from "../../scripts/encoding-indexes.mjs";
const manifest = JSON.parse(readFileSync(resolve(__dirname, "../../manifest.json"), "utf8"));

for (const name of ["ui", "worker"]) rmSync(resolve(__dirname, `../../.cache/${name}-modules.json`), {force: true});
const moduleInventory = (name: string): Plugin => ({
    name: `ctool-inventory-${name}`,
    generateBundle(_options, bundle) {
        mkdirSync(resolve(__dirname, "../../.cache"), {recursive: true});
        if (name === "ui") writeFileSync(resolve(__dirname, "../../.cache/ui-chunks.json"), JSON.stringify(Object.fromEntries(Object.values(bundle).filter((v: any) => v.type === "chunk").map((v: any) => [v.fileName, {imports: v.imports, dynamicImports: v.dynamicImports, bytes: Buffer.byteLength(v.code), modules: Object.keys(v.modules).map(id => id.includes("node_modules/") ? "node_modules/" + id.split("node_modules/").at(-1) : relative(resolve(__dirname, "../.."), id))}]))));
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
        {name: "ctool-gbk-indexes", enforce: "pre", transform(code, id) {
            if(id.endsWith("/text-decoding/src/encoding-indexes.js"))return {code: gbkIndexes(code), map: null};
        }},
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

            },
        },
        reportCompressedSize: false,
        chunkSizeWarningLimit: 5000,
    },
});
