export const numberStatistics = (text: string) => {
    const input = text.trim();
    if (!input) {
        return { count: 0, sum: '', avg: '', median: '', min: '', max: '', range: '', stddev: '' };
    }

    // 提取所有数字（支持负数、小数、科学计数法）
    const numbers: number[] = [];
    const lines = input.split('\n');
    for (const line of lines) {
        // 按空格、逗号、制表符分割
        const parts = line.trim().split(/[\s,]+/);
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed === '') continue;
            const num = Number(trimmed);
            if (!isNaN(num)) {
                numbers.push(num);
            }
        }
    }

    if (numbers.length === 0) {
        return { count: 0, sum: '', avg: '', median: '', min: '', max: '', range: '', stddev: '' };
    }

    const count = numbers.length;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const range = max - min;

    // 中位数
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    // 标准差
    const variance = numbers.reduce((acc, n) => acc + (n - avg) ** 2, 0) / count;
    const stddev = Math.sqrt(variance);

    // 格式化：避免浮点精度问题，最多保留 10 位小数
    const fmt = (n: number) => {
        const s = n.toPrecision(15);
        return parseFloat(s).toString();
    };

    return {
        count,
        sum: fmt(sum),
        avg: fmt(avg),
        median: fmt(median),
        min: fmt(min),
        max: fmt(max),
        range: fmt(range),
        stddev: fmt(stddev),
    };
};
