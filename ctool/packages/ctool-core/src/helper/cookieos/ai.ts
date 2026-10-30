import {onUnmounted, reactive, watch} from "vue";
import type {AiConfig, ChatMessage, ChatResult} from "../llm";

type Activity = {id: number; text: string; status: string; running: boolean; ready: boolean; stop: () => void; accept?: () => void; close: () => void; check?: () => Promise<void>; detail?: string};
export const aiActivities = reactive<Activity[]>([]);
let sequence = 0;

export function useHostAi(snapshot: () => string) {
    let current: AbortController | undefined;
    const stop = () => current?.abort();
    watch(snapshot, stop);
    onUnmounted(stop);
    return async (messages: ChatMessage[], config: AiConfig): Promise<ChatResult> => {
        stop();
        if (!window.xhub?.models) throw new Error("请更新 cookieOS 后使用 AI 辅助");
        const before = snapshot();
        const controller = new AbortController(); current = controller;
        const id = ++sequence;
        const entry = reactive<Activity>({id, text: "", status: "正在生成", running: true, ready: false, stop: () => controller.abort(), close: () => {
            controller.abort(); const index = aiActivities.findIndex(a => a.id === id); if (index >= 0) aiActivities.splice(index, 1);
        }});
        while (aiActivities.length >= 3) aiActivities[0].close();
        aiActivities.push(entry);
        try {
            const call = await window.xhub.models.stream({model: config.model ? {mode: "explicit", ref: config.model} : {mode: "default"}, messages}, {signal: controller.signal});
            entry.check = async () => {
                try {
                    const status = await window.xhub.models.status(call.callId);
                    entry.text = status.text || entry.text;
                    entry.status = status.status === "completed" ? "已确认完成，请复制结果使用" : status.status === "unknown" ? "结果仍待确认，请勿重复提交" : `调用状态：${status.status}`;
                } catch { entry.status = "暂时无法确认结果，请稍后查询"; }
            };
            for await (const event of call.events) {
                if (event.type === "delta") entry.text += event.text;
                if (event.type === "status") entry.status = event.status === "queued" ? "等待生成" : event.status === "running" ? "正在生成" : entry.status;
                if (entry.text.length > 1048576) { controller.abort(); throw new Error("结果超过上限"); }
            }
            const result = await call.result;
            entry.text = result.text; entry.running = false; entry.check = undefined;
            entry.detail = `${result.model.providerName} / ${result.model.modelName} · ${result.usage?.inputTokens != null || result.usage?.outputTokens != null ? `输入 ${result.usage?.inputTokens ?? "未提供"} / 输出 ${result.usage?.outputTokens ?? "未提供"} tokens` : "用量未提供"}`;
            if (controller.signal.aborted || snapshot() !== before) throw new Error("输入已变化，本次结果未应用");
            entry.status = result.truncated ? "输出已截断，请检查后使用" : "生成完成"; entry.ready = true;
            await new Promise<void>((resolve, reject) => {
                const cancel = () => { entry.ready = false; reject(new Error("已停止，本次结果未应用")); };
                controller.signal.addEventListener("abort", cancel, {once: true});
                entry.accept = () => { controller.signal.removeEventListener("abort", cancel); entry.ready = false; resolve(); };
                if (controller.signal.aborted) cancel();
            });
            if (snapshot() !== before || controller.signal.aborted) throw new Error("输入已变化，本次结果未应用");
            entry.status = "已使用";
            return {content: result.text};
        } catch (error) {
            entry.running = false; entry.ready = false;
            const e = error as {code?: string; partialText?: string; callId?: string};
            if (e.partialText) entry.text = e.partialText;
            const unknown = ["model_call_unknown", "model_stream_interrupted"].includes(e.code ?? "");
            if (!unknown) entry.check = undefined;
            else if (!entry.check && e.callId) entry.check = async () => {
                try { const state = await window.xhub.models.status(e.callId!); entry.text = state.text || entry.text; entry.status = state.status === "completed" ? "已确认完成，请复制结果使用" : "结果仍待确认，请勿重复提交"; }
                catch { entry.status = "暂时无法确认结果，请稍后查询"; }
            };
            entry.status = controller.signal.aborted ? "已停止，内容未应用" : unknown ? "结果待确认，请勿重复提交" : "生成未完成，请检查模型设置或稍后重试";
            throw new Error(entry.status);
        } finally { if (current === controller) current = undefined; }
    };
}
