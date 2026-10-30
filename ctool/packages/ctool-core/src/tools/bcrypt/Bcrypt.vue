<template>
    <HeightResize v-slot="{ height }" :append="['.ctool-page-option']">
        <div v-row="'1-1'">
            <Textarea :height="height" v-model="action.current.input" :float-text="$t('bcrypt_password')" :placeholder="$t('bcrypt_password')"
                      @click-float-text="$copy(action.current.input)" />
            <Textarea :height="height" v-model="action.current.hash" :float-text="$t('bcrypt_hash')" :placeholder="$t('bcrypt_hash')"
                      @click-float-text="$copy(action.current.hash)" />
        </div>
    </HeightResize>
    <div style="display: grid; grid-template-columns: 1fr 5px 1fr; grid-column-gap: 10px; margin-top: 5px" class="ctool-page-option">
        <div style="display: grid; grid-template-columns: 120px 120px 1fr; grid-column-gap: 5px">
            <Select v-model="action.current.rounds" :options="rounds" class="select-box" />
            <Select v-model="action.current.version" :options="versionOptions" class="select-box" />
            <Button
                :loading="generateLoading"
                @click="generate"
                type="primary"
                long
                :text="$t('bcrypt_generate')"
            />
        </div>
        <span style="display: flex; justify-content: center; align-items: center">|</span>
        <Button
            :loading="checkLoading"
            @click="check"
            type="primary"
            long
            :text="checkButtonText"
        />
    </div>
</template>

<script lang="ts" setup>
import { initialize, useAction } from "@/store/action";
import { watch, onUnmounted } from "vue";
import { range } from "lodash";
import {runTask} from "@/helper/cookieos/task";
import Message from "@/helper/message";

type InitializeType = {
    input: string
    rounds: number,
    hash: string,
    check_result: null | boolean,
    version: string
}

const action = useAction(await initialize<InitializeType>({
    input: "",
    rounds: 10,
    hash: '',
    check_result: null,
    version: '2a' // 默认版本
}, { paste: false }))

let generateLoading = $ref(false)
let checkLoading = $ref(false)

let pending: AbortController | undefined;
const snapshot = () => JSON.stringify([action.current.input, action.current.hash, action.current.rounds, action.current.version]);
onUnmounted(() => pending?.abort());
watch(snapshot, () => pending?.abort());
const run = async (method: "hash" | "compare") => {
    if (!action.current.input || (method === "compare" && !action.current.hash)) return;
    pending?.abort();
    const abort = new AbortController(); pending = abort;
    const before = snapshot();
    generateLoading = method === "hash"; checkLoading = method === "compare";
    try {
        const result = await runTask<string | boolean>(`bcrypt_${method}`, {input: action.current.input, rounds: action.current.rounds, version: action.current.version, hash: action.current.hash}, abort.signal);
        if (abort.signal.aborted || snapshot() !== before) return;
        if (method === "hash") {
            action.current.hash = result as string; action.current.check_result = null;
            action.success({copy_text: action.current.hash});
        } else {
            action.current.check_result = result as boolean;
            action.success({message: result ? $t("bcrypt_check_result_success") : $t("bcrypt_check_result_error"), message_type: result ? "success" : "error"});
        }
    } catch (e) { if (!abort.signal.aborted) Message.error($error(e)); }
    finally { if (pending === abort) { pending = undefined; generateLoading = false; checkLoading = false; } }
};
const generate = () => run("hash");
const check = () => run("compare");

const rounds = range(4, 31).map((r) => {
    return { label: `${$t('bcrypt_rounds')} ${r}`, value: r }
});

const versionOptions = [
    { label: '2a', value: '2a' },
    { label: '2b', value: '2b' },
    { label: '2y', value: '2y' }
];

const checkButtonText = $computed(() => {
    if (action.current.check_result === null) {
        return $t('bcrypt_check')
    }
    return `${$t('bcrypt_check')} (${action.current.check_result ? $t(`bcrypt_check_result_success`) : $t('bcrypt_check_result_error')})`
})

watch(() => {
    return {
        input: action.current.input,
        hash: action.current.hash,
    }
}, () => {
    action.current.check_result = null
})
</script>

<style scoped>
.select-box {
    width: 100%; /* Ensure it uses full width of the container */
    box-sizing: border-box; /* Include padding and border in the element's total width */
}

.select-box {
    min-width: 0; /* Prevent overflow issues */
    max-width: 120px; /* Adjust this value to control the size */
}
</style>
