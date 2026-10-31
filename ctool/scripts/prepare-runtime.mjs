import {mkdir,cp,readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
if(process.platform!=='linux'||process.arch!=='x64')throw new Error('This release prepares Linux x64 native dependencies; build on the target platform');
const root=resolve('.cache/service-runtime');
const lock=await readFile('service/runtime/package-lock.json');
const stamp=createHash('sha256').update(lock).update(process.platform+process.arch+process.versions.modules).digest('hex');
const run=(args)=>{const result=spawnSync('npm',args,{cwd:root,stdio:'inherit',timeout:180000});if(result.status!==0)throw new Error(`Runtime preparation failed (${result.status})`);};
await mkdir(root,{recursive:true});
if(await readFile(join(root,'.prepared'),'utf8').catch(()=>'')!==stamp){
    await cp('service/runtime/package.json',join(root,'package.json'));
    await cp('service/runtime/package-lock.json',join(root,'package-lock.json'));
    run(['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund']);
    run(['rebuild','canvas','--foreground-scripts','--no-audit','--no-fund']);
    await writeFile(join(root,'.prepared'),stamp);
}
await access(join(root,'node_modules/canvas/build/Release/canvas.node'));
await mkdir('dist/extension/service',{recursive:true});
await cp(join(root,'node_modules'),'dist/extension/service/node_modules',{recursive:true,dereference:false,filter:path=>!path.endsWith('.tsbuildinfo')&&(!path.includes('/canvas/build/')||path.endsWith('/canvas/build/Release')||path.includes('/canvas/build/Release/'))&&!path.split('/').some(part=>['.bin','.package-lock.json','obj.target','.deps','sharp-linuxmusl-x64','sharp-libvips-linuxmusl-x64'].includes(part))});
console.log('Prepared Linux x64 Node runtime dependencies from locked packages');
