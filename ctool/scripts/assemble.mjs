import {createHash} from "node:crypto";
import {Buffer} from "node:buffer";
import {cp, mkdir, readdir, readFile, writeFile, rm} from "node:fs/promises";
import {resolve, join, relative} from "node:path";
import {allTools} from "../dist/extension/service/main.mjs";
const root = resolve("dist/extension");
await rm(join(root, "ui"), {recursive: true, force: true});
await mkdir(root, {recursive: true});
await cp("packages/ctool-core/dist", join(root, "ui"), {recursive: true, dereference: false});
const manifest = {...JSON.parse(await readFile("manifest.json", "utf8")), tools: allTools};
if(Buffer.byteLength(JSON.stringify(manifest))>262144)throw new Error("Manifest exceeds host 256 KiB budget");
await writeFile(join(root, "manifest.json"), JSON.stringify(manifest) + "\n");
await cp("metadata.json", join(root, "metadata.json"));
await cp("presentation/README.md", join(root, "README.md"));
await rm(join(root, "assets"), {recursive: true, force: true});
await cp("assets", join(root, "assets"), {recursive: true, dereference: false});
await cp("LICENSE", join(root, "LICENSE"));
// Include the exact dependency license texts, without source paths or private files.
const licenses = join(root, "licenses"); await rm(licenses, {recursive: true, force: true}); await mkdir(licenses);
await cp("third-party/native",join(licenses,"native"),{recursive:true});
const nativeFiles=[];
async function inventoryNative(directory){
    for(const item of await readdir(directory,{withFileTypes:true})){
        const path=join(directory,item.name);
        if(item.isDirectory())await inventoryNative(path);
        else if(/\.node$|\.so(?:\.\d+)*$/.test(item.name)){
            const data=await readFile(path);
            nativeFiles.push({path:relative(root,path),size:data.length,sha256:createHash('sha256').update(data).digest('hex')});
        }
    }
}
await inventoryNative(join(root,'service/node_modules'));
await writeFile(join(licenses,'native/binary-inventory.json'),JSON.stringify(nativeFiles,null,2)+'\n');
await cp(join(root,'service/node_modules/@img/sharp-libvips-linux-x64/versions.json'),join(licenses,'native/sharp-versions.json'));
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
async function runtimePackages(directory) {
    for(const entry of await readdir(directory,{withFileTypes:true})) {
        if(!entry.isDirectory())continue;
        const path=join(directory,entry.name);
        if(entry.name.startsWith('@')){await runtimePackages(path);continue;}
        if(await readFile(join(path,'package.json'),'utf8').catch(()=>null))packages.add(path);
        if(await readdir(join(path,'node_modules')).catch(()=>null))await runtimePackages(join(path,'node_modules'));
    }
}
await runtimePackages(join(root,'service/node_modules'));
const recorded=new Set();
for (const pkg of [...packages].sort()) {
    const info = JSON.parse(await readFile(join(pkg, "package.json"), "utf8"));
    const identity=info.name+'@'+info.version;if(recorded.has(identity))continue;recorded.add(identity);
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
if (records.some(record => !record.notice)) throw new Error("Missing dependency license notice: "+records.filter(r=>!r.notice).map(r=>r.name+"@"+r.version).join(", "));
await rm(join(root, "service/metafile-esm.json"));
await cp('service/sdk/vendor/eventsource-parser.LICENSE',join(licenses,'eventsource-parser@3.1.1.txt'));
records.push({name:'eventsource-parser',version:'3.1.1',license:'MIT',notice:'eventsource-parser@3.1.1.txt'});
const asn1Source=await readFile('packages/ctool-tools/src/domains/asn1/asn1.js','utf8');
await writeFile(join(licenses,'asn1-vendored.txt'),asn1Source.slice(0,asn1Source.indexOf("import Int10")));
records.push({name:'lapo-asn1',version:'vendored',license:'ISC',notice:'asn1-vendored.txt'});
await writeFile(join(licenses, "index.json"), JSON.stringify(records, null, 2) + "\n");
async function audit(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
        const file = join(directory, entry.name); const name = relative(root, file);
        if (entry.isSymbolicLink() || /(^|\/)(?:\.env|\.agents|\.codex|AGENTS\.md|privatekey)/i.test(name) || (name.split('/').includes('node_modules')&&name!=='service/node_modules'&&!name.startsWith('service/node_modules/'))) throw new Error(`Unexpected package file: ${name}`);
        if (entry.isDirectory()) await audit(file);
    }
}
for (const name of await readdir(root)) if (!["manifest.json", "metadata.json", "README.md", "assets", "ui", "service", "licenses", "LICENSE"].includes(name)) throw new Error(`Unexpected package root: ${name}`);
for (const name of await readdir(join(root, "service"))) if (!name.endsWith('.mjs')&&name!=='node_modules') throw new Error(`Unexpected service output: ${name}`);

await audit(root);
console.log(`Assembled ${manifest.id} ${manifest.version}; ${allTools.length} tools`);
