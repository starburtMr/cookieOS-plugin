import {createHash} from 'node:crypto';
import ts from 'typescript';

// Only Uint's GBK encoder uses this polyfill; UTF-8 and all decoding stay native.
export function gbkIndexes(source) {
    if(createHash('sha256').update(source).digest('hex')!=='9b54c6b23e1e90bbf12e9753a18cd7e1484382b93b4fd0d2f68814ea039a2386')throw new Error('text-decoding indexes changed; review encoding support before pruning');
    const file=ts.createSourceFile('encoding-indexes.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
    const declaration=file.statements.filter(ts.isVariableStatement).flatMap(s=>s.declarationList.declarations).find(d=>d.name.getText(file)==='Indexes');
    if(!declaration?.initializer||!ts.isObjectLiteralExpression(declaration.initializer))throw new Error('Missing encoding indexes');
    const keep=['gb18030','gb18030-ranges'];
    const properties=declaration.initializer.properties.filter(p=>ts.isPropertyAssignment(p)&&keep.includes(p.name.text));
    if(properties.length!==keep.length)throw new Error('Missing GBK indexes');
    return 'const Indexes={'+properties.map(p=>p.getText(file)).join(',')+'}; export default Indexes;';
}
