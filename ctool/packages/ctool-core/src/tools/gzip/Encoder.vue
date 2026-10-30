<template>
    <HeightResize v-slot="{small,large}" :reduce="5">
        <Align direction="vertical">
            <Display>
                <TextInput
                    v-model="action.current.input"
                    :height="small"
                    upload="file"
                    encoding
                />
                <template #extra>
                    <Bool v-model="action.current.deflate" label="Deflate"/>
                </template>
            </Display>
            <TextOutput
                v-model="action.current.output"
                :allow="['base64','hex','down']"
                :content="output"
                :height="large"
                @success="action.save()"
            />
        </Align>
    </HeightResize>
</template>

<script lang="ts" setup>
import {useAction, initialize} from "@/store/action"
import {createTextInput, createTextOutput} from "@/components/text"
import {useCompression} from "./useCompression";

const action = useAction(await initialize({
    input: createTextInput('text'),
    deflate: false,
    output: createTextOutput('base64'),
}))

const output = useCompression(() => action.current, "gzip");
</script>
