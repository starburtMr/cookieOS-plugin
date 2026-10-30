import {cp, mkdir, readdir, readFile, writeFile, rm} from "node:fs/promises";
import {resolve, join, relative} from "node:path";
import {allTools} from "../dist/extension/service/main.mjs";
const root = resolve("dist/extension");
await rm(join(root, "ui"), {recursive: true, force: true});
await mkdir(root, {recursive: true});
await cp("packages/ctool-core/dist", join(root, "ui"), {recursive: true, dereference: false});
const manifest = {
    schemaVersion: 1, id: "io.cookieos.ctool", name: "Ctool 开发者工具箱", version: "0.1.0", hostApi: "^1.0.0",
    description: "60 项开发工具，支持 cookieOS 模型辅助、AI 与 MCP 纯计算工具", author: "cookieOS-plugin contributors", category: "开发工具",
    permissions: ["open-url"], requires: ["tools.call", "storage.get", "storage.set", "theme.get", "theme.onChange", "runtime.open", "models.list", "models.stream", "models.status"],
    ui: {entry: "ui/main.js", styles: ["ui/style.css"], surfaces: ["module", "view", "window", "drawer"], defaultSurface: "view"},
    service: {runtime: "node", entry: "service/main.mjs", args: [], nodeVersion: ">=22.0.0", healthPath: "/healthz"}, tools: allTools,
};
await writeFile(join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
await cp("LICENSE", join(root, "LICENSE"));
// Include the exact dependency license texts, without source paths or private files.
const licenses = join(root, "licenses"); await rm(licenses, {recursive: true, force: true}); await mkdir(licenses);
const records = [];
const modules = [
    ...JSON.parse(await readFile(".cache/ui-modules.json", "utf8")),
    ...JSON.parse(await readFile(".cache/worker-modules.json", "utf8")),
    ...Object.keys(JSON.parse(await readFile(join(root, "service/metafile-esm.json"), "utf8")).inputs),
];
const packages = new Set();
for (const module of modules) {
    const match = module.match(/node_modules\/\.pnpm\/([^/]+)\/node_modules\/((?:@[^/]+\/)?[^/]+)/);
    if (match) packages.add(join("node_modules/.pnpm", match[1], "node_modules", match[2]));
}
for (const pkg of [...packages].sort()) {
    const info = JSON.parse(await readFile(join(pkg, "package.json"), "utf8"));
    const texts = [];
    for (const file of await readdir(pkg)) if (/licen[cs]e|copying|notice/i.test(file)) {
        const text = await readFile(join(pkg, file), "utf8").catch(() => ""); if (text) texts.push(`--- ${file} ---\n${text}`);
    }
    const filename = `${info.name.replaceAll("/", "__")}@${info.version}.txt`;
    if (!texts.length) {
        const downloaded = await readFile(join("third-party/notices", filename), "utf8").catch(() => "");
        if (downloaded) texts.push(downloaded);
    }
    if (info.name === "@ltd/j-toml") {
        await cp(pkg, join(licenses, "source/j-toml"), {recursive: true, filter: path => !path.includes("node_modules") || path.startsWith(pkg)});
    }
    if (texts.length) await writeFile(join(licenses, filename), texts.join("\n\n"));
    records.push({name: info.name, version: info.version, license: info.license ?? "SEE LICENSE", notice: texts.length ? filename : null});
}
await rm(join(root, "service/metafile-esm.json"));
await writeFile(join(licenses, "index.json"), JSON.stringify(records, null, 2) + "\n");
async function audit(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
        const file = join(directory, entry.name); const name = relative(root, file);
        if (entry.isSymbolicLink() || /(^|\/)(?:\.env|node_modules|\.agents|\.codex|AGENTS\.md|privatekey)/i.test(name)) throw new Error(`Unexpected package file: ${name}`);
        if (entry.isDirectory()) await audit(file);
    }
}
for (const name of await readdir(root)) if (!["manifest.json", "ui", "service", "licenses", "LICENSE"].includes(name)) throw new Error(`Unexpected package root: ${name}`);
for (const name of await readdir(join(root, "service"))) if (name !== "main.mjs") throw new Error(`Unexpected service output: ${name}`);
if (records.some(record => !record.notice)) throw new Error("Missing dependency license notice");
await audit(root);
console.log(`Assembled ${manifest.id} ${manifest.version}; ${allTools.length} tools`);
