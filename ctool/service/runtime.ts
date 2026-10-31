import {fork } from "node:child_process";
import type {ChildProcess} from "node:child_process";
import {randomUUID} from "node:crypto";
import {ToolError} from "ctool-tools";

type Job = {id: string; name: string; args: unknown; resolve: (value: any) => void; reject: (reason: Error) => void; signal: AbortSignal; timer: ReturnType<typeof setTimeout>; abort: () => void};
type Slot = {child: ChildProcess; job?: Job};

/** Fixed trusted worker processes isolate synchronous/native operations from HTTP. */
export class TaskPool {
    private slots: Slot[] = [];
    private queue: Job[] = [];
    private closed = false;
    constructor(private workerUrl = new URL("./worker.mjs", import.meta.url), private concurrency = 2) {}
    run(name: string, args: unknown, signal: AbortSignal, timeoutMs = 10000): Promise<any> {
        if (this.closed || signal.aborted) return Promise.reject(new ToolError("cancelled", "处理已停止"));
        if (this.queue.length >= 16) return Promise.reject(new ToolError("busy", "工具正忙，请稍后重试"));
        return new Promise((resolve, reject) => {
            const job = {id: randomUUID(), name, args, resolve, reject, signal} as Job;
            job.abort = () => this.cancel(job, new ToolError("cancelled", "处理已停止"));
            job.timer = setTimeout(() => this.cancel(job, new ToolError("timeout", "处理超时，请减少内容")), timeoutMs);
            signal.addEventListener("abort", job.abort, {once: true});
            this.queue.push(job);
            this.dispatch();
        });
    }
    private finish(job: Job, error?: Error, value?: unknown) {
        clearTimeout(job.timer); job.signal.removeEventListener("abort", job.abort);
        if (error) job.reject(error); else job.resolve(value);
    }
    private cancel(job: Job, error: Error) {
        const i = this.queue.indexOf(job);
        if (i >= 0) this.queue.splice(i, 1);
        else {
            const slot = this.slots.find(s => s.job === job);
            if (!slot) return;
            slot.job = undefined;
            this.slots.splice(this.slots.indexOf(slot), 1);
            slot.child.kill("SIGKILL");
        }
        this.finish(job, error); this.dispatch();
    }
    private create(): Slot {
        // Workers receive only explicit operation data, never service/model credentials.
        const child = fork(this.workerUrl, [], {stdio: ["ignore", "ignore", "ignore", "ipc"], execArgv: ["--max-old-space-size=256"], env: {NODE_ENV: "production", PATH: process.env.PATH}, serialization: "advanced"});
        const slot: Slot = {child}; this.slots.push(slot);
        child.on("message", (message: any) => {
            const job = slot.job;
            if (!job || message?.id !== job.id) return;
            slot.job = undefined;
            this.finish(job, message.ok ? undefined : new ToolError(message.code || "invalid_arguments", message.message || "内容无法处理，请检查输入"), message.value);
            this.dispatch();
        });
        const exit = () => {
            const i = this.slots.indexOf(slot); if (i < 0) return;
            this.slots.splice(i, 1);
            if (slot.job) this.finish(slot.job, new ToolError("worker_failed", "处理未完成，请减少内容后重试"));
            this.dispatch();
        };
        child.once("exit", exit); child.once("error", exit);
        return slot;
    }
    private dispatch() {
        while (!this.closed && this.queue.length) {
            const slot = this.slots.find(s => !s.job) ?? (this.slots.length < this.concurrency ? this.create() : undefined);
            if (!slot) break;
            const job = this.queue.shift()!; slot.job = job;
            slot.child.send({id: job.id, name: job.name, args: job.args}, error => {
                if (error && slot.job === job) this.cancel(job, new ToolError("worker_failed", "处理未完成"));
            });
        }
    }
    close() {
        this.closed = true;
        for (const job of this.queue.splice(0)) this.finish(job, new ToolError("cancelled", "工具已关闭"));
        for (const slot of this.slots.splice(0)) {
            if (slot.job) this.finish(slot.job, new ToolError("cancelled", "工具已关闭"));
            slot.child.kill("SIGKILL");
        }
    }
}
