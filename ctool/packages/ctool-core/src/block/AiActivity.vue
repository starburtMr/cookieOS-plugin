<template>
    <section v-if="aiActivities.length" class="ctool-ai-activity" aria-live="polite" aria-label="AI 生成结果">
        <Card v-for="item in aiActivities" :key="item.id" :title="item.status" padding="12px">
            <pre v-if="item.text">{{ item.text }}</pre>
            <p v-if="item.detail">{{ item.detail }}</p>
            <Align>
                <Button v-if="item.running" text="停止生成" @click="item.stop"/>
                <Button v-if="item.ready" type="primary" text="使用结果" @click="item.accept?.()"/>
                <Button v-if="item.check && !item.running" text="查询状态" @click="item.check"/>
                <Button v-if="item.text" text="复制结果" @click="$copy(item.text)"/>
                <Button text="关闭" @click="item.close"/>
            </Align>
        </Card>
    </section>
</template>

<script setup lang="ts">
import {aiActivities} from "@/helper/cookieos/ai";
</script>

<style scoped>
.ctool-ai-activity { position: fixed; right: 12px; bottom: 42px; z-index: 3000; width: min(560px, calc(100vw - 24px)); max-height: 65vh; overflow: auto; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 35vh; overflow: auto; margin: 0 0 12px; }
</style>
