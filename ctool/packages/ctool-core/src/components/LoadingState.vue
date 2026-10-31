<template>
    <div class="ctool-loading-state" role="status">
        <span>{{ failed ? '暂时无法打开，请重试' : '正在加载…' }}</span>
        <Button v-if="failed" text="重试" @click="$emit('retry')" />
    </div>
</template>
<script setup lang="ts">
import Button from "./ui/Button.vue";
defineProps({failed: Boolean});
defineEmits(["retry"]);
</script>
<style>
.ctool-loading-state { display:flex; min-height:5rem; width:100%; align-items:center; justify-content:center; gap:.5rem; }
</style>
