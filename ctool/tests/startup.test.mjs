import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startupGraph} from '../scripts/check-startup.mjs';
import {gbkIndexes} from '../scripts/encoding-indexes.mjs';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {comparePerformance} from '../scripts/check-performance.mjs';
const chunk=(modules=[],imports=[],bytes=100)=>({modules,imports,bytes});
const graph=()=>({'main.js':chunk([],['shared.js']),'shared.js':chunk(),'hash.js':chunk(['packages/ctool-core/src/tools/hash/Hash.vue']),'base64.js':chunk(['packages/ctool-core/src/tools/base64/Encoder.vue']),'json.js':chunk(['packages/ctool-core/src/tools/json/Json.vue'])});
test('startup traversal follows imports and does not count shared chunks twice',()=>{
    const g=graph();g['shared.js'].imports=['main.js'];
    assert.deepEqual(startupGraph(g).map(v=>v.bytes),[200,300,300,300]);
});
test('renamed heavy dependency behind a shared chunk fails the guard',()=>{
    const g=graph();g['shared.js'].modules=['node_modules/monaco-editor/esm/vs/editor/editor.api.js'];
    assert.throws(()=>startupGraph(g),/eagerly imports/);
});
test('missing chunks and excessive startup size fail closed',()=>{
    const g=graph();g['shared.js'].bytes=3000000;assert.throws(()=>startupGraph(g),/exceeds/);
    delete g['shared.js'];assert.throws(()=>startupGraph(g),/Missing chunk/);
});
test('JSON editing may load its editor but not the optional code generator',()=>{
    const g=graph();g['json.js'].modules.push('node_modules/monaco-editor/editor.js');assert.doesNotThrow(()=>startupGraph(g));
    g['json.js'].modules.push('node_modules/quicktype-core/index.js');assert.throws(()=>startupGraph(g),/eagerly imports/);
});
test('browser pruning retains the exact upstream GBK data and rejects changed dependencies',()=>{
    const source=readFileSync('node_modules/.pnpm/text-decoding@1.0.0/node_modules/text-decoding/src/encoding-indexes.js','utf8');
    const properties=code=>ts.createSourceFile('indexes.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS).statements.filter(ts.isVariableStatement).flatMap(s=>s.declarationList.declarations).find(d=>d.name.getText()==='Indexes').initializer.properties;
    const pruned=properties(gbkIndexes(source));assert.equal(pruned.length,2);
    for(const p of pruned)assert.equal(p.getText(),properties(source).find(v=>v.name.text===p.name.text).getText());
    assert.throws(()=>gbkIndexes(source+'\n'),/changed/);
    const consumer=readFileSync('packages/ctool-tools/src/domains/uint.ts','utf8');
    assert.match(consumer,/type Encoding = "utf-8" \| "gbk";/,'additional encodings require reviewing the browser pruning');
});
test('performance budgets reject regressions, mixed environments and inadequate samples',()=>{
    const report={hostSha256:'host',hostFrontendIndexSha256:'ui',browser:'browser',platform:'os',profile:'cpu',summary:{'cold-default':{n:5,median:1000}},samples:Array.from({length:5},()=>({scenario:'cold-default',decodedJS:1000}))};
    const budget={coldRatio:.7,initialJSRatio:.4,warmMaxRegressionMs:50,warmMaxRegressionRatio:.1,heavyMaxRegressionMs:100,heavyMaxRegressionRatio:.1};const after=structuredClone(report);
    after.summary['cold-default'].median=600;after.samples.forEach(s=>s.decodedJS=300);
    assert.equal(comparePerformance(report,after,budget)[0].passed,true);
    after.summary['cold-default'].median=800;assert.equal(comparePerformance(report,after,budget)[0].passed,false);
    after.summary['cold-default'].n=4;assert.throws(()=>comparePerformance(report,after,budget),/Insufficient/);
    after.browser='other';assert.throws(()=>comparePerformance(report,after,budget),/environment/);
    for(const [name,median,allowed] of [['warm-reopen',200,250],['tool:json:first',2000,2200]]){
        const a={...report,summary:{[name]:{n:10,median}}};const b={...report,summary:{[name]:{n:10,median:allowed}}};
        assert.equal(comparePerformance(a,b,budget)[0].passed,true);
        b.summary[name].median++;assert.equal(comparePerformance(a,b,budget)[0].passed,false);
    }
});
