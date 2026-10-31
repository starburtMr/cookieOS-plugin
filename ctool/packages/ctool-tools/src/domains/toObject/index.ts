import {Transform} from "./type";
import QuickType from "./quickType";
import Protobuf from "./protobuf";
import Php from "./php/";

export {languages, Option, getOption} from "./options";

const handlers: Transform[] = [
    new Protobuf,
    new Php,
    new QuickType,
]

const getHandler = (lang: string) => {
    for (const handler of handlers) {
        if (handler.getLanguages().includes(lang)) {
            return handler
        }
    }
    throw new Error("Error Lang")
}

export const transform = async (lang: string, input: string, options: Record<string, any>) => {
    return getHandler(lang).execute(lang, input, options);
}

