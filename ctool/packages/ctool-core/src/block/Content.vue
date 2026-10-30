<template>
    <div class="ctool-content">
        <div class="ctool-main-tool">
            <router-view v-slot="{Component, route}">
                    <Suspense :key="route.path">
                        <component :is="Component"/>
                        <template #fallback><div role="status" data-tool-loading>正在加载工具…</div></template>
                    </Suspense>
            </router-view>
        </div>
    </div>
    <ExtendPage
        v-model="openSetting"
        width="720px"
        resizable
        resize-key="setting"
        :min-width="540"
        :max-width="1200"
    >
        <Setting/>
    </ExtendPage>
    <Modal :title="$t('main_ui_prompt')" v-model="pwaUpdate" width="500">
        <Align :horizontal="'center'" top="15" bottom="15">
            {{ $t(`main_new_version_found`) }}
        </Align>
        <template #footer>
            <Button type="primary" long @click="pwaUpdate = false;pwaUpdater?.()" :text="$t(`main_ui_reload`)"/>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import {useRouter} from 'vue-router'
import {onMounted, onUnmounted} from 'vue'
import {report} from '@/helper/stat'
import {RouteMeta} from '@/types'
import {categoryExists, getTool} from '@/config'
import useOperate from '@/store/operate'
import event from "@/event";
import Setting from "@/block/Setting.vue"

const operate = useOperate()
const router = useRouter()
let pwaUpdate = $ref(false)
let pwaUpdater = $ref<(() => void) | null>(null)

onMounted(() => {
    window.dispatchEvent(new Event('resize'));
    // pwa 更新检测事件
    window.addEventListener('ctool_service_worker_update', (event: any) => {
        pwaUpdate = true
        pwaUpdater = event.detail.update
    })
})

// 打开设置页面
let openSetting = $ref(false)

event.addListener('open_setting', () => {
    openSetting = !openSetting
})

const accessRoute = (to) => {
    const meta = to.meta as RouteMeta
    if (meta.type === "tool") {
        const queryCategory = to.query.category?.toString() || ""
        const category = categoryExists(queryCategory) ? queryCategory : getTool(meta.tool).firstCategory().name
        if (!operate.access(meta.tool, meta.feature, category)) {
            return false
        }
        report({_t: meta.type, _c: category, _n: meta.tool, _f: meta.feature, _p: to.name || ""})
    } else {
        report({_t: meta.type, _p: to.name || ""})
    }
};
const stopGuard = router.beforeResolve(accessRoute);
accessRoute(router.currentRoute.value);
onUnmounted(stopGuard);


</script>
<style>
.ctool-content {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 5px;
    overflow: hidden;
}

.ctool-main-tool {
    width: 100%;
    height: 100%;
}

/* 页面切换过渡：消除 is=false→true 之间的空白闪烁 */
.ctool-page-switch-enter-active {
    transition: opacity 0.15s ease-out;
}
.ctool-page-switch-enter-from {
    opacity: 0;
}
</style>
