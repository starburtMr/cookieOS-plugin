import {afterEach, describe, expect, it, vi} from "vitest";
import {createRenderer, defineComponent, nextTick, ref} from "vue";
import {aiActivities, useHostAi} from "./ai";

const renderer = createRenderer({
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    insert: () => {}, remove: () => {}, setText: () => {}, setElementText: () => {},
    parentNode: () => null, nextSibling: () => null, patchProp: () => {},
});
let cleanup = () => {};
afterEach(() => { cleanup(); aiActivities.splice(0); vi.unstubAllGlobals(); });
function setup(code = "") {
    const stream = vi.fn(async (_request, {signal}) => {
        const failure = Object.assign(new Error(code), {code, callId: "same-call", partialText: "partial"});
        const result = code ? Promise.reject(failure) : Promise.resolve({text: "answer", truncated: false, model: {providerName: "Fixture", modelName: "Model"}, usage: null});
        void result.catch(() => {});
        return {callId: "same-call", result, events: (async function* () {
            yield {type: "delta", text: "partial"};
            if (signal.aborted) throw Object.assign(new Error("cancelled"), {code: "model_cancelled"});
            if (code) throw failure;
        })()};
    });
    const status = vi.fn(async () => ({status: "completed", text: "recovered"}));
    vi.stubGlobal("window", {xhub: {models: {stream, status}}});
    const input = ref("original");
    let chat!: ReturnType<typeof useHostAi>;
    const app = renderer.createApp(defineComponent({setup() { chat = useHostAi(() => input.value); return () => null; }}));
    app.mount({}); cleanup = () => app.unmount();
    return {chat, input, stream, status};
}
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); await nextTick(); };
describe("cookieOS model lifecycle", () => {
    it("waits for explicit acceptance and uses only the requested model/messages", async () => {
        const {chat, stream} = setup();
        const answer = chat([{role: "user", content: "my text"}], {model: "stable-ref"});
        await tick(); expect(aiActivities[0].ready).toBe(true);
        expect(stream.mock.calls[0][0]).toEqual({model: {mode: "explicit", ref: "stable-ref"}, messages: [{role: "user", content: "my text"}]});
        aiActivities[0].accept!(); expect(await answer).toEqual({content: "answer"});
    });
    it.each(["input", "unmount", "new-call"])("prevents stale acceptance after %s", async reason => {
        const {chat, input} = setup();
        const answer = chat([{role: "user", content: "a"}], {model: ""}).catch(e => e);
        await tick();
        if (reason === "input") input.value = "changed";
        if (reason === "unmount") cleanup();
        if (reason === "new-call") {
            const next = chat([{role: "user", content: "b"}], {model: ""}).catch(e => e);
            await tick(); aiActivities.at(-1)!.close(); await next;
        }
        await tick(); expect((await answer).message).toContain("停止"); expect(aiActivities.some(a => a.ready)).toBe(false);
    });
    it.each(["model_no_default", "model_missing", "model_disabled", "model_credentials", "model_timeout", "model_cancelled", "model_stream_interrupted", "model_call_unknown"])("handles %s without replay or discarding partial output", async code => {
        const {chat, stream, status} = setup(code);
        await expect(chat([{role: "user", content: "a"}], {model: ""})).rejects.toThrow();
        expect(aiActivities[0].text).toBe("partial"); expect(aiActivities[0].ready).toBe(false); expect(stream).toHaveBeenCalledTimes(1);
        if (["model_stream_interrupted", "model_call_unknown"].includes(code)) { await aiActivities[0].check!(); expect(status).toHaveBeenCalledWith("same-call"); expect(aiActivities[0].text).toBe("recovered"); }
        expect(stream).toHaveBeenCalledTimes(1);
    });
});
