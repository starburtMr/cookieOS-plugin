import {has, isEmpty, merge} from "lodash";
import type {Option as TargetOption} from "./type";
import {languages, optionDefinitions} from "./optionMetadata";
export {languages};
const getOptions = (lang: string): TargetOption[] => {
    if (!Object.hasOwn(optionDefinitions, lang)) throw new Error("Error Lang");
    return optionDefinitions[lang].map(item => ({...item}));
};

const getDefaultOption = (lang: string) => {
    const data: Record<string, any> = {}
    for (const item of getOptions(lang)) {
        data[item.name] = item.defaultValue
    }
    return data
}

export class Option {
    public __: "_history_serializable_" = "_history_serializable_";

    public lang: string = ""
    public option: Record<string, any> = {}

    constructor(lang: string = "") {
        this.lang = lang;

        const lists: Record<string, any> = {}
        for (const language of languages) {
            lists[language] = getDefaultOption(language)
        }

        this.option = lists
    }

    define(): TargetOption[] {
        if (this.lang === ""){
            return []
        }
        return getOptions(this.lang).sort((a, b) => {
            const index = {
                'string': 1,
                'boolean': 2,
                'select': 3,
            }
            if (a.type === b.type) {
                return 0
            }
            return index[a.type] < index[b.type] ? -1 : 1
        })
    }

    isSaveHistory(): boolean {
        return true;
    }

    serialize(): Record<string, any> {
        const option: Record<string, any> = {}
        if (this.lang in this.option) {
            option[this.lang] = this.option[this.lang]
        }
        return {
            __: this.__,
            lang: this.lang,
            ...(isEmpty(option) ? {} : {option}),
        }
        return {};
    }

    unserialize(data?: Record<string, any>) {
        if (!data) {
            return this;
        }
        const item = new Option()
        if (has(data, 'lang')) {
            item.lang = data.lang
        }
        if (has(data, 'option')) {
            item.option = merge(item.option, data.option)
        }
        return item
    }
}

export const getOption = (lang: string = "") => {
    return new Option(lang)
}


