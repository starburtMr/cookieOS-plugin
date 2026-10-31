import {afterEach,expect,it,vi} from "vitest";
import {runTask} from "./task";
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers()});
it("aborting a task terminates only its worker and ignores a queued completion",async()=>{
    const workers: any[]=[];
    class Worker {
        onmessage: any; onerror: any;
        terminate=vi.fn(); postMessage=vi.fn();
        constructor(){workers.push(this)}
    }
    vi.stubGlobal("Worker",Worker);
    const a=new AbortController();const b=new AbortController();
    const first=runTask("regex",{},a.signal);const failure=expect(first).rejects.toThrow("已取消");
    const second=runTask("regex",{},b.signal);
    const stale=workers[0].onmessage;a.abort();stale({data:{ok:true,value:"stale"}});
    workers[1].onmessage({data:{ok:true,value:"current"}});
    await failure;await expect(second).resolves.toBe("current");
    expect(workers.map(v=>v.terminate.mock.calls.length)).toEqual([1,1]);
});
it("a worker construction failure does not poison the next task",async()=>{
    let calls=0;
    class Worker {
        onmessage: any; onerror: any; terminate=vi.fn();
        constructor(){if(++calls===1)throw new Error("load failed")}
        postMessage(){queueMicrotask(()=>this.onmessage?.({data:{ok:true,value:"ok"}}))}
    }
    vi.stubGlobal("Worker",Worker);
    await expect(runTask("regex",{},new AbortController().signal)).rejects.toThrow("load failed");
    await expect(runTask("regex",{},new AbortController().signal)).resolves.toBe("ok");
});
it("the original total deadline really terminates an unresponsive worker",async()=>{
    vi.useFakeTimers();const terminate=vi.fn();
    vi.stubGlobal("Worker",class {onmessage:any;onerror:any;postMessage(){} terminate=terminate});
    const pending=runTask("regex",{},new AbortController().signal);
    const failure=expect(pending).rejects.toThrow("处理超时");
    await vi.advanceTimersByTimeAsync(4001);await failure;expect(terminate).toHaveBeenCalledOnce();
});
