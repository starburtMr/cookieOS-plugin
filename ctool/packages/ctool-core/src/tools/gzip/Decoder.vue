<template>
    <HeightResize v-slot="{small,large}" :reduce="5">
        <Align direction="vertical">
            <TextInput
                v-model="action.current.input"
                :height="small"
                upload="file"
                :allow="['base64', 'hex', 'upload', 'url']"
                encoding
            />
            <TextOutput
                v-model="action.current.output"
                :allow="['text']"
                :content="output"
                :height="large"
                @success="action.save()"
                encoding
            />
        </Align>
    </HeightResize>
</template>

<script lang="ts" setup>
import {useAction, initialize} from "@/store/action"
import {createTextInput, createTextOutput} from "@/components/text"
import {useCompression} from "./useCompression";

const action = useAction(await initialize({
    input: createTextInput('base64'),
    output: createTextOutput('text'),
}))

const output = useCompression(() => action.current, "inflate");
</script>
