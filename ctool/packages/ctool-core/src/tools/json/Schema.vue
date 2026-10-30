<template>
    <HeightResize v-slot="{small,large}" :father-height="height" ignore :reduce="5">
        <Align direction="horizontal" width="100%">
            <Editor
                v-model="current.exp"
                disable-line-numbers
                :placeholder="`JSON schema ${$t('main_ui_input')}`"
                lang="json"
                :height="small"
            />
            <Editor
                :model-value="output"
                disable-line-numbers
                :placeholder="`JSON schema validator ${$t('main_ui_output')}`"
                :height="large"
            >
                <HelpTip link="https://github.com/ajv-validator/ajv" />
            </Editor>
        </Align>
    </HeightResize>
</template>
<script lang="ts" setup>
import {runTask} from "@/helper/cookieos/task";
import Serialize from "@/helper/serialize";
import {PropType, watch} from "vue";
import {SchemaOptionType} from "@/tools/json/define";


const props = defineProps({
    modelValue: {
        type: Object as PropType<SchemaOptionType>,
        default: () => {
            return {
                exp: "",
                option: {}
            }
        }
    },
    json: {
        type: Object as PropType<Serialize>,
        default: () => {
            return Serialize.empty()
        }
    },
    height: {
        type: Number,
        default: 0
    },
})

const emit = defineEmits<{ (e: 'update:modelValue', modelValue: SchemaOptionType): void, (e: 'success'): void }>()

const current: SchemaOptionType = $computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

let output = $ref("")


watch(() => {
    return {
        json: props.json,
        current
    }
}, async ({json, current}, _, onCleanup) => {
    const abort = new AbortController(); onCleanup(() => abort.abort());
    if (json.isError()) {
        output = json.error();
        return;
    }
    if (json.isEmpty() || current.exp.trim() === "") {
        output = "";
        return;
    }
    try {
        const result = await runTask<string>("schema", {schema: current.exp, value: json.content()}, abort.signal);
        if (abort.signal.aborted) return;
        output = result;
        emit('success')
    } catch (e) {
        if (!abort.signal.aborted) output = $error(e)
    }
}, {immediate: true, deep: true})
</script>




