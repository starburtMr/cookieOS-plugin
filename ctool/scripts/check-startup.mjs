import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function startupGraph(graph) {
    const targets=[['shell','main.js'],['hash',Object.keys(graph).find(k=>graph[k].modules.some(v=>v.endsWith('/tools/hash/Hash.vue')))],['base64',Object.keys(graph).find(k=>graph[k].modules.some(v=>v.endsWith('/tools/base64/Encoder.vue')))],['json',Object.keys(graph).find(k=>graph[k].modules.some(v=>v.endsWith('/tools/json/Json.vue')))]];
    return targets.map(([name,entry])=>{
        if(!entry)throw new Error('Missing startup entry: '+name);
        const seen=new Set();const visit=file=>{
            if(seen.has(file))return;
            if(!graph[file])throw new Error('Missing chunk: '+file);
            seen.add(file);for(const imported of graph[file].imports)visit(imported);
        };
        visit(entry);if(entry!=='main.js')visit('main.js');
        const files=[...seen];const modules=files.flatMap(f=>graph[f].modules);
        const forbidden=modules.filter(v=>name==='json'?/node_modules\/quicktype-core\//.test(v):v.endsWith("ctool-tools/src/index.ts") || /node_modules\/(?:monaco-editor|@monaco-editor|mathjs|prettier|quicktype-core|quickjs-emscripten-core|@jitl|jsrsasign)(?:\/|$)/.test(v));
        if(forbidden.length)throw new Error(name+' eagerly imports '+forbidden.join(', '));
        const bytes=files.reduce((sum,f)=>sum+graph[f].bytes,0);
        if(name!=='json'&&bytes>2562035)throw new Error(name+' exceeds 40% of the 0.3.0 static JS baseline: '+bytes);
        return{name,bytes,files,modules};
    });
}
async function main(){
    const graph=JSON.parse(await readFile('.cache/ui-chunks.json','utf8'));
    console.log(JSON.stringify(startupGraph(graph).map(({name,bytes,files})=>({name,bytes,files})),null,2));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)void main().catch(error=>{console.error(error);process.exitCode=1});
