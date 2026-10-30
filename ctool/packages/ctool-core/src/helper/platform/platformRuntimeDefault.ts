import {PlatformRuntime} from "ctool-config";
import storage from "../cookieos/storage";

export const runtime = new (class implements PlatformRuntime {
    name = "web";
    webSecurity() { return false; }
    is() { return true; }
    openUrl(url: string) {
        if (new URL(url, location.href).pathname.endsWith("/tool.html")) return window.xhub.runtime.open("view");
        return window.xhub.openExternal(url).catch(() => { window.dispatchEvent(new CustomEvent("ctool:external-error")); });
    }
    getLocale() { return navigator.language; }
    storage() { return storage; }
})();
