import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

export function comparePerformance(before, after, budget) {
    for(const key of ['hostSha256','hostFrontendIndexSha256','browser','platform','profile'])if(!before[key]||before[key]!==after[key])throw new Error('Measurement environment differs: '+key);
    const names=Object.keys(before.summary).filter(k=>['cold-default','warm-reopen'].includes(k)||k.startsWith('tool:'));
    if(!names.length)throw new Error('No comparable scenarios');
    return names.map(name=>{
        const a=after.summary[name]; const b=before.summary[name];
        const minimum=name==='cold-default'?5:10;
        if(!a||a.n<minimum||b.n<minimum)throw new Error('Insufficient samples: '+name);
        const limit=name==='cold-default'?b.median*budget.coldRatio:b.median+Math.max(name.startsWith('tool:')?budget.heavyMaxRegressionMs:budget.warmMaxRegressionMs,b.median*(name.startsWith('tool:')?budget.heavyMaxRegressionRatio:budget.warmMaxRegressionRatio));
        const result={name,beforeMs:b.median,afterMs:a.median,limitMs:limit,passed:a.median<=limit};
        if(name==='cold-default'){
            const base=before.samples.filter(s=>s.scenario===name).map(s=>s.decodedJS);const next=after.samples.filter(s=>s.scenario===name).map(s=>s.decodedJS);
            if(base.length<minimum||next.length<minimum||base.some(v=>!Number.isFinite(v)||v<=0)||next.some(v=>!Number.isFinite(v)||v<=0))throw new Error('Missing decoded JS samples');
            result.beforeJS=Math.max(...base);result.afterJS=Math.max(...next);result.passed&&=result.afterJS<=result.beforeJS*budget.initialJSRatio;
        }
        return result;
    });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
    const [before,after,budget]=process.argv.slice(2).map(p=>JSON.parse(readFileSync(p,'utf8')));
    const results=comparePerformance(before,after,budget);console.log(JSON.stringify(results,null,2));
    if(results.some(r=>!r.passed))process.exitCode=1;
}
