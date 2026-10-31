import Text from "./text";
import pinyin from "./pinyin";
import {convent} from "./nameConvert";
import {convert} from "./zhNumber";
import {parseStackTrace, preprocessInput} from "./stacktrace";
import {ToolError} from "../index";

export const textMethods = ["upper","lower","upperLineStart","lowerLineStart","upperStart","lowerStart","zhTran","replace","regularReplace","lineRemoveRepeat","removeLineIndex","addLineIndex","sort","lineTrim","filterBlankLine","filterAllBr","replacePunctuation","escape","unescape","rename","stat"] as const;
export function textOperation(name: string, a: Record<string, any>) {
    switch(name) {
        case "text_operate": {
            if (!textMethods.includes(a.operation)) throw new ToolError("invalid_arguments","文本操作不正确");
            const instance = new Text(a.text);
            const value = instance[a.operation as typeof textMethods[number]](a.options ?? {});
            return {text:typeof value === "string" ? value : JSON.stringify(value)};
        }
        case "name_convert": return {text:convent(a.text,a.style)};
        case "pinyin_convert": return {text:pinyin(a.text,a.delimiter ?? " ",a.options)};
        case "zh_number_convert": return {text:convert(a.text,a.from,a.to,a.traditional)};
        case "stacktrace_parse": {
            const input = preprocessInput(a.text);
            return {text:JSON.stringify({...parseStackTrace(input.stackText),meta:input.meta ?? {}})};
        }
        case "regex_execute": {
            const regex = new RegExp(a.pattern,a.flags ?? "g");
            if (a.operation === "replace" || a.operation === "delete") return {text:a.text.replace(regex,a.operation === "delete" ? "" : a.replacement ?? "")};
            if (a.operation === "extract") return {text:JSON.stringify(a.text.match(regex) ?? [])};
            const matches: unknown[] = [];
            for (;;) {
                const m=regex.exec(a.text);if(!m)break;
                matches.push({text:m[0],index:m.index,captures:m.slice(1).map(v=>v ?? null),groups:m.groups ?? {}});
                if(matches.length>=10000)throw new ToolError("output_limit","匹配数量超过上限");
                if(!regex.global&&!regex.sticky)break;
                if(!m[0].length)regex.lastIndex++;
            }
            return {text:JSON.stringify(matches)};
        }
        default: throw new ToolError("unknown_tool","工具不存在");
    }
}
