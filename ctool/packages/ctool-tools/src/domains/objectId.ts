import dayjs from "dayjs";
export const parseObjectId=(input:string)=>{
    input = input.trim();
    if (!input) {
        return { valid: false, timestamp: '', datetime: '', machineId: '', processId: '', counter: '' };
    }
    // 校验是否为合法的 24 位十六进制字符串
    if (!/^[0-9a-f]{24}$/i.test(input)) {
        return { valid: false, timestamp: '', datetime: '', machineId: '', processId: '', counter: '' };
    }

    try {
        // 提取时间戳（前 8 个字符 = 4 字节）
        const timestampHex = input.substring(0, 8);
        const unixTimestamp = parseInt(timestampHex, 16);
        const datetime = dayjs.unix(unixTimestamp).format('YYYY-MM-DD HH:mm:ss');

        // 提取机器标识（中间 10 个字符 = 5 字节，旧版为机器ID+进程ID）
        const machineId = input.substring(8, 14);
        const processId = input.substring(14, 18);
        const counter = input.substring(18, 24);

        return {
            valid: true,
            timestamp: String(unixTimestamp),
            datetime,
            machineId,
            processId,
            counter: String(parseInt(counter, 16)),
        };
    } catch {
        return { valid: false, timestamp: '', datetime: '', machineId: '', processId: '', counter: '' };
    }
};
export const createObjectId=()=>Math.floor(Date.now()/1000).toString(16).padStart(8,"0")+Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>b.toString(16).padStart(2,"0")).join("");
