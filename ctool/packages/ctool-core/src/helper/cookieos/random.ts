export function secureRandomInt(max: number) {
    if (!Number.isSafeInteger(max) || max < 1 || max > 0x100000000) throw new Error("随机数范围不正确");
    const limit = Math.floor(0x100000000 / max) * max;
    const buffer = new Uint32Array(1);
    do { crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
    return buffer[0] % max;
}

export function checkRandomSize(length: number, amount: number) {
    if (!Number.isSafeInteger(length) || !Number.isSafeInteger(amount) || length < 1 || amount < 1 || length > 4096 || amount > 1000 || length * amount > 204800) throw new Error("长度或数量过大，请减少生成内容");
}
