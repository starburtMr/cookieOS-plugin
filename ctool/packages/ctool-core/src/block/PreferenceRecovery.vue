<template>
    <div v-if="failed" class="ctool-preference-recovery" role="status">
        <span>部分设置未能读取</span>
        <Button text="重新读取" :loading="retrying" @click="retry" />
    </div>
</template>
<script setup lang="ts">
import {computed, ref} from "vue";
import Button from "@/components/ui/Button.vue";
import {loadPreferences, preferenceStatus} from "@/helper/cookieos/storage";
const retrying = ref(false);
const failed = computed(() => Object.values(preferenceStatus).some(v => v === "failed" || v === "invalid"));
async function retry() {
    if (retrying.value) return;
    retrying.value = true;
    try { await loadPreferences({retryFailed: true}); } catch { /* Keep the recovery action visible. */ }
    finally { retrying.value = false; }
}
</script>
<style>
.ctool-preference-recovery { position:fixed; bottom:.5rem; right:.5rem; z-index:20; display:flex; max-width:calc(100% - 1rem); flex-wrap:wrap; align-items:center; gap:.5rem; padding:.5rem; background:var(--ctool-background-color); border:1px solid var(--ctool-border-color); }
</style>
