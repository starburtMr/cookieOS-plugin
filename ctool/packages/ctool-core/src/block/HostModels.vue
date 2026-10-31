<template>
    <Align direction="vertical" gap="large" class="ctool-host-models">
        <Align class="ctool-host-model-controls" gap="large">
            <Select :model-value="settings.items.ai_model" :options="options" @change="value => settings.save('ai_model', String(value))"/>
            <Button text="刷新模型" :loading="loading" @click="load"/>
        </Align>
        <span v-if="error">{{ error }}</span>
        <Bool label="本次会话保留普通工具历史" :model-value="settings.items.history_enabled" @change="value => settings.save('history_enabled', value)"/>
    </Align>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import type {ModelInfo} from "@/xhub";
import useSetting from "@/store/setting";
const settings = useSetting();
const models = ref<ModelInfo[]>([]);
const loading = ref(false);
const error = ref("");
const options = computed(() => [
    {value: "", label: "跟随 cookieOS 默认模型"},
    ...models.value.map(model => ({value: model.ref, label: `${model.providerName} / ${model.modelName}${model.configurationStatus !== 'configured' ? '（不可用）' : ''}`})),
    ...(settings.items.ai_model && !models.value.some(m => m.ref === settings.items.ai_model) ? [{value: settings.items.ai_model, label: "原选模型不可用，请重新选择"}] : []),
]);
async function load() {
    loading.value = true; error.value = "";
    try { models.value = (await window.xhub.models.list()).models; if (!models.value.length) error.value = "请先在 cookieOS 配置模型供应商"; }
    catch { error.value = "模型列表未读取，请检查 cookieOS 设置后刷新"; }
    finally { loading.value = false; }
}
onMounted(load);
</script>

<style scoped>
.ctool-host-models {
    min-width: 0;
}
.ctool-host-model-controls :deep(.ctool-select) {
    flex: 1 1 220px;
    min-width: 0;
    max-width: 100%;
    height: auto;
    min-height: var(--ctool-form-item-height);
}
.ctool-host-model-controls :deep(summary) {
    min-height: var(--ctool-form-item-height);
    overflow-wrap: anywhere;
}
.ctool-host-model-controls :deep(button) {
    flex-shrink: 0;
}
</style>
