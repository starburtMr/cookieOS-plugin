export function runTask<T = unknown>(kind: string, args: unknown, signal: AbortSignal): Promise<T> {
    const payload = JSON.stringify(args);
    if (payload.length > 12 * 1024 * 1024) return Promise.reject(new Error("内容过大，请减少输入"));
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("./task.worker.ts", import.meta.url), {type: "module"});
        const finish = (error?: Error, value?: T) => {
            clearTimeout(timer); signal.removeEventListener("abort", abort); worker.terminate();
            error ? reject(error) : resolve(value!);
        };
        const abort = () => finish(new Error("已取消"));
        const timer = setTimeout(() => finish(new Error("处理超时，请缩小输入或简化表达式")), 4000);
        worker.onmessage = ({data}) => data.ok ? finish(undefined, data.value) : finish(new Error(data.error));
        worker.onerror = event => { event.preventDefault(); finish(new Error("处理失败，请检查输入")); };
        signal.addEventListener("abort", abort, {once: true});
        if (signal.aborted) return abort();
        worker.postMessage({kind, args: JSON.parse(payload)});
    });
}
