import {invokePure,tools,ToolError} from "ctool-tools";
import {readFileSync} from "node:fs";
import {createRequire as nodeRequire} from "node:module";
import Json from "ctool-tools/domains/json";
import {textTools} from "./textDefinitions";
import {calculationTools} from "./calculationDefinitions";
import {cryptoTools} from "./cryptoDefinitions";
import {dataTools} from "./dataDefinitions";
import {developerTools} from "./developerDefinitions";
import {miscTools} from "./miscDefinitions";
import {imageTools} from "./imageDefinitions";
let dom: any;
async function prepareDom() {
    if(dom)return;
    const {JSDOM}=await import("jsdom");dom=new JSDOM("");
    (await import("ctool-tools/adapters/tableDom")).configureTableDom(dom.window);
    Object.assign(globalThis,{window:dom.window,document:dom.window.document,DOMParser:dom.window.DOMParser,XMLSerializer:dom.window.XMLSerializer});
}
async function transform(a: Record<string,any>) {
    const {checkTree}=await import("ctool-tools");const data=Json.parse(a.text);checkTree(data);
    const encoded=JSON.stringify(data,(_key,value)=>{if(typeof value==='bigint')throw new ToolError('invalid_arguments','表达式不支持超出安全整数范围的JSON数值，请改用字符串');return value;});
    const {newVariant,newQuickJSWASMModuleFromVariant}=await import("quickjs-emscripten-core");
    const {default:variant}=await import("@jitl/quickjs-wasmfile-release-sync");
    const memory=new WebAssembly.Memory({initial:256,maximum:512});
    const module=await newQuickJSWASMModuleFromVariant(newVariant(variant,{wasmMemory:memory}));
    if(module.getWasmMemory()!==memory)throw new ToolError('worker_failed','表达式执行环境不可用');
    const runtime=module.newRuntime();runtime.setMemoryLimit(8*1024*1024);runtime.setMaxStackSize(512*1024);
    const deadline=Date.now()+1500;runtime.setInterruptHandler(()=>Date.now()>deadline);
    const context=runtime.newContext();
    try {
        const lodash=readFileSync(nodeRequire(import.meta.url).resolve("lodash/lodash.js"),"utf8");
        const result=context.evalCode(lodash+";const data="+encoded+";JSON.stringify({value:("+a.expression+")})");
        if(result.error){result.error.dispose();throw new ToolError("invalid_arguments","表达式执行失败或超过资源上限");}
        const text=context.getString(result.value);result.value.dispose();
        if(text.length>1048576)throw new ToolError("output_limit","转换结果过大");return {text};
    }finally{context.dispose();runtime.dispose();}
}
async function execute(name:string,args:Record<string,any>) {
    if(tools.some(t=>t.name===name))return invokePure(name,args);
    if(name==='json_transform')return transform(args);
    if(cryptoTools.some(t=>t.name===name))return (await import("./crypto")).cryptoOperation(name,args);
    if(calculationTools.some(t=>t.name===name))return (await import("ctool-tools/domains/calculation")).calculateOperation(name,args);
    if(textTools.some(t=>t.name===name))return (await import("ctool-tools/domains/textOperations")).textOperation(name,args);
    if(miscTools.some(t=>t.name===name))return (await import("./misc")).miscOperation(name,args);
    if(imageTools.some(t=>t.name===name))return (await import("./images")).imageOperation(name,args);
    if(dataTools.some(t=>t.name===name)||developerTools.some(t=>t.name===name)) {
        await prepareDom();
        return dataTools.some(t=>t.name===name)?(await import("ctool-tools/domains/data")).dataOperation(name,args):(await import("ctool-tools/domains/developer")).developerOperation(name,args);
    }
    return (await import("ctool-tools/domains/encoding")).transformEncoding(name,args);
}
process.on("disconnect",()=>{dom?.window.close();process.exit(0);});
process.on("message",async(job:{id:string;name:string;args:Record<string,any>})=>{
    try{process.send?.({id:job.id,ok:true,value:await execute(job.name,job.args)});}
    catch(error){process.send?.({id:job.id,ok:false,code:error instanceof ToolError?error.code:"invalid_arguments",message:error instanceof ToolError?error.message:"内容无法处理，请检查格式与参数"});}
});
