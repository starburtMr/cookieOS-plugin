import CryptoJS from "crypto-js"
import sm from "sm-crypto"
import {Base64} from "js-base64";
import {encodeText,decodeText} from "./encoding";

export const methods = ['md5', 'sha1', 'sha256', 'sha512', 'sm3'] as const
export type methodType = typeof methods[number]

const hashMethod = {
    md5: (message: Uint8Array): string => {
        return CryptoJS.MD5(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message))).toString();
    },
    sha1: (message: Uint8Array): string => {
        return CryptoJS.SHA1(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message))).toString();
    },
    sha256: (message: Uint8Array): string => {
        return CryptoJS.SHA256(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message))).toString();
    },
    sha512: (message: Uint8Array): string => {
        return CryptoJS.SHA512(CryptoJS.enc.Base64.parse(Base64.fromUint8Array(message))).toString();
    },
    sm3: (message: Uint8Array): string => sm.sm3(message as any)
}

class Expression {
    parameter: Expression[] = []
    flag: string = "";

    constructor(flag = "root") {
        if (!['hash', '$input', '$salt', 'root'].includes(flag)) {
            throw new Error(`Expression Error (${flag})`)
        }
        this.flag = flag;
    }

    add(item) {
        this.parameter.push(item)
    }

    toString() {
        if (this.flag === "root") {
            let str = ""
            for (const i in this.parameter) {
                const item = this.parameter[i].toString()
                str += `${parseInt(i) > 0 ? '.' : ""}${item.toString()}`
            }
            return str
        }
        if (this.flag === "hash") {
            let str = ""
            for (const i in this.parameter) {
                const item = this.parameter[i].toString()
                str += `${parseInt(i) > 0 ? '.' : ""}${item.toString()}`
            }
            return `hash(${str})`
        }
        return this.flag
    }

    getResult(input: string, salt, hashFunc): string {
        if (this.flag === "$input") {
            return input
        }
        if (this.flag === "$salt") {
            return salt
        }
        const result: string[] = []
        for (const i in this.parameter) {
            result.push(this.parameter[i].getResult(input, salt, hashFunc))
        }
        if (this.flag === "root") {
            return result.join("")
        }
        return hashFunc(encodeText(result.join("")))
    }
}

const expressionParse = (str = "") => {
    const separator = "__@@@__";
    str = str.replace(/\(/g, `${separator}(${separator}`).replace(/\)/g, `${separator})${separator}`).replace(/\./g, `${separator}.${separator}`)
    const items = str.split(separator).filter((item) => item !== "")
    if (!['hash', '$input', '$salt'].includes(items[0])) {
        throw new Error(`Expression Error ${items[0]}`)
    }
    const root = new Expression();
    const stack: Expression[] = [root]
    let prev: Expression | null = null

    for (const item of items) {
        const current = stack[stack.length - 1]
        let itemExp: Expression | null = null;
        switch (item) {
            case ".":
                break;
            case "hash":
            case "$input":
            case "$salt":
                itemExp = new Expression(item)
                current.add(itemExp)
                prev = itemExp
                break;
            case "(":
                stack.push((prev as Expression))
                break;
            case ")":
                if (stack.length === 1) {
                    throw new Error(`Expression Error invalid ")"`)
                }
                stack.pop()
                break;
            default:
                throw new Error(`Expression Error invalid "${item}"`)
        }
    }
    if (stack.length > 1) {
        throw new Error(`Expression Error invalid "("`)
    }
    return root
}
// exp hash(hash($input.$salt).$salt)
export default (type: methodType, input: Uint8Array, salt: string = "", exp: string = "", encoding: string = "utf-8", provider?: (bytes: Uint8Array) => string): string => {
    if (!Object.keys(hashMethod).includes(type)) {
        throw new Error(`hash method 不存在: ${type}`)
    }
    const hashFunc = provider ?? ((str: Uint8Array) => hashMethod[type](str))
    if (exp === "") {
        return hashFunc(input)
    }
    return expressionParse(exp).getResult(decodeText(input,encoding), salt, hashFunc)
}
