import {colord,extend} from "colord";
import cmykPlugin from "colord/plugins/cmyk";
import hwbPlugin from "colord/plugins/hwb";
import labPlugin from "colord/plugins/lab";
import xyzPlugin from "colord/plugins/xyz";
import namesPlugin from "colord/plugins/names";
import lchPlugin from "colord/plugins/lch";
extend([cmykPlugin,hwbPlugin,namesPlugin,lchPlugin,labPlugin,xyzPlugin]);
export const convertColor = (input: string, source: string, target: string) => {
    if (input === "") {
        return "";
    }
    try {
        const color = colord(["hsv", "lab", "xyz"].includes(source) ? JSON.parse(input) : input);
        if(!color.isValid())throw new Error("颜色格式不正确");
        if(source===target)return input;
        let result = "";
        
        if (target === "name") {
            result = color.toName({ closest: true }) ?? "";
        }
        if (target === "hex") {
            result = color.toHex();
        }
        if (target === "rgb") {
            result = color.toRgbString();
        }
        if (target === "hsl") {
            result = color.toHslString();
        }
        if (target === "hwb") {
            result = color.toHwbString();
        }
        if (target === "cmyk") {
            result = color.toCmykString();
        }
        if (target === "lch") {
            result = color.toLchString();
        }
        if (target === "hsv") {
            result = JSON.stringify(color.toHsv());
        }
        if (target === "lab") {
            result = JSON.stringify(color.toLab());
        }
        if (target === "xyz") {
            result = JSON.stringify(color.toXyz());
        }
        return result;
    } catch (e) {
        throw e;
    }
};

