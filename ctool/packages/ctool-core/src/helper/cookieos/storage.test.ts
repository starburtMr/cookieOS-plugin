import {afterEach,expect,it,vi} from "vitest";
import storage,{loadPreferences,preferenceDefaults,savePreference,onPreference,preferenceStatus} from "./storage";
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers()});
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
    storage.set('nv_setting',snapshot({...preferenceDefaults,savePreference,onPreference,preferenceStatus}));await tick();expect(set).not.toHaveBeenCalled();
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

it("late reads cannot overwrite an edit while unrelated keys still hydrate",async()=>{
    let release!:(v:unknown)=>void;
    const set=vi.fn(async()=>{});const seen=vi.fn();const stop=onPreference(seen);
    vi.stubGlobal('window',{xhub:{storage:{get:async(key:string)=>key.endsWith('zoom')?new Promise(r=>{release=r}):key.endsWith('theme')?'dark':null,set}},dispatchEvent:vi.fn()});
    const read=loadPreferences();savePreference('zoom',130);release(90);await read;await tick();
    expect(seen.mock.calls.some(([k])=>k==='zoom')).toBe(false);
    expect(storage.get<any>('nv_setting')!.v.items.theme).toBe('dark');
    expect(set).toHaveBeenCalledExactlyOnceWith('ctool.pref.zoom',130);stop();
});
it("read timeout and retry never rewrite defaults or overwrite a later edit",async()=>{
    vi.useFakeTimers();let release!:(v:unknown)=>void;let retry=false;
    const set=vi.fn(async()=>{});
    vi.stubGlobal('window',{xhub:{storage:{get:async(k:string)=>k.endsWith('zoom')?retry?140:new Promise(r=>{release=r}):null,set}},dispatchEvent:vi.fn()});
    const loading=loadPreferences({timeoutMs:50});const failure=expect(loading).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(51);await failure;
    expect(preferenceStatus.zoom).toBe('failed');release(70);await tick();
    expect(storage.get<any>('nv_setting')!.v.items.zoom).toBeUndefined();
    retry=true;await loadPreferences({retryFailed:true});await tick();
    expect(storage.get<any>('nv_setting')!.v.items.zoom).toBe(140);expect(set).not.toHaveBeenCalled();
    vi.useRealTimers();
});
it("hydration subscribers can update a mounted store without persisting remote values",async()=>{
    const set=vi.fn(async()=>{});const items={...preferenceDefaults};
    const stop=onPreference((k,v)=>{items[k]=v;storage.set('nv_setting',snapshot(items))});
    vi.stubGlobal('window',{xhub:{storage:{get:async(k:string)=>k.endsWith('theme')?'dark':k.endsWith('zoom')?125:null,set}},dispatchEvent:vi.fn()});
    await loadPreferences();await tick();expect(items.theme).toBe('dark');expect(items.zoom).toBe(125);expect(set).not.toHaveBeenCalled();stop();
});
it("an explicit unchanged default protects against a late remote value",async()=>{
    let release!:(v:unknown)=>void;const set=vi.fn(async()=>{});
    vi.stubGlobal('window',{xhub:{storage:{get:async(k:string)=>k.endsWith('theme')?new Promise(r=>{release=r}):null,set}},dispatchEvent:vi.fn()});
    const read=loadPreferences();savePreference('theme','auto');release('dark');await read;await tick();
    expect(storage.get<any>('nv_setting')!.v.items.theme).toBeUndefined();expect(set).toHaveBeenCalledExactlyOnceWith('ctool.pref.theme','auto');
});

it("a failed save is retried only by another explicit choice, including the same value",async()=>{
    const set=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    vi.stubGlobal('window',{xhub:{storage:{get:async()=>null,set}},dispatchEvent:vi.fn()});
    await loadPreferences();savePreference('zoom',125);await tick();expect(set).toHaveBeenCalledTimes(1);
    storage.set('nv_setting',snapshot({...preferenceDefaults,zoom:125}));await tick();expect(set).toHaveBeenCalledTimes(1);
    savePreference('zoom',125);await tick();expect(set.mock.calls).toEqual([['ctool.pref.zoom',125],['ctool.pref.zoom',125]]);
});

it("an obsolete failed read cannot mark an explicit valid choice as unread",async()=>{
    let reject!:(e:Error)=>void;const set=vi.fn(async()=>{});
    vi.stubGlobal('window',{xhub:{storage:{get:async(k:string)=>k.endsWith('theme')?new Promise((_r,no)=>{reject=no}):null,set}},dispatchEvent:vi.fn()});
    const pending=loadPreferences();savePreference('theme','dark');reject(new Error('stale read'));
    await pending;expect(preferenceStatus.theme).toBe('loaded');await tick();expect(set).toHaveBeenCalledExactlyOnceWith('ctool.pref.theme','dark');
});
