import {config as units} from "ctool-tools/domains/unitConfig";
import {stringSchema as s} from "ctool-tools";
import {definition,choice,integer,boolean} from "./definitions";
export const calculationTools=[
    definition("radix_transform","2到64进制转换",{value:{type:"string",maxLength:8192},fromBase:integer(2,64),toBase:integer(2,64),alphabet:{type:"string",minLength:2,maxLength:64}},["value","fromBase","toBase"]),
    definition("binary_convert","整数原码、反码、补码",{value:{type:"string",pattern:"^[+-]?\\d+$",maxLength:1500},bits:{type:"integer",enum:[8,16,32,64,128,256,512,1024,2048,4096]},representation:choice("trueForm","inverse","complement")},["value","bits","representation"]),
    definition("unit_convert","单位转换",{value:{type:"string",maxLength:1000},group:choice(...units.map(g=>g.key)),from:choice(...new Set(units.flatMap(g=>g.unit.map(u=>u.key)))),to:choice(...new Set(units.flatMap(g=>g.unit.map(u=>u.key))))},["value","group","from","to"]),
    definition("number_statistics","数字统计；返回JSON文本",{text:s},["text"]),
    definition("uuid_operate","UUIDv4或ULID生成；返回JSON数组文本",{kind:choice("uuid","ulid"),count:integer(1,1000),hyphens:boolean,uppercase:boolean,bytes:boolean},[]),
    definition("random_generate","按指定字符表生成安全随机字符串；返回JSON数组文本",{alphabet:{type:"string",minLength:1,maxLength:4096},length:integer(1,4096),count:integer(1,1000)},["alphabet","length"]),
    definition("objectid_operate","生成或解析ObjectId；旧机器和进程字段仅为历史格式解释",{operation:choice("generate","parse"),value:{type:"string",maxLength:24}},["operation"]),
    definition("ip_calculate","IP子网、地址范围和反向解析；返回JSON文本",{version:choice("ipv4","ipv6"),operation:choice("inspect","subnet","range","ptr","wildcard"),address:{type:"string",maxLength:128},mask:{anyOf:[integer(0,128),{type:"string",maxLength:40}]},toMask:integer(0,128),count:integer(1,1000),random:boolean,abbreviate:boolean,wildcard:{type:"string",maxLength:128},available:integer(1,4294967294)},["version","operation","address"]),
    definition("cron_inspect","Cron描述及后续时间；不建立计划任务",{expression:{type:"string",maxLength:1000},timezone:{type:"string",maxLength:128},currentDate:{type:"string",maxLength:100},count:integer(1,100)},["expression","timezone","currentDate"]),
    definition("time_operate","时间戳、时区、日期计算、法定工作日；返回JSON文本",{operation:choice("inspect","add","difference","workdays","addWorkdays"),value:{type:"string",maxLength:100},other:{type:"string",maxLength:100},from:choice("iso","seconds","milliseconds","nanoseconds"),timezone:{type:"string",maxLength:128},format:{type:"string",maxLength:128},amount:integer(-100000,100000),unit:choice("year","month","week","day","hour","minute","second","millisecond")},["operation","value"]),
];
