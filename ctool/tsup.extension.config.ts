import {defineConfig} from "tsup";

export default defineConfig({
    entry: ["service/main.ts"],
    outDir: "dist/extension/service",
    format: ["esm"],
    target: "node22",
    splitting: false,
    metafile: true,
    clean: false,
    noExternal: [/.*/],
    outExtension: () => ({js: ".mjs"}),
    banner: {js: "import {createRequire} from 'node:module'; const require = createRequire(import.meta.url);"},
});
