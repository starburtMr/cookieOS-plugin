<template>
    <Align direction="vertical">
        <HeightResize v-slot="{height}" :reduce="205">
            <Editor v-model="action.current.input" :lang="action.current.language" :height="`${height}px`"/>
        </HeightResize>
        <Card :title="$t('main_ui_output')" :height="200" padding="0">
            <template #extra>
                <Align>
                    <span>{{ $t(`code_run_used_times`, [used]) }}</span>
                    <Select dialog size="small" v-model="action.current.language" :options="languageLists.map(name=>{return {value:name,label:getDisplayName(name)}})"/>
                    <Select size="small" v-model="action.current.version[action.current.language]" :options="languageVersionLists"/>
                    <Button
                        type="primary"
                        :text="isRunning ? $t(`code_running`) : $t(`code_run`)"
                        :disabled="isRunning || !isEnable || action.current.input === ''"
                        size="small"
                        @click="run()"
                    />
                    <span>|</span>
                    <Button type="primary" size="small" @click="showSetting = !showSetting">{{ $t(`main_ui_setting`) }}</Button>
                </Align>
            </template>
            <Editor lang="shell" :model-value="action.current.result.error !== '' ? action.current.result.error : action.current.result.output">
                <Button
                    v-if="action.current.result.output !== '' && action.current.result.error === ''"
                    :type="'dotted'" size="small"
                    :text="`Memory:${action.current.result.memory} Cpu Time:${action.current.result.cpuTime}`"
                />
            </Editor>
        </Card>
    </Align>
    <ExtendPage v-model="showSetting">
        <Card :title="$t('main_ui_setting')" padding="20px">
            <p>在 cookieOS 扩展设置中填写 JDoodle Client ID 和 Client Secret 后使用。</p>
            <Link href="https://www.jdoodle.com/compiler-api/">获取 JDoodle 凭据和额度</Link>
        </Card>
    </ExtendPage>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue"
import {useAction, initialize} from "@/store/action"
import {language, getLanguage, getUsed, execute, Result} from "./runUtil"
import {getDisplayName} from "@/helper/code"
import {SelectOption} from "@/types";

const action = useAction(await initialize({
    input: "",
    language: "php",
    version: (() => {
        const version: Record<string, string> = {}
        for (const l of language) {
            version[l.code] = l.version[l.version.length - 1].value
        }
        return version
    })(),
    result: {
        output: "",
        memory: 0,
        cpuTime: 0,
        error: ""
    } as Result
}))

let active = true;
onUnmounted(() => { active = false; });
const showSetting = $ref(false)
let used = $ref<number>(0)


const languageLists = language.map((item) => item.code).sort()
const languageVersionLists: SelectOption = $computed(() => {
    return getLanguage(action.current.language).version.map((item) => {
        return {value: item.value, label: item.name}
    })
})
const isEnable = true
let isRunning = $ref(false)
const run = () => {
    const before = JSON.stringify([action.current.input, action.current.language, action.current.version]);
    const unchanged = () => active && before === JSON.stringify([action.current.input, action.current.language, action.current.version]);
    try {
        isRunning = true;
        execute(
            action.current.language,
            action.current.input,
            action.current.version[action.current.language]
        ).then(result => {
            if (!unchanged()) return;
            action.current.result = result
            action.save()
        }).catch(error => {
            if (!unchanged()) return;
            action.current.result = {
                output: "",
                memory: 0,
                cpuTime: 0,
                error: $error(error)
            }
            action.save()
        }).finally(() => {
            isRunning = false
            if (active) resetUsed()
        })
    } catch (error) {
        action.current.result = {
            output: "",
            memory: 0,
            cpuTime: 0,
            error: $error(error)
        }
        isRunning = false
    }
}

const resetUsed = () => {
    void getUsed().then(times => { if (active) used = times }).catch(() => { used = 0 });
}
onMounted(() => {
    resetUsed()
})
</script>
