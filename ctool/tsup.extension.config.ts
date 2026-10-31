import {defineConfig} from "tsup";

export default defineConfig({
    entry: ["service/main.ts", "service/worker.ts"],
    outDir: "dist/extension/service",
    format: ["esm"],
    target: "node22",
    splitting: true,
    metafile: true,
    clean: true,
    noExternal: [/^(?!(?:jsdom|canvas|sharp|quickjs-emscripten-core|@jitl\/quickjs-wasmfile-release-sync)(?:\/|$))/],
    external: ["jsdom","canvas","sharp","quickjs-emscripten-core","@jitl/quickjs-wasmfile-release-sync"],
    outExtension: () => ({js: ".mjs"}),
    banner: {js: "import {createRequire as __ctoolCreateRequire} from 'node:module'; const require = __ctoolCreateRequire(import.meta.url);"},
});
