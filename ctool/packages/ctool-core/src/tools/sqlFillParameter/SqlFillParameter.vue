<template>
    <HeightResize v-slot="{height}" ignore :reduce="5">
        <Align direction="vertical">
            <div v-row="`1-1`">
                <Display>
                    <Editor
                        v-model="action.current.input"
                        lang="sql"
                        :height="height/2"
                        :placeholder="`Sql: SELECT * FROM T WHERE id=? AND name=?`"
                    />
                    <template #extra>
                        <Align>
                            <Button :size="'small'" :loading="aiExplainLoading" @click="aiExplainSql()">✨ {{ $t('main_sqlFillParameter_ai_explain') }}</Button>
                        </Align>
                    </template>
                </Display>
                <Textarea
                    v-model="action.current.params"
                    :height="height/2"
                    :placeholder="`${$t('sqlFillParameter_parameter')}:\n?模式: 1(Integer),zhangshan(String)\n具名模式: id=1(Integer),name=zhangshan(String)`"
                    :copy="$t('sqlFillParameter_parameter')"
                />
            </div>
            <Editor
                :model-value="output"
                lang="sql"
                :height="height/2"
                :placeholder="`${$t('main_ui_output')}: SELECT * FROM T WHERE id=1 AND name='zhangshan'`"
            />
        </Align>
    </HeightResize>
    <!-- AI 解释结果弹窗 -->
    <Modal v-model="showAiExplain" :title="$t('main_sqlFillParameter_ai_explain_result')" width="70%">
        <Textarea :model-value="aiExplainText" :height="250" />
    </Modal>
</template>

<script lang="ts" setup>
import {aiPrompts} from "ctool-tools/domains/aiPrompts";
import {fillSql} from "ctool-tools/domains/sql";
import {useHostAi} from "@/helper/cookieos/ai";
import {initialize, useAction} from "@/store/action";
import {watch} from "vue";
import Modal from "@/components/Modal.vue";
import Display from "@/components/Display.vue";
import useSetting from "@/store/setting";
import { } from "@/helper/llm";
import type {AiConfig} from "@/helper/llm";
import Message from "@/helper/message";

const storeSetting = useSetting();

// 1-String 2-NUMBER 3-Long,4-Timestamp

const action = useAction(await initialize({input: "", params: ""}))

// AI 相关状态
let showAiExplain = $ref(false)
let aiExplainText = $ref("")
let aiExplainLoading = $ref(false)

const chat = useHostAi(() => JSON.stringify(action.current));

const getAiConfig = (): AiConfig => ({
    model: storeSetting.items.ai_model,
})

const aiExplainSql = async () => {
    const sql = action.current.input.trim()
    if (!sql) {
        Message.error($t("main_sqlFillParameter_ai_explain_empty"))
        return
    }
    const config = getAiConfig()
    if (!window.xhub?.models) {
        Message.error($t("main_ai_not_configured"))
        return
    }
    aiExplainLoading = true
    try {
        const result = await chat([
            {
                role: "system",
                content: aiPrompts.sql_explain,
            },
            { role: "user", content: sql },
        ], config)
        aiExplainText = result.content
        showAiExplain = true
    } catch (e: any) {
        Message.error($t("main_ai_request_error", [e?.message || String(e)]))
    } finally {
        aiExplainLoading = false
    }
}

/**
 * 将一行参数转化为值和类型的对象有序列表
 * @param params 参数字符串，字符串的格式为 value(type),value(type),.....
 * 实际例如： 1(String),2023-03-23 12:00:00(Timestamp)
 */
const fill = () => fillSql(action.current.input,action.current.params);

/**
 * 从串中分离sql模板和参数
 */
const splitSqlAndParams = (input: string) => {
    const result = {
        sql: "",
        params: ""
    }
    // 寻找SQL串的开始
    const sqlStartStr = 'Preparing:'
    let sqlStartIndex = input.indexOf(sqlStartStr)
    if (sqlStartIndex < 0) {
        // 没有找到Preparing:则认为整个串是SQL
        sqlStartIndex = 0
    } else {
        sqlStartIndex += sqlStartStr.length
    }
    // mybatis打印的SQL都以行为结束标记，因此寻找到该行的\n即认为结束
    let sqlEndIndex = input.indexOf("\n", sqlStartIndex)
    if (sqlEndIndex < 0) {
        sqlEndIndex = input.length
    }
    result.sql = input.substring(sqlStartIndex, sqlEndIndex)
    // 寻找参数串的开始
    const paramStartStr = 'Parameters:'
    const paramStartIndex = input.indexOf(paramStartStr)
    if (paramStartIndex >= 0) {
        // mybatis打印的SQL都以行为结束标记，因此寻找到该行的\n即认为结束
        let paramEndIndex = input.indexOf("\n", paramStartIndex)
        if (paramEndIndex < 0) {
            paramEndIndex = input.length
        }
        result.params = input.substring(paramStartIndex + paramStartStr.length, paramEndIndex)
    }
    return result
}

const output = $computed(() => {
    try {
        if (!action.current.input || !action.current.params) {
            return ""
        }
        // 做参数填充
        const resultStr = fill()
        action.save()
        return resultStr
    } catch (e) {
        return $error(e)
    }
})

watch(() => {
    return {input: action.current.input, params: action.current.params}
}, ({input}) => {
    // 输入不为空，且输入包含Preparing:和Parameters:，则尝试分离SQL和参数
    if (
        input !== ""
        && input.includes('Preparing:')
        && input.includes('Parameters:')
    ) {
        const result = splitSqlAndParams(input)
        if (result.sql !== "" && result.params !== "") {
            setTimeout(() => {
                action.current.input = result.sql
                action.current.params = result.params
            })
        }
    }
}, {immediate: true})
</script>
