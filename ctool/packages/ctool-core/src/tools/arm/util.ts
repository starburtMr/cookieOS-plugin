import {onUnmounted, ref} from "vue";
import Message from "@/helper/message";


export type Field = "arm64" | "arm" | "thumb" | "armbe" | "thumbbe"
export type Response = { asm?: Partial<Record<Field, [boolean, string]>>, hex?: Partial<Record<Field, [boolean, string]>> } | ""
export type InitializeType = {
    input: string,
    offset: string,
    prefix_0x?: false,
    swap_endian?: false,
    response: Response,
}

const swap = (text: string, size: number, prefix: string, swap_endian: boolean) => {
    if (!text || text.startsWith('#')) {
        // this is an error, not actual code
        return text;
    }
    if (!swap_endian) {
        return prefix + text;
    }
    const size_chars = size * 2;
    let result = '';
    for (let i = 0; i < text.length; i += size_chars) {
        const chunk = text.slice(i, i + size_chars);
        for (let j = chunk.length; j > 0; j -= 2) {
            result += chunk.slice(j - 2, j);
        }
    }
    return prefix + result;
}

export const handleResult = (type: "asm" | "hex", field: Field, {response, prefix_0x = false, swap_endian = false}: InitializeType) => {
    if (response === "") {
        return ""
    }

    const text = response[type]?.[field]?.[1]
    if (text === undefined) {
        return "";
    }
    if (!prefix_0x && !swap_endian) {
        return text;
    }

    const size: Record<Field, number> = {
        arm64: 4,
        arm: 4,
        armbe: 4,
        thumb: 2,
        thumbbe: 2
    }
    // prefix_0x && swap_endian
    return text.split('\n').map((line) => {
        return swap(line, size[field], prefix_0x ? "0x" : "", swap_endian)
    }).join('\n');
}

export const request = (data: Record<string, unknown>) => {
    return window.xhub.tools.call("arm_convert", data).then(data => ({data: data as Response}))
}


export function useArmConversion(action: {current: InitializeType; success: () => void}, mode: "asm" | "hex", arch: Field[]) {
    const loading = ref(false);
    let active = true;
    onUnmounted(() => { active = false; });
    const convert = async () => {
        if (loading.value) return;
        const {input, offset} = action.current;
        if (!input.trim()) { action.current.response = ""; return; }
        loading.value = true;
        try {
            const {data} = await request({[mode]: input, offset, arch});
            if (!active || input !== action.current.input || offset !== action.current.offset) return;
            action.current.response = data;
            if (data && Object.values(data.hex ?? data.asm ?? {}).some(tuple => !tuple?.[0])) Message.info("部分架构未能转换，请查看对应结果");
            else action.success();
        } catch (e) { if (active) Message.error($error(e)); }
        finally { loading.value = false; }
    };
    return {loading, convert};
}
