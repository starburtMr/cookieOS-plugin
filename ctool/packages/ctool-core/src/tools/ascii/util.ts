import {asciiHidden as descriptions} from "ctool-tools/domains/ascii";
export {asciiMap, convent} from "ctool-tools/domains/ascii";
export type {ConventType} from "ctool-tools/domains/ascii";
export const asciiHidden = Object.fromEntries(Object.entries(descriptions).map(([key,label]) => [key,$t(label)]));
