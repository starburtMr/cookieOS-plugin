import {afterEach,expect,it,vi} from "vitest";
import storage,{loadPreferences,preferenceDefaults} from "./storage";
afterEach(()=>vi.unstubAllGlobals());
const snapshot=(items: Record<string,unknown>)=>({v:{items},u:"",e:0,es:""});
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
it("reads validated preferences without persisting default values or private fields",async()=>{
    const get=vi.fn(async(key:string)=>key==='ctool.pref.theme'?'dark':key==='ctool.pref.zoom'?999:key==='ctool.pref.common'?['unknown-tool']:null);
    const set=vi.fn(async()=>{});
    vi.stubGlobal('window',{xhub:{storage:{get,set}},dispatchEvent:vi.fn()});
    await loadPreferences();
    const loaded=storage.get<any>('nv_setting')!.v.items;expect(loaded).toEqual({theme:'dark'});
    storage.set('nv_setting',snapshot({...preferenceDefaults,...loaded,ai_api_key:'fixture'}));await tick();expect(set).not.toHaveBeenCalled();
    storage.set('nv_setting',snapshot({...preferenceDefaults,...loaded,zoom:120}));await tick();expect(set).toHaveBeenCalledExactlyOnceWith('ctool.pref.zoom',120);
    expect(get.mock.calls.some(([key])=>key.includes('api_key'))).toBe(false);
});
it("partial reads do not overwrite unread remote settings with defaults",async()=>{
    const set=vi.fn(async()=>{});
    vi.stubGlobal('window',{xhub:{storage:{get:async(key:string)=>{if(key.endsWith('theme'))throw new Error('offline');return null},set}},dispatchEvent:vi.fn()});
    await expect(loadPreferences()).rejects.toThrow();
    storage.set('nv_setting',snapshot({...preferenceDefaults}));await tick();expect(set).not.toHaveBeenCalled();
});
it("serializes writes for the same key and reports a failed save",async()=>{
    let release!:()=>void;
    const first=new Promise<void>(resolve=>{release=resolve});
    const set=vi.fn().mockImplementationOnce(()=>first).mockRejectedValueOnce(new Error('offline'));
    const dispatchEvent=vi.fn();vi.stubGlobal('window',{xhub:{storage:{get:async()=>null,set}},dispatchEvent});
    await loadPreferences();
    storage.set('nv_setting',snapshot({...preferenceDefaults,zoom:110}));await tick();
    storage.set('nv_setting',snapshot({...preferenceDefaults,zoom:120}));await tick();expect(set).toHaveBeenCalledTimes(1);
    release();await tick();expect(set.mock.calls.map(a=>a[1])).toEqual([110,120]);expect(dispatchEvent).toHaveBeenCalledTimes(1);
});
