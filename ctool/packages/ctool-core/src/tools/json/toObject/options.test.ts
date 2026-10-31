import {expect,it} from "vitest";
import QuickType from "ctool-tools/domains/toObject/quickType";
import Protobuf from "ctool-tools/domains/toObject/protobuf";
import Php from "ctool-tools/domains/toObject/php/index";
import {languages, Option} from "ctool-tools/domains/toObject/options";
import {optionDefinitions} from "ctool-tools/domains/toObject/optionMetadata";

it("keeps every runtime language, option, default and saved selection in lightweight metadata",()=>{
    const handlers=[new Protobuf(),new Php(),new QuickType()];
    expect(languages).toEqual([...new Set(handlers.flatMap(h=>h.getLanguages()))]);
    expect(languages).toHaveLength(28);
    const all=new Option();
    for(const lang of languages){
        const actual=handlers.find(h=>h.getLanguages().includes(lang))!.getOptionDefine(lang);
        expect(JSON.parse(JSON.stringify(actual))).toEqual(optionDefinitions[lang]);
        expect(all.option[lang]).toEqual(Object.fromEntries(actual.map(v=>[v.name,v.defaultValue])));
        const selected=new Option(lang);expect(selected.define()).toHaveLength(actual.length);
        const name=actual[0]?.name;
        if(name)selected.option[lang][name]=typeof actual[0].defaultValue==='boolean'?!actual[0].defaultValue:'saved';
        const saved=selected.serialize();expect(all.unserialize(saved).serialize()).toEqual(saved);
    }
    expect(new Option().define()).toEqual([]);expect(()=>new Option('unknown').define()).toThrow('Error Lang');
});
