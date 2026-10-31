<template>
    <HeightResize v-slot="{small,large}" ignore :reduce="5">
        <Align direction="vertical">
            <div v-row="`1-1`">
                <Textarea :height="small" v-model="action.current.key" :placeholder="$t(`rsa_private`)"/>
                <TextInput
                    v-model="action.current.input"
                    :placeholder="$t(`rsa_decrypt_input`)"
                    :allow="['base64','hex']"
                    :height="small"
                />
            </div>
            <Display :position="'top-right'" toggle>
                <TextOutput v-model="action.current.output" :content="output" :height="large"/>
                <template #extra>
                    <Select :size="'small'" v-model="action.current.algName" :options="algNames"/>
                </template>
            </Display>
        </Align>
    </HeightResize>
</template>

<script lang="ts" setup>
import {useAction, initialize} from "@/store/action"
import {createTextInput, createTextOutput} from "@/components/text"
import Text from "@/helper/text"
import {rsaBrowserDecrypt} from "ctool-tools/domains/rsaBrowser";
import {watch} from "vue";

const algNames = [
    {value: 'RSA', label: 'PKCS1'},
    {value: 'RSAOAEP', label: 'PKCS1_OAEP'}
]

const action = useAction(await initialize({
    input: createTextInput('base64'),
    algName: "RSA",
    key: "",
    output: createTextOutput('text'),
}))

const output = $computed(() => {
    if (action.current.input.text.isEmpty() || action.current.key.trim() === "") {
        return Text.empty()
    }
    if (action.current.input.text.isError()) {
        return action.current.input.text
    }
    try {
        return Text.fromString(rsaBrowserDecrypt(
            action.current.input.text.toUint8Array(),action.current.key,action.current.algName
        ))
    } catch (e) {
        return Text.fromError($error(e))
    }
})

watch(() => output, (output) => {
    if (output.isEmpty()) {
        return
    }
    action.save()
}, {immediate: true, deep: true})
</script>
