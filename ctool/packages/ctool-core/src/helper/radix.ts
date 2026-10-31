import {convertRadix, defaultAlphabet} from "ctool-tools/domains/primitives";
export {defaultAlphabet};
export default (value: string | number, source: number, target: number, alphabet = "") => convertRadix(value, source, target, alphabet || defaultAlphabet);
