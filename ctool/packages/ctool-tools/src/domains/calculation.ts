import {parseObjectId,createObjectId} from "./objectId";
import {convertRadix,ToolError} from "../index";
import {generate as binary} from "./binary";
import {calculate} from "./unit";
import {numberStatistics} from "./statistics";
import {uuidV4,uuidParse,ulid} from "./uuid";
import {secureRandomInt,checkRandomSize} from "./random";
import {countWorkdays,addWorkdays} from "./workday";
import IPv4, {WildcardCalc,getWildcardInfo,isContiguousWildcard,getMaskBitByAvailable} from "./ipv4";
import ip6 from "ip6";
import cron from "cron-parser";
import cronstrue from "cronstrue";
import dayjs from "dayjs";
import BigNumber from "bignumber.js";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);dayjs.extend(timezone);
const json = (value: unknown) => ({text:JSON.stringify(value)});
const fail = () => {throw new ToolError("invalid_arguments","参数或数值不正确");};
const isoDate=(text:string)=>{
    if(typeof text!=='string'||!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(text))fail();
    const calendar=new Date(text.slice(0,10)+'T00:00:00Z');
    if(!Number.isFinite(calendar.valueOf())||calendar.toISOString().slice(0,10)!==text.slice(0,10))fail();
    const value=dayjs(text);if(!value.isValid())fail();return value;
};


export function calculateOperation(name: string, a: Record<string,any>) {
    switch(name) {
        case "radix_transform":return {text:convertRadix(a.value,a.fromBase,a.toBase,a.alphabet)};
        case "binary_convert":return {text:binary(a.value,a.bits,a.representation)};
        case "unit_convert": {
            if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d{1,3})?$/i.test(a.value))fail();
            const text=calculate(a.group,a.value,a.from,a.to);if(!Number.isFinite(Number(text)))fail();return {text};
        }
        case "number_statistics": {
            if(a.text.trim().split(/[\s,]+/).some((v:string)=>!Number.isFinite(Number(v))))fail();
            const result=numberStatistics(a.text);if(Object.values(result).some(v=>typeof v==='string'&&/NaN|Infinity/.test(v)))fail();
            return json(result);
        }
        case "uuid_operate":return json(Array.from({length:a.count ?? 1},()=>{let v=a.kind==='ulid'?ulid():uuidV4();if(a.bytes&&a.kind!=='ulid')return Array.from(uuidParse(v));if(a.hyphens===false)v=v.replace(/-/g,'');return a.uppercase?v.toUpperCase():v.toLowerCase();}));
        case "random_generate": {
            checkRandomSize(a.length,a.count ?? 1);
            const chars=Array.from(a.alphabet);if(!chars.length)fail();
            return json(Array.from({length:a.count ?? 1},()=>Array.from({length:a.length},()=>chars[secureRandomInt(chars.length)]).join('')));
        }
        case "objectid_operate": {
            if(a.operation==='generate')return {text:createObjectId()};
            const value=parseObjectId(a.value ?? '');if(!value.valid)return json({valid:false});
            return json({valid:true,timestamp:value.timestamp,iso:new Date(Number(value.timestamp)*1000).toISOString(),random:a.value.slice(8,18),counter:Number(value.counter),legacyMachineId:value.machineId,legacyProcessId:value.processId});
        }
        case "ip_calculate": {
            if(a.version==='ipv6') {
                if(a.mask!==undefined&&!Number.isInteger(a.mask))fail();
                if(!['inspect','subnet','range','ptr'].includes(a.operation))fail();
                ip6.validate(a.address);
                if(a.operation==='subnet')return json(a.random?ip6.randomSubnet(a.address,a.mask ?? 32,a.toMask ?? 64,a.count ?? 8,a.abbreviate):ip6.divideSubnet(a.address,a.mask ?? 32,a.toMask ?? 64,a.count ?? 8,a.abbreviate));
                if(a.operation==='range'){const r=ip6.rangeBigInt(a.address,a.mask ?? 32,a.toMask ?? 64,a.abbreviate);return json({...r,size:String(r.size)});}
                if(a.operation==='ptr')return {text:ip6.ptr(a.address,a.mask ?? 32)};
                return json({normalized:ip6.normalize(a.address),abbreviated:ip6.abbreviate(a.address),valid:true});
            }
            if(!['inspect','wildcard'].includes(a.operation))fail();
            if(a.operation==='wildcard') {const r=new WildcardCalc(a.address,a.wildcard);return json({ip:r.ipInfo(),wildcard:getWildcardInfo(a.wildcard),contiguous:isContiguousWildcard(a.wildcard),count:r.matchCount(),first:r.firstMatch(),last:r.lastMatch(),pattern:r.matchPattern()});}
            const r=new IPv4(a.address,a.available?String(getMaskBitByAvailable(a.available)):String(a.mask ?? 24));
            return json({ip:r.ipInfo(),mask:r.maskInfo(),available:r.available(),size:r.size(),network:r.base(),first:r.first(),last:r.last(),broadcast:r.broadcast()});
        }
        case "cron_inspect": {
            new Intl.DateTimeFormat('en',{timeZone:a.timezone}).format();
            if(!/(Z|[+-]\d\d:\d\d)$/.test(a.currentDate)||!Number.isFinite(Date.parse(a.currentDate)))fail();
            const c=cron.parseExpression(a.expression,{tz:a.timezone,currentDate:a.currentDate});
            return json({description:cronstrue.toString(a.expression),dates:Array.from({length:a.count ?? 5},()=>c.next().toISOString())});
        }
        case "time_operate": {
            if(a.operation==='workdays'||a.operation==='addWorkdays') {const r=a.operation==='workdays'?countWorkdays(a.value,a.other):addWorkdays(a.value,a.amount);if(!r.ok)throw new ToolError(r.error,"工作日计算仅支持有效日期，年份范围2004—2026");return json(r.value);}
            new Intl.DateTimeFormat('en',{timeZone:a.timezone ?? 'UTC'}).format();
            let d;let submillisecond=0n;
            if(a.from==='seconds'||a.from==='milliseconds'||a.from==='nanoseconds') {
                if(!/^-?\d+$/.test(a.value))fail();const n=BigInt(a.value);let ms=a.from==='seconds'?n*1000n:a.from==='nanoseconds'?n/1000000n:n;
                if(a.from==='nanoseconds'){if(n<0n&&n%1000000n)ms--;submillisecond=n-ms*1000000n;}
                if(ms>8640000000000000n||ms< -8640000000000000n)fail();d=dayjs(Number(ms));
            }else d=isoDate(a.value);
            if(!d.isValid())fail();d=d.tz(a.timezone ?? 'UTC');
            if(a.operation==='difference'){const other=isoDate(a.other);return json({milliseconds:String(d.valueOf()-other.valueOf()),seconds:String(d.diff(other,'second')),days:d.diff(other,'day',true)});}
            if(a.operation==='add'){if(!Number.isSafeInteger(a.amount)||!a.unit)fail();d=d.add(a.amount,a.unit).tz(a.timezone ?? 'UTC');}
            const nanos=BigInt(d.valueOf())*1000000n+submillisecond;
            return json({iso:d.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),formatted:d.format(a.format ?? 'YYYY-MM-DD HH:mm:ss'),seconds:String(d.unix()),milliseconds:String(d.valueOf()),nanoseconds:String(nanos),secondsExact:new BigNumber(String(nanos)).dividedBy(1000000000).toFixed(),millisecondsExact:new BigNumber(String(nanos)).dividedBy(1000000).toFixed(),weekday:d.day(),daysInMonth:d.daysInMonth()});
        }
        default:throw new ToolError("unknown_tool","工具不存在");
    }
}
