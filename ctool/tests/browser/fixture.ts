export async function fixture(page, options: {delays?: Record<string, number>; failures?: string[]} = {}){
    await page.addInitScript((options)=>{
        const values=new Map([['ctool.pref.locale','zh_CN'],['ctool.pref.auto_save_copy',false]]);
        (window as any).fixture={calls:[],writes:[],mode:'success',delays:options.delays??{},failures:options.failures??[]};
        const state=(text:string,status='completed')=>({callId:'fixture-call',status,execution:'completed',text,model:{ref:'fixture-model',modelName:'Fixture Model',providerName:'Fixture',isDefault:true},usage:null,truncated:false,error:null});
        (window as any).xhub={
            runtime:{info:async()=>({id:'io.cookieos.ctool',version:'0.1.0',surface:'view',capabilities:[]}),open:async()=>{}},
            theme:{get:async()=>({colorScheme:'light'}),onChange:()=>()=>{}},
            storage:{get:async(k:string)=>{const f=(window as any).fixture;await new Promise(r=>setTimeout(r,f.delays[k]??0));if(f.failures.includes(k))throw new Error('fixture offline');return (window as any).prefBackendGet?await (window as any).prefBackendGet(k):values.get(k)??null},set:async(k:string,v:any)=>{(window as any).fixture.writes.push([k,v]);values.set(k,v);if((window as any).prefBackendSet)await (window as any).prefBackendSet(k,v)}},
            openExternal:async()=>{},tools:{call:async()=>{throw new Error('请先配置 JDoodle')}},
            models:{list:async()=>({defaultRef:'fixture-model',models:[{ref:'fixture-model',modelName:'Fixture Model',providerName:'Fixture',configurationStatus:'configured',verificationStatus:'verified'}]}),
                status:async()=>state('{"hello":"world"}'),
                stream:async(request:any,{signal}:any)=>{
                    (window as any).fixture.calls.push(request);
                    const mode=(window as any).fixture.mode;
                    const text=(window as any).fixture.reply ?? '{"hello":"world"}';
                    const result=mode==='unknown'?Promise.reject(Object.assign(new Error('unknown'),{code:'model_call_unknown',callId:'fixture-call',partialText:'partial'})):Promise.resolve(state(text));result.catch(()=>{});
                    return{callId:'fixture-call',result,cancel:async()=>state('','cancelled'),events:(async function*(){
                        yield{type:'delta',text:'{"hello":'};
                        await new Promise(r=>setTimeout(r,mode==='slow'?1500:50));
                        if(signal.aborted)throw Object.assign(new Error('cancelled'),{code:'model_cancelled'});
                        if(mode==='unknown')throw Object.assign(new Error('unknown'),{code:'model_call_unknown',callId:'fixture-call',partialText:'partial'});
                        yield{type:'delta',text:'"world"}'};
                    })()};
                }}
        };
    },options);
}
