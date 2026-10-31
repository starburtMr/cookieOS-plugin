import {shallowRef} from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { ToolRouteConfig, RouteMeta, Locale } from "@/types";
import { toolRoutes } from "@/buildDataTemp";
import { getTool } from "@/config";
import {tools, toolExists} from "ctool-config";
import storage, {preferenceDefaults, preferenceReady, waitForPreferences} from "./cookieos/storage";
import {setCurrentLocale} from "@/i18n";

const routes: {
    name: string,
    path: string,
    component: any,
    meta: RouteMeta
}[] = [
    {
        name: "index",
        path: "/",
        component: () => import("@/block/Index.vue"),
        meta: { type: "index" },
    },
    {
        name: "clipboard",
        path: "/clipboard",
        component: () => import("@/block/Clipboard.vue"),
        meta: { type: "other" },
    },
    {
        name: "test",
        path: "/test",
        component: () => import("@/block/Test.vue"),
        meta: { type: "other" },
    },
    ...toolRoutes.map((item: ToolRouteConfig) => {
        const meta: RouteMeta = { type: "tool", tool: item.tool, feature: item.feature };
        return {
            name: `${item.tool}${item.feature ? `_${item.feature}` : ""}`,
            path: getTool(item.tool).getFeature(item.feature).getRouter(),
            meta: meta,
            component: item.component,
        };
    }),
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export const navigationPending = shallowRef(false);
export const failedNavigation = shallowRef("");
let latestTarget = "";
router.beforeEach(to => { latestTarget = to.fullPath; failedNavigation.value = ""; navigationPending.value = true; });
router.onError((_error, to) => { if (to.fullPath === latestTarget) { failedNavigation.value = to.fullPath; navigationPending.value = false; } });
router.afterEach((to, _from, failure) => { if (to.fullPath === latestTarget) { if (!failure) failedNavigation.value = ""; navigationPending.value = false; } });
export function retryNavigation() {
    if (failedNavigation.value) void router.push(failedNavigation.value).catch(() => {});
}
// A new instance has no session navigation history; warm only its selected default.
export async function preloadInitialTool() {
    const initialHash = location.hash;
    if (!["", "#", "#/"].includes(initialHash.split("?")[0])) return;
    await waitForPreferences(["common", "locale"]);
    if (location.hash !== initialHash || !preferenceReady("common") || !preferenceReady("locale")) return;
    const settings = storage.get<{items: {common?: string[]; locale?: Locale}}>("nv_setting")?.v.items;
    setCurrentLocale(settings?.locale ?? preferenceDefaults.locale);
    const common = settings?.common ?? preferenceDefaults.common;
    const tool = common.find(toolExists) ?? tools[0].name;
    const feature = getTool(tool).firstFeature().name;
    await toolRoutes.find(route => route.tool === tool && route.feature === feature)?.component();
}
export default router;
