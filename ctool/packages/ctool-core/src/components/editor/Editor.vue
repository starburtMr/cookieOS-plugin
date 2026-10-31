<template>
    <Display
        :position="props.toolbar"
        class="ctool-code-editor"
        :class="props.disableBorder ? ['ctool-code-editor-disable-border'] : []"
        :style="{ height: `${sizeConvert(props.height)}`, width: `100%` }"
        toggle
    >
        <div v-if="loading || failed" class="ctool-editor-loading" role="status">
            <span>{{ failed ? '编辑器未能打开' : '正在打开编辑器…' }}</span>
            <Button v-if="failed" text="重试" @click="container && create(container)" />
        </div>
        <div ref="container" style="height: 100%; width: 100%"></div>
        <template #extra>
            <slot></slot>
        </template>
    </Display>
</template>
<script lang="ts" setup>
// 代码编辑器
import { monacoInit, ContextMenu, monacoInstance, monacoEditor, lineInfo } from "./monaco";
import PlaceholderContentWidget from "./placeholderContentWidget";
import { onUnmounted, onMounted, unref, watch, PropType, ref, shallowRef } from "vue";
import { getEditorLanguage } from "@/helper/code";
import { DisplayPosition } from "@/types";
import { useTheme } from "@/store/setting";
import { sizeConvert } from "../util";
import event from "@/event";

type EditorContextMenuAction = {
    id: string;
    label: string;
    contextMenuGroupId?: string;
    contextMenuOrder?: number;
    run: (editor: monacoEditor.editor.IStandaloneCodeEditor) => void | Promise<void>;
};

type CompletionProvider = (payload: {
    model: monacoEditor.editor.ITextModel;
    position: monacoEditor.Position;
    monaco: typeof monacoEditor;
}) => monacoEditor.languages.ProviderResult<monacoEditor.languages.CompletionList>;

const modelValue = defineModel<string>({
    default: "",
});
const lineWrappingModel = defineModel<boolean | undefined>("lineWrapping", {
    default: undefined,
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
    placeholder: {
        type: String,
        default: () => $t("main_ui_input"),
    },
    // 父组件语言判断函数
    langCallback: {
        type: [Function, Boolean] as PropType<(() => string) | false>,
        default: () => {
            return false;
        },
    },
    // 外部组件reload++ 重新加载编辑器
    reload: {
        type: Number,
        default: 0,
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
    lineInfo: {
        type: Boolean,
        default: false,
    },
    contextMenuActions: {
        type: Array as PropType<EditorContextMenuAction[]>,
        default: () => [],
    },
    completionProvider: {
        type: [Function, Boolean] as PropType<CompletionProvider | false>,
        default: false,
    },
    completionTriggerCharacters: {
        type: Array as PropType<string[]>,
        default: () => [],
    },
});

const storeTheme = useTheme();
const container = ref<HTMLElement | null>(null);
const editorView = shallowRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
const lineWrapping = ref(lineWrappingModel.value ?? !props.disableLineWrapping);
const lineNumbers = ref(!props.disableLineNumbers);
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
let completionProviderDisposable: monacoEditor.IDisposable | null = null;

const setLineWrapping = (value: boolean) => {
    lineWrapping.value = value;
    editorView.value?.updateOptions({ wordWrap: value ? "on" : "off" });
    if (lineWrappingModel.value !== undefined && lineWrappingModel.value !== value) {
        lineWrappingModel.value = value;
    }
};

const getLanguage = (selectLang: string) => {
    let name: string = selectLang;
    if (props.langCallback !== false) {
        name = props.langCallback() || selectLang;
    }
    return getEditorLanguage(name);
};

const updateEditorConfig = async () => {
    if (!editorView.value) {
        return;
    }
    
    lineInfo(editorView.value).status(props.lineInfo);
    
    const model = editorView.value.getModel();
    
    // 设置语言
    model && monacoInstance()?.editor.setModelLanguage(model, getLanguage(props.lang).id);
    
    // 主题
    monacoInstance()?.editor.setTheme(storeTheme.theme.raw === "dark" ? "vs-dark" : "vs");
    editorView.value.updateOptions({
        wordWrap: lineWrapping.value ? "on" : "off",
        lineNumbers: lineNumbers.value ? "on" : "off",
    });
    
    editorView.value.render(true);
};

const create = async (element: HTMLElement) => {
    const current = ++generation;
    releaseEditor(); loading.value = true; failed.value = false;
    completionProviderDisposable?.dispose();
    try {
    const monaco = await monacoInit({
        "vs/nls": { availableLanguages: { "*": $t("main_locale") === "zh_CN" ? "zh-cn" : "en" } },
    });
    if (disposed || current !== generation) return;
        const editor = monaco.editor.create(element, {
            value: unref(modelValue.value),
            minimap: {
                enabled: false,
            },
            lineNumbers: lineNumbers.value ? "on" : "off",
            wordWrap: lineWrapping.value ? "on" : "off",
            language: getLanguage(props.lang).id,
            scrollbar: {
                verticalScrollbarSize: 5,
            },
            automaticLayout: true,
        });
        
        editorView.value = editor;
        if (editor.getModel()) models.add(editor.getModel()!);
        // 内容更新
        editor.onDidChangeModelContent(() => {
            if (editor.getValue() !== unref(modelValue.value)) {
                modelValue.value = editor.getValue();
            }
        });
        
        // placeholder
        new PlaceholderContentWidget(props.placeholder, editor);
        
        // 右键菜单
        const contextMenu = new ContextMenu(editor);
        props.contextMenuActions.forEach((item, index) => {
            editor.addAction({
                id: item.id,
                label: item.label,
                contextMenuGroupId: item.contextMenuGroupId || "ctool",
                contextMenuOrder: item.contextMenuOrder ?? 2000 + index,
                run: item.run,
            });
        });
        
        // 行信息展示
        lineInfo(editor).status(props.lineInfo);
        
        contextMenu.setHandle("ctool_line_wrapping", (_ed, _id, result) => setLineWrapping(result));
        contextMenu.setHandle("ctool_line_number", (_ed, _id, result) => (lineNumbers.value = result));
        
        editorView.value = editor;
        if (props.completionProvider) {
            const model = editor.getModel();
            const languageId = model?.getLanguageId() || getLanguage(props.lang).id;
            completionProviderDisposable = monaco.languages.registerCompletionItemProvider(languageId, {
                triggerCharacters: props.completionTriggerCharacters,
                provideCompletionItems: (currentModel, position) => {
                    if (currentModel !== editor.getModel() || props.completionProvider === false) {
                        return { suggestions: [] };
                    }
                    return props.completionProvider({
                        model: currentModel,
                        position,
                        monaco: monacoEditor,
                    });
                },
            });
        }
        
        // 编辑器配置
        updateEditorConfig();
    } catch {
        if (!disposed && current === generation) { releaseEditor(); failed.value = true; }
    } finally { if (!disposed && current === generation) loading.value = false; }
};

const clearContent = () => updateEditor();
onMounted(async () => {
    !props.disableClear && event.addListener("content_clear", clearContent);
    await create(<HTMLElement>container.value);
});

onUnmounted(() => {
    disposed = true; generation++;
    event.removeListener("content_clear", clearContent);
    completionProviderDisposable?.dispose();
    releaseEditor();
});

const updateEditor = (text = "") => {
    if (!editorView.value) {
        return;
    }
    if (editorView.value.getValue() !== text) {
        editorView.value.setValue(text);
    }
};

// 回写内容
watch(
    () => {
        return {
            value: unref(modelValue.value),
        };
    },
    ({ value }) => {
        if (editorView.value) {
            return updateEditor(value);
        }
        

    },
);

watch(
    () => lineWrappingModel.value,
    value => {
        if (value !== undefined && value !== lineWrapping.value) {
            setLineWrapping(value);
        }
    },
);

// 初始化重新编辑器
watch(
    () => {
        return {
            color: storeTheme.theme.raw,
            lang: props.lang,
            reload: props.reload,
            lineInfo: props.lineInfo,
        };
    },
    () => updateEditorConfig(),
);
</script>
<style>
.ctool-code-editor, .ctool-code-diff { position:relative; }
.ctool-editor-loading { position:absolute; inset:0; z-index:1; display:flex; gap:.5rem; align-items:center; justify-content:center; background:var(--ctool-background-color); }
.ctool-code-editor {
    border-color: var(--ctool-border-color);
    border-style: solid;
    border-width: 1px;
    border-radius: 3px;
    overflow: hidden;
}

.ctool-code-editor-disable-border.ctool-code-editor {
    border: none;
}
</style>
