import {ToolError,objectSchema,stringSchema as s} from "ctool-tools";
import {createHostClientFromEnv} from "./sdk/http.mjs";
import {aiPrompts,jsonExtractPrompt,configDetectPrompt} from "ctool-tools/domains/aiPrompts";
import {buildDiffSummaryPrompt} from "ctool-tools/domains/diffPrompt";
import {definition,choice,integer} from "./definitions";

const features=["json_extract","regex_generate","regex_explain","cron_generate","sql_explain","stacktrace_analyze","config_detect","http_explain","code_explain","text_process","diff_summarize","url_explain","ua_explain"];
const commonInput={text:s,instruction:{type:"string",maxLength:4096},modelRef:{type:"string",maxLength:256},timeoutMs:integer(1000,120000),maxOutputTokens:integer(1,32768)};
const modelId={type:"string",pattern:"^[0-9a-fA-F-]{36}$"};
export const modelTools=[
    {...definition("ai_assist","开始宿主模型辅助，可能产生模型费用；返回JSON调用号，用ai_call_status查询，不自动执行生成内容",{...commonInput,feature:choice(...features),modified:s,language:{type:"string",maxLength:80}},["feature","text"],undefined,"write",20),inputSchema:{oneOf:features.map(feature=>objectSchema({...commonInput,feature:{const:feature},...(feature==='diff_summarize'?{modified:s,language:{type:"string",maxLength:80}}:{})},feature==='diff_summarize'?["feature","text","modified"]:["feature","text"]))}},
    definition("ai_call_status","查询本实例创建的模型调用；返回JSON状态和部分/最终结果",{callId:modelId},["callId"]),
    definition("ai_call_cancel","取消本实例创建的模型调用；不重放生成",{callId:modelId},["callId"],undefined,"write"),
];
type Client=ReturnType<typeof createHostClientFromEnv>;
export class ModelCalls {
    private client?:Client;
    private starting=0;
    private calls=new Map<string,{status:string;expiresAt:number}>();
    constructor(private env:NodeJS.ProcessEnv){}
    async invoke(name:string,a:Record<string,any>,signal:AbortSignal) {
        if(!this.env.XHUB_HOST_API_URL||!this.env.XHUB_INSTANCE_ID)throw new ToolError('configuration_required','请通过cookieOS启动，并在宿主设置可用模型');
        const client=this.client ??= createHostClientFromEnv(this.env);
        if(name==='ai_assist') {
            for(const [id,entry] of this.calls)if(entry.expiresAt<Date.now()&&!['queued','running','prepared'].includes(entry.status))this.calls.delete(id);
            if(this.calls.size+this.starting>=32||this.starting+[...this.calls.values()].filter(v=>['queued','running','prepared'].includes(v.status)).length>=2)throw new ToolError('busy','模型辅助正忙，请等待已有任务完成');
            let system:string;
            let user=a.text;
            if(a.feature==='json_extract')system=jsonExtractPrompt('NO_JSON_FOUND');
            else if(a.feature==='config_detect')system=configDetectPrompt(['json','yaml','toml','xml','csv','html_table','php_array','php_serialize','properties','http_query_string','text']);
            else if(a.feature==='diff_summarize'){const prompt=buildDiffSummaryPrompt({language:a.language ?? '',original:a.text,modified:a.modified ?? ''});system=prompt.system;user=prompt.user;}
            else system=aiPrompts[a.feature as keyof typeof aiPrompts];
            if(a.instruction)user='要求：'+a.instruction+'\n\n'+user;
            this.starting++;
            let call;
            try {call=await client.models.stream({model:a.modelRef?{mode:'explicit',ref:a.modelRef}:{mode:'default'},messages:[{role:'system',content:system},{role:'user',content:user}],parameters:{maxOutputTokens:a.maxOutputTokens ?? 2048},timeoutMs:a.timeoutMs ?? 120000},{signal});}
            finally {this.starting--;}
            const entry={status:'prepared',expiresAt:Date.now()+900000};this.calls.set(call.callId,entry);
            void (async()=>{try{for await(const event of call.events){void event;/* SDK bounds/coalesces output while host retains the call. */}await call.result;entry.status='completed';}catch{try{entry.status=(await client.models.status(call.callId)).status;}catch{entry.status='unknown';}}finally{entry.expiresAt=Date.now()+900000;}})();
            return {text:JSON.stringify({callId:call.callId,status:'prepared'})};
        }
        if(!this.calls.has(a.callId))throw new ToolError('resource_expired','模型调用不存在或已过期');
        const result=await (name==='ai_call_cancel'?client.models.cancel(a.callId):client.models.status(a.callId));
        this.calls.get(a.callId)!.status=result.status;
        return {text:JSON.stringify(result)};
    }
    close(){void this.client?.close().catch(()=>{});this.calls.clear();}
}
