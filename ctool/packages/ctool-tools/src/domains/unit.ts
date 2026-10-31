import { create, all } from "mathjs"; //科学计数法小数点后位数
import {config} from "./unitConfig";
import type {ConfigType} from "./unitConfig";
const math = create(all, {
    number: "BigNumber",
});

const MAX_NUM = 14;       //格式化后的最长限制
const DECIMAL_NUM = 7;    //四舍五入时小数点后位数
const EXPONENTIAL_NUM = 4;
export {config} from "./unitConfig";

export const getGroupByUnit = (type: string, unit: string) => {
    for (const group of getType(type).group) {
        if (group.list.includes(unit)) {
            return group.key;
        }
    }
    return "";
};

export const calculate = function(type: string, num: string, from: string, to: string) {
    const fromUnit = getUnit(type, from);
    if (from === to) {
        return format(num);
    }
    const toUnit = getUnit(type, to);

    const special = getSpecial(type, from, to);

    const calc = (input: string, expression: string) => {
        return math.evaluate(expression.replaceAll("x", input)).toString();
    };
    if (special !== null) {
        num = calc(num, special);
    } else {
        num = calc(calc(num, fromUnit.init), toUnit.calc);
    }
    return format(num);
};

export const getType = (name: string): ConfigType => {
    for (const type of config) {
        if (name === type.key) {
            return type;
        }
    }
    throw new Error(`${name} type not found`);
};

export const getUnit = (type: string, unitKey: string) => {
    for (const unit of getType(type).unit) {
        if (unitKey === unit.key) {
            return unit;
        }
    }
    throw new Error(`${type} - ${unitKey} unit not found`);
};

const getSpecial = (name: string, from: string, to: string) => {
    const type = getType(name);
    if (type.special.length > 0) {
        for (const special of type.special) {
            if (special["from"] === from && special["to"] === to) {
                return special["func"];
            }
        }
    }
    return null;
};

/*
 * 对结果进行格式化(内部使用)
 */
const format = function(_num: string) {
    let num = Number(_num);

    //格式策略，整体不超过14位
    const strNum = `${num}`;
        let isFloat = false;
        let arr; let intPart; let decPart;
    //只有包括.且整数位小于14位才认为是浮点数（便于以后格式化）
    if (strNum.indexOf(".") > -1) {
        const match = strNum.match(/\.\d+e[+-](\d+)$/);
        if (match && match[1]) {
            isFloat = (match[1] as any) * 1 < (MAX_NUM - 1);
        } else {
            isFloat = true;
        }
    }
    //小数处理逻辑
    if (isFloat) {
        //-1 ~ 1之间的小数
        if (num > -1 && num < 1 && num != 0) {
            //小数位开始有5个及以上0，转换为科学计数法，计数小数保留四位
            if (Math.abs(num) < 0.00001) {
                return exponential(num, EXPONENTIAL_NUM);
            } else {
                //保留7位小数
                num = Number(num.toFixed(DECIMAL_NUM));
            }
        } else {
            arr = strNum.split(".");
            intPart = arr[0];
            decPart = arr[1];
            //整体超长
            if (strNum.length > MAX_NUM) {
                //整数部分超长
                if (intPart.length >= MAX_NUM) {
                    return exponential(num, EXPONENTIAL_NUM);
                } else {
                    if (intPart.length < DECIMAL_NUM - 1) {
                        num = Number(num.toFixed(DECIMAL_NUM));
                    } else {
                        num = Number(num.toFixed(MAX_NUM - intPart.length - 1));
                    }
                }
            } else {
                if (decPart.length > DECIMAL_NUM) {
                    num = Number(num.toFixed(DECIMAL_NUM));
                }
            }
        }
    } else {
        if (strNum.length > MAX_NUM) {
            return exponential(num, EXPONENTIAL_NUM);
        }
    }
    return `${num}`;
};

// 科学计数法快捷函数
const exponential = (num: number, n: number) => {
    //保留科学计数法小数后n位
    const numExp = num.toExponential(n);
    //如果计数小数位均为0，去掉
    return (numExp + "").match(new RegExp(".0{" + n + "}e")) ? num.toExponential(0) : numExp;
};
