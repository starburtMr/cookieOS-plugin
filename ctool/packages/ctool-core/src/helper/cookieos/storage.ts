import {reactive} from "vue";
import {commonTool, toolExists} from "ctool-config";
import type {StorageDataStructureInterface} from "@/types";

export const preferenceDefaults = {
    common: [...commonTool], locale: "_default" as const, theme: "auto" as const,
    auto_read_copy: false, auto_read_copy_filter: false, auto_save_copy: true,
    layout: "complex" as const, fill_history_expire: 3600, history_icon_badge_hidden: false,
    zoom: 100, ai_model: "", history_enabled: false,
};
const memory = new Map<string, StorageDataStructureInterface<unknown>>();
const preferenceKeys = ["common", "locale", "theme", "auto_read_copy", "auto_read_copy_filter", "auto_save_copy", "layout", "fill_history_expire", "history_icon_badge_hidden", "zoom", "ai_model"];
const writes = new Map<string, Promise<unknown>>();
const reads = new Map<string, Promise<void>>();
const revisions = new Map<string, number>();
const generations = new Map<string, number>();
const observed = new Map<string, string>();
const scheduled = new Map<string, string>();
export const preferenceStatus = reactive<Record<string, "loading" | "loaded" | "missing" | "invalid" | "failed">>({});
const listeners = new Set<(key: string, value: unknown) => void>();
export function onPreference(listener: (key: string, value: unknown) => void) {
    listeners.add(listener); return () => { listeners.delete(listener); };
}
export function preferenceReady(key: string) {
    return (revisions.get(key) ?? 0) > 0 || ["loaded", "missing"].includes(preferenceStatus[key]);
}
export function waitForPreferences(keys: string[]) { return Promise.all(keys.map(key => reads.get(key)?.catch(() => {}))); }

function valid(key: string, value: unknown) {
    if (key === "common") return Array.isArray(value) && value.length <= 100 && value.every(v => typeof v === "string" && toolExists(v));
    if (key === "locale") return ["_default", "zh_CN", "en"].includes(value as string);
    if (key === "theme") return ["auto", "dark", "light"].includes(value as string);
    if (key === "layout") return ["complex", "simple"].includes(value as string);
    if (key === "ai_model") return typeof value === "string" && value.length <= 2000;
    if (key === "zoom") return typeof value === "number" && value >= 50 && value <= 200;
    if (key === "fill_history_expire") return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 31536000;
    return typeof value === "boolean";
}

async function readPreference(key: string, timeoutMs: number) {
    const generation = (generations.get(key) ?? 0) + 1;
    generations.set(key, generation);
    const revision = revisions.get(key) ?? 0;
    preferenceStatus[key] = "loading";
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const value = await Promise.race([
            window.xhub.storage.get("ctool.pref." + key),
            new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("Preference read timeout")), timeoutMs); }),
        ]);
        if (generations.get(key) !== generation || (revisions.get(key) ?? 0) !== revision) return;
        preferenceStatus[key] = value === null ? "missing" : valid(key, value) ? "loaded" : "invalid";
        if (!valid(key, value)) return;
        observed.set(key, JSON.stringify(value));
        const old = memory.get("nv_setting") ?? {v: {items: {}}, u: "", e: 0, es: ""};
        const items = {...(old.v as {items: Record<string, unknown>}).items, [key]: value};
        memory.set("nv_setting", {...old, v: {items}});
        for (const listener of listeners) listener(key, value);
    } catch {
        if (generations.get(key) !== generation || (revisions.get(key) ?? 0) !== revision) return;
        preferenceStatus[key] = "failed";
        throw new Error("Some preferences could not be loaded");
    } finally { clearTimeout(timer); }
}
export async function loadPreferences({retryFailed = false, timeoutMs = 3000} = {}) {
    if (!retryFailed) {
        memory.set("nv_setting", {v: {items: {}}, u: "", e: 0, es: ""});
        for (const [key, value] of Object.entries(preferenceDefaults)) observed.set(key, JSON.stringify(value));
        revisions.clear(); scheduled.clear();
    }
    const pending = preferenceKeys.filter(key => !retryFailed || ["failed", "invalid"].includes(preferenceStatus[key])).map(key => {
        const read = readPreference(key, timeoutMs); reads.set(key, read); return read;
    });
    const results = await Promise.allSettled(pending);
    if (results.some(r => r.status === "rejected")) throw new Error("Some preferences could not be loaded");
}
export function savePreference(key: string, value: unknown) {
    if (!preferenceKeys.includes(key) || !valid(key, value)) return;
    const encoded = JSON.stringify(value);
    observed.set(key, encoded);
    revisions.set(key, (revisions.get(key) ?? 0) + 1);
    preferenceStatus[key] = "loaded";
    if (scheduled.get(key) === encoded) return;
    scheduled.set(key, encoded);
    const snapshot: unknown = JSON.parse(encoded);
    const next = (writes.get(key) ?? Promise.resolve()).catch(() => {}).then(() => window.xhub.storage.set("ctool.pref." + key, snapshot));
    writes.set(key, next);
    void next.catch(() => {
        if (scheduled.get(key) === encoded) scheduled.delete(key);
        window.dispatchEvent(new CustomEvent("ctool:save-error"));
    });
}
function persist(value: StorageDataStructureInterface<unknown>) {
    const items = (value.v as {items?: Record<string, unknown>})?.items;
    if (!items) return;
    for (const key of preferenceKeys) {
        if (key in items && valid(key, items[key]) && observed.get(key) !== JSON.stringify(items[key])) savePreference(key, items[key]);
    }
}

export function historyAllowed(name: string) {
    const settings = memory.get("nv_setting")?.v as {items?: {history_enabled?: boolean}} | undefined;
    const tool = name.split("_")[0];
    return settings?.items?.history_enabled === true && !["aes", "des", "tripleDes", "rc4", "rabbit", "sm2", "sm4", "rsa", "sign", "bcrypt", "password", "randomString", "jwt", "code", "httpSnippet", "hmac"].includes(tool);
}

export default {
    get<T>(key: string) { return (memory.get(key) ?? null) as StorageDataStructureInterface<T> | null; },
    set<T>(key: string, value: StorageDataStructureInterface<T>) { memory.set(key, value); if (key === "nv_setting") persist(value); },
    remove(key: string) { memory.delete(key); },
    clear() { memory.clear(); },
    getAllKey() { return [...memory.keys()]; },
};
