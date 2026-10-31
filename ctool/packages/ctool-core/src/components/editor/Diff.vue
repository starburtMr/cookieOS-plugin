<template>
    <Display
        :position="props.toolbar"
        :right="35"
        class="ctool-code-diff"
        :style="{ height: `${sizeConvert(props.height)}`, width: `100%` }"
        toggle
    >
        <div v-if="loading || failed" class="ctool-editor-loading" role="status">
            <span>{{ failed ? '编辑器未能打开' : '正在打开编辑器…' }}</span>
            <Button v-if="failed" text="重试" @click="container && create(container)" />
        </div>
        <div ref="container" :style="editorStyle"></div>
        <template #extra>
            <div ref="toolbarContainer" class="ctool-code-diff-toolbar">
                <Align>
                    <Input
                        size="small"
                        center
                        :disabled="changes === 0"
                        :model-value="`${changes ? currentChange : 0} / ${changes}`"
                        :width="110"
                    >
                        <template #prepend>
                            <Button :disabled="changes === 0 || currentChange === 1" text="<" @click="location('prev')" />
                        </template>
                        <template #append>
                            <Button
                                :disabled="changes === 0 || currentChange === changes"
                                text=">"
                                @click="location('next')"
                            />
                        </template>
                    </Input>
                    <Bool v-model="collapse" :label="$t(`diffs_collapse`)" size="small" border />
                    <Bool v-model="inline" :label="$t(`component_editor_inline`)" size="small" border />
                    <slot></slot>
                </Align>
            </div>
        </template>
    </Display>
</template>
<script lang="ts" setup>
// 代码编辑器
import { monacoInit, ContextMenu, monacoInstance, monacoEditor } from "./monaco";
import PlaceholderContentWidget from "./placeholderContentWidget";
import { computed, onUnmounted, onMounted, watch, PropType, ref, shallowRef } from "vue";
import type { StyleValue } from "vue";
import { getEditorLanguage } from "@/helper/code";
import { DisplayPosition } from "@/types";
import { useTheme } from "@/store/setting";
import { sizeConvert } from "../util";
import event from "@/event";
import {contentSensitiveDiffOptions} from "./diffOptions";

const original = defineModel<string>("original", {
    default: "",
});
const modified = defineModel<string>("modified", {
    default: "",
});

const props = defineProps({
    toolbar: {
        type: String as PropType<DisplayPosition>,
        default: "bottom-right",
    },
    lang: {
        type: String as PropType<string>,
        default: "text",
    },
    height: {
        type: [String, Number],
        default: "100%",
    },
    disableLineWrapping: {
        type: Boolean,
        default: false,
    },
    disableBorder: {
        type: Boolean,
        default: false,
    },
    disableLineNumbers: {
        type: Boolean,
        default: false,
    },
    disableClear: {
        type: Boolean,
        default: false,
    },
});

const storeTheme = useTheme();
const container = ref<HTMLElement | null>(null);
const toolbarContainer = ref<HTMLElement | null>(null);
const toolbarHeight = ref(0);
const editorView = shallowRef<monacoEditor.editor.IDiffEditor | null>(null);
const loading = ref(true);
const failed = ref(false);
let disposed = false;
let generation = 0;
const models = new Set<monacoEditor.editor.ITextModel>();
const releaseEditor = () => {
    editorView.value?.dispose(); editorView.value = null;
    for (const model of models) model.dispose();
    models.clear();
};
let toolbarResizeObserver: ResizeObserver | null = null;

const editorStyle = computed<StyleValue>(() => {
    const toolbarAtEdge = props.toolbar.startsWith("top-") || props.toolbar.startsWith("bottom-");
    const reservedHeight = toolbarAtEdge && toolbarHeight.value > 0 ? toolbarHeight.value + 10 : 0;
    return {
        height: reservedHeight > 0 ? `calc(100% - ${reservedHeight}px)` : "100%",
        marginTop: props.toolbar.startsWith("top-") && reservedHeight > 0 ? `${reservedHeight}px` : undefined,
        width: "100%",
    };
});

const observeToolbar = (element: HTMLElement | null) => {
    toolbarResizeObserver?.disconnect();
    toolbarResizeObserver = null;
    toolbarHeight.value = element?.offsetHeight ?? 0;
    if (!element || typeof ResizeObserver === "undefined") {
        return;
    }
    toolbarResizeObserver = new ResizeObserver(() => {
        toolbarHeight.value = element.offsetHeight;
    });
    toolbarResizeObserver.observe(element);
};

const lineWrapping = ref(!props.disableLineWrapping);
const lineNumbers = ref(!props.disableLineNumbers);

const changes = ref<number>(0);
const currentChange = ref<number>(1);

const inline = ref(false);
const collapse = ref(false);

const updateEditorConfig = async () => {
    if (!editorView.value) {
        return;
    }
    [editorView.value.getOriginalEditor(), editorView.value.getModifiedEditor()].forEach(editor => {
        const model = editor.getModel();
        // 设置语言
        model && monacoInstance()?.editor.setModelLanguage(model, getEditorLanguage(props.lang).id);
    });
    
    editorView.value.updateOptions({
        renderSideBySide: !inline.value,
        useInlineViewWhenSpaceIsLimited: false,
        hideUnchangedRegions: {
            enabled: collapse.value,
        },
    });
    
    // 主题
    monacoInstance()?.editor.setTheme(storeTheme.theme.raw === "dark" ? "vs-dark" : "vs");
};

const create = async (element: HTMLElement) => {
    const current = ++generation;
    releaseEditor(); loading.value = true; failed.value = false;
    try {
    const monaco = await monacoInit({
        "vs/nls": { availableLanguages: { "*": $t("main_locale") === "zh_CN" ? "zh-cn" : "en" } },
    });
    if (disposed || current !== generation) return;
        const originalModel = monaco.editor.createModel(original.value);
        models.add(originalModel);
        const modifiedModel = monaco.editor.createModel(modified.value);
        models.add(modifiedModel);
        
        const diffEditor = monaco.editor.createDiffEditor(element, {
            ...contentSensitiveDiffOptions,
            lineNumbers: lineNumbers.value ? "on" : "off",
            wordWrap: lineWrapping.value ? "on" : "off",
            minimap: { enabled: false },
            automaticLayout: true,
            originalEditable: true,
            scrollBeyondLastLine: false,
            renderSideBySide: !inline.value,
            useInlineViewWhenSpaceIsLimited: false,
            enableSplitViewResizing: false,
            hideUnchangedRegions: {
                enabled: collapse.value,
            },
            scrollbar: {
                verticalScrollbarSize: 5,
            },
        });
        
        editorView.value = diffEditor;
        
        diffEditor.setModel({
            original: originalModel,
            modified: modifiedModel,
        });
        
        // 内容更新
        diffEditor.getOriginalEditor().onDidChangeModelContent(() => {
            if (diffEditor.getOriginalEditor().getValue() !== original.value) {
                original.value = diffEditor.getOriginalEditor().getValue();
            }
        });
        
        diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
            if (diffEditor.getModifiedEditor().getValue() !== modified.value) {
                modified.value = diffEditor.getModifiedEditor().getValue();
            }
        });
        
        [diffEditor.getOriginalEditor(), diffEditor.getModifiedEditor()].forEach(editor => {
            // placeholder
            new PlaceholderContentWidget($t("main_ui_input"), editor);
            // 右键菜单
            const contextMenu = new ContextMenu(editor);
            contextMenu.setHandle("ctool_line_wrapping", (_ed, _id, result) => (lineWrapping.value = result));
            contextMenu.setHandle("ctool_line_number", (_ed, _id, result) => (lineNumbers.value = result));
        });
        diffEditor.onDidUpdateDiff(() => {
            changes.value = diffEditor.getLineChanges()?.length || 0;
            currentChange.value = 1;
        });
        
        editorView.value = diffEditor;
        // 编辑器配置
        updateEditorConfig();
    } catch {
        if (!disposed && current === generation) { releaseEditor(); failed.value = true; }
    } finally { if (!disposed && current === generation) loading.value = false; }
};

const location = (type: "prev" | "next") => {
    const lineChanges = editorView.value?.getLineChanges() || [];
    let current = type === "prev" ? currentChange.value - 1 : currentChange.value + 1;
    const change = lineChanges.at(current - 1);
    if (!change) {
        return;
    }
    editorView.value?.revealLineInCenter(change.originalEndLineNumber);
    currentChange.value = current;
};

const clearContent = () => updateEditor();
onMounted(async () => {
    !props.disableClear && event.addListener("content_clear", clearContent);
    await create(<HTMLElement>container.value);
});

onUnmounted(() => {
    disposed = true; generation++;
    event.removeListener("content_clear", clearContent);
    toolbarResizeObserver?.disconnect();
    releaseEditor();
});

const updateEditor = (original = "", modified = "") => {
    if (!editorView.value) {
        return;
    }
    if (editorView.value.getOriginalEditor().getValue() !== original) {
        editorView.value.getOriginalEditor().setValue(original);
    }
    if (editorView.value.getModifiedEditor().getValue() !== modified) {
        editorView.value.getModifiedEditor().setValue(modified);
    }
};

// 回写内容
watch(
    () => {
        return {
            original: original.value,
            modified: modified.value,
        };
    },
    value => {
        if (editorView.value) {
            return updateEditor(value.original, value.modified);
        }
        

    },
);

// 初始化重新编辑器
watch(
    () => {
        return {
            color: storeTheme.theme.raw,
            lang: props.lang,
            inline: inline.value,
            collapse: collapse.value,
        };
    },
    () => updateEditorConfig(),
);

watch(toolbarContainer, element => observeToolbar(element), { flush: "post" });
</script>
<style>
.ctool-code-editor, .ctool-code-diff { position:relative; }
.ctool-editor-loading { position:absolute; inset:0; z-index:1; display:flex; gap:.5rem; align-items:center; justify-content:center; background:var(--ctool-background-color); }
.ctool-code-diff {
    border-color: var(--ctool-border-color);
    border-style: solid;
    border-width: 1px;
    border-radius: 3px;
    overflow: hidden;
}

.ctool-code-diff-toolbar {
    display: inline-flex;
}
</style>
