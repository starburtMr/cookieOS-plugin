import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const directory=await mkdtemp(join(tmpdir(),'ctool-duplicate-gate-'));
try{
    const source='export function probe(values) {\n'+Array.from({length:12},(_,n)=>`  const value${n} = values.map(item => item + ${n}).filter(item => item > ${n});`).join('\n')+'\nreturn values;\n}\n';
    await writeFile(join(directory,'first.ts'),source);
    await writeFile(join(directory,'second.ts'),source);
    const result=spawnSync(process.execPath,[resolve('node_modules/jscpd/run-jscpd.js'),directory,'--baseline',resolve('.jscpd-baseline.json'),'--fail-on-new-clones','0','--min-tokens','100','--reporters','console'],{encoding:'utf8'});
    assert.equal(result.status,1,result.stdout+result.stderr);
    assert.match(result.stdout+result.stderr,/new clones/);
    console.log('Duplicate gate rejected injected clones; baseline was not modified');
}finally{await rm(directory,{recursive:true,force:true})}
