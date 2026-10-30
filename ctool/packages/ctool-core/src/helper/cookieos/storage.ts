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
let last = new Map<string, string>();

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

export async function loadPreferences() {
    const items: Record<string, unknown> = {};
    let failed = false;
    await Promise.all(preferenceKeys.map(async key => {
        try {
            const value = await window.xhub.storage.get(`ctool.pref.${key}`);
            if (valid(key, value)) items[key] = value;
        } catch { failed = true; }
    }));
    last = new Map(Object.entries({...preferenceDefaults, ...items}).map(([k, v]) => [k, JSON.stringify(v)]));
    memory.set("nv_setting", {v: {items}, u: "", e: 0, es: ""});
    if (failed) throw new Error("Some preferences could not be loaded");
}

function persist(value: StorageDataStructureInterface<unknown>) {
    const items = (value.v as {items?: Record<string, unknown>})?.items;
    if (!items) return;
    for (const key of preferenceKeys) {
        if (!(key in items) || !valid(key, items[key])) continue;
        const encoded = JSON.stringify(items[key]);
        if (last.get(key) === encoded) continue;
        last.set(key, encoded);
        const snapshot: unknown = JSON.parse(encoded);
        const next = (writes.get(key) ?? Promise.resolve()).catch(() => {}).then(() => window.xhub.storage.set(`ctool.pref.${key}`, snapshot));
        writes.set(key, next);
        void next.catch(() => {
            if (last.get(key) === encoded) last.delete(key);
            window.dispatchEvent(new CustomEvent("ctool:save-error"));
        });
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
