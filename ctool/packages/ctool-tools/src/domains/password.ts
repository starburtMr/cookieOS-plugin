import {secureRandomInt,checkRandomSize} from "./random";
export type PasswordOptions={length:number;amount:number;uppercase:boolean;lowercase:boolean;digits:boolean;symbols:boolean;excludeAmbiguous:boolean;ensureEachType:boolean};
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
export const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";
export const AMBIGUOUS = "0Oo1lI";

const secureRandom = secureRandomInt;

const filterAmbiguous = (chars: string): string => {
    return chars.split("").filter(c => !AMBIGUOUS.includes(c)).join("");
};

export const generatePasswords = (opt: PasswordOptions) => {
    checkRandomSize(opt.length, opt.amount);
    // 构建字符池
    let pool = "";
    const pools: string[] = [];
    if (opt.uppercase) { const p = opt.excludeAmbiguous ? filterAmbiguous(UPPER) : UPPER; pool += p; pools.push(p); }
    if (opt.lowercase) { const p = opt.excludeAmbiguous ? filterAmbiguous(LOWER) : LOWER; pool += p; pools.push(p); }
    if (opt.digits) { const p = opt.excludeAmbiguous ? filterAmbiguous(DIGITS) : DIGITS; pool += p; pools.push(p); }
    if (opt.symbols) { pool += SYMBOLS; pools.push(SYMBOLS); }
    if (pool.length === 0) throw new Error("请选择至少一种字符类型");
    if(opt.ensureEachType && opt.length < pools.length) throw new Error("长度不足以包含所选字符类型");

    const results: string[] = [];
    for (let i = 0; i < opt.amount; i++) {
        const pwd: string[] = [];
        // 确保每类至少 1 个
        if (opt.ensureEachType && opt.length >= pools.length) {
            for (const p of pools) {
                pwd.push(p[secureRandom(p.length)]);
            }
        }
        // 填充剩余
        while (pwd.length < opt.length) {
            pwd.push(pool[secureRandom(pool.length)]);
        }
        // Fisher-Yates 洗牌
        for (let j = pwd.length - 1; j > 0; j--) {
            const k = secureRandom(j + 1);
            [pwd[j], pwd[k]] = [pwd[k], pwd[j]];
        }
        results.push(pwd.join(""));
    }
    return results;
};
