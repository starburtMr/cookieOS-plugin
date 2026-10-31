import {prepareHostTheme} from "@/store/setting";
import { createApp } from "vue";
import { pinia } from "@/helper/pinia";
import platform from "@/helper/platform";
import ctool from "@/helper/plugin";
import router, {preloadInitialTool} from "@/helper/router";
import "@/statics/style.css";
import Tool from "@/Tool.vue";
import {loadPreferences, waitForPreferences} from "@/helper/cookieos/storage";
import Message from "@/helper/message";

(async () => {
    if (!window.xhub) throw new Error("请从 cookieOS 扩展中心打开 Ctool");
    const loading = document.createElement("div");
    loading.setAttribute("role", "status"); loading.textContent = "正在打开工具…";
    document.getElementById("app")?.appendChild(loading);
    void loadPreferences().catch(() => {});
    void preloadInitialTool().catch(() => {});
    const hostTheme = prepareHostTheme();
    if (!document.getElementById("ctool-append")) {
        const portal = document.createElement("div"); portal.id = "ctool-append"; document.body.appendChild(portal);
    }
    window.addEventListener("ctool:save-error", () => Message.error("设置尚未保存，请稍后重新选择"));
    window.addEventListener("ctool:external-error", () => Message.error("链接未打开，请检查浏览器设置"));
    if (document.body.clientWidth > 850 || platform.isUtools() || platform.isWeb() || platform.isDesktop()) {
        const page = document.getElementById("ctool");
        if (page) {
            page.style.width = "auto";
            page.style.height = "auto";
        }
    }
    const app = createApp(Tool);
    app.use(pinia).use(router).use(ctool);
    void router.isReady().catch(() => {});
    await Promise.all([hostTheme, waitForPreferences(["common", "locale", "theme", "zoom", "layout"])]);
    app.mount("#app");
    window.addEventListener("pagehide", (event) => { if (!event.persisted) app.unmount(); }, {once: true});
})();
