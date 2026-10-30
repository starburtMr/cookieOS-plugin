<template>
    <Display :position="useInput ? 'right-center' : 'top-right'" :toggle="!useInput" :style="style">
        <template v-if="current.type !== 'upload'">
            <Textarea v-if="!useInput" v-model="current.value" :disabled="disabled" :placeholder="placeholder" />
            <Input
                v-else
                v-model="current.value"
                :placeholder="placeholder"
                :disabled="disabled"
                :label="useInput !== true ? useInput : ''"
            />
        </template>
        <Card v-else style="height: 100%">
            <Align direction="vertical" horizontal="center" vertical="center">
                <UploadFile v-model="current.value" button-type="text" :type="upload" />
                <div
                    style="
                        font-size: 0.75rem;
                        color: var(--ctool-placeholder-text-color);
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                    "
                >
                    <template v-if="current.type === `upload` && !current.text.isEmpty()">
                        <Icon name="right" :size="14" />
                        {{ current.text.name() || "" }}
                        <template v-if="current.text.isImage()">
                            {{ current.text.imageSizeString ? `(${current.text.imageSizeString})` : "" }}
                        </template>
                    </template>
                    <template v-else>
                        {{ $t(`component_upload_support_paste`) }}
                    </template>
                </div>
            </Align>
        </Card>
        <template #extra>
            <Align>
                <Select
                    size="small"
                    :disabled="disabled"
                    :options="encodings"
                    v-model="current.option.text.encoding"
                    v-if="encoding && current.type === 'text'"
                />
                <Bool
                    size="small"
                    v-model="current.option.hex.preserve_line_breaks"
                    :label="$t('component_content_type_hex_preserve_line_breaks')"
                    v-if="current.type === 'hex' && isString(current.value) && current.value.includes('\n')"
                />
                <Select
                    size="small"
                    :disabled="disabled"
                    :model-value="current.type"
                    @change="
                        value => {
                            current.type = value;
                            current.value = ``;
                            current.text = Text.empty();
                        }
                    "
                    v-if="typeLists.length > 1"
                    :options="
                        typeLists.map(item => {
                            return {
                                value: item,
                                label: $t(`component_content_type_${item}`),
                            };
                        })
                    "
                />
                <slot />
            </Align>
        </template>
    </Display>
</template>

<script setup lang="ts">
import { TextInput, createTextInput } from "./index";
import { nextTick, PropType, watch, toRaw, StyleValue, onUnmounted } from "vue";
import Text, { encodings } from "@/helper/text";
import { TextInputUpload, textInputEncoderLists, TextInputEncoderType } from "@/types";
import { debounce, isString } from "lodash";
import { sizeConvert } from "@/components/util";
import Bool from "@/components/ui/Bool.vue";

const props = defineProps({
    modelValue: {
        type: Object as PropType<TextInput>,
        default: () => createTextInput(),
    },
    height: {
        type: [Number, String],
        default: "",
    },
    placeholder: {
        type: String,
        default: () => {
            return $t("main_ui_input");
        },
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    allow: {
        type: Array as PropType<TextInputEncoderType[]>,
        default: () => textInputEncoderLists,
    },
    upload: {
        type: String as PropType<TextInputUpload>,
        default: "none",
    },
    encoding: {
        // 输入编码选项框
        type: Boolean,
        default: false,
    },
    useInput: {
        // 非上传使用input框
        type: [Boolean, String],
        default: false,
    },
});

const emit = defineEmits<{ (e: "update:modelValue", modelValue: TextInput): void }>();

const typeLists = $computed(() => {
    return textInputEncoderLists.filter(item => {
        return ![...(props.upload === "none" ? ["upload"] : [])].includes(item) && props.allow.includes(item);
    });
});

let current = $ref(toRaw(props.modelValue));

let generation = 0;
let pending: AbortController | undefined;
const transform = debounce(async (id: number) => {
    const target = current;
    const abort = new AbortController(); pending = abort;
    let result: Text;
    try {
        if (target.value === "") result = Text.empty();
        else if (target.type === "upload" && target.value instanceof File) {
            result = (await Text.fromBlob(target.value)).setFileName(target.value.name);
            await result.calculateImageSize();
        } else if (!isString(target.value)) throw new Error("内容格式不正确");
        else if (target.type === "text") result = Text.fromString(target.value, target.option.text.encoding);
        else if (target.type === "base64") result = Text.fromBase64(target.value);
        else if (target.type === "hex") result = Text.fromHex(target.value, {preserve_line_breaks: target.option.hex.preserve_line_breaks});
        else if (target.type === "url") result = await Text.fromUrl(target.value, abort.signal);
        else throw new Error("内容格式不正确");
    } catch (e) { result = Text.fromError($error(e)); }
    if (id === generation && !abort.signal.aborted) current.text = result;
}, 200);
watch(() => ({type: current.type, value: current.value, option: current.option}), () => {
    pending?.abort(); transform(++generation);
}, {immediate: true, deep: true});
onUnmounted(() => { generation++; pending?.abort(); transform.cancel(); });

watch(
    () => current.text,
    () => emit("update:modelValue", toRaw(current) as TextInput),
    { immediate: true, deep: true },
);

watch(
    () => {
        return {
            type: props.modelValue.type,
            value: props.modelValue.value,
            option: props.modelValue.option,
        };
    },
    async () => {
        await nextTick();
        current = toRaw(props.modelValue);
    },
    { deep: true },
);

const style = $computed(() => {
    const css: StyleValue = {};
    if (props.height) {
        css.height = sizeConvert(props.height);
    }
    return css;
});
</script>
