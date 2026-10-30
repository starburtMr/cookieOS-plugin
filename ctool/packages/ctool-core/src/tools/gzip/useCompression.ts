import {shallowRef, watch} from "vue";
import Text from "@/helper/text";
import {runTask} from "@/helper/cookieos/task";

export function useCompression(source: () => {input: {text: Text}, deflate?: boolean}, kind: "inflate" | "gzip") {
    const output = shallowRef(Text.empty());
    watch(source, async (current, _, onCleanup) => {
        const abort = new AbortController(); onCleanup(() => abort.abort());
        if (current.input.text.isEmpty() || current.input.text.isError()) { output.value = current.input.text; return; }
        try {
            const result = await runTask<Uint8Array>(kind, {base64: current.input.text.toBase64(), deflate: current.deflate ?? false}, abort.signal);
            if (!abort.signal.aborted) output.value = Text.fromUint8Array(result).setExtension(kind === "gzip" ? ".gz" : ".txt");
        } catch (e) { if (!abort.signal.aborted) output.value = Text.fromError($error(e)); }
    }, {immediate: true, deep: true});
    return output;
}
