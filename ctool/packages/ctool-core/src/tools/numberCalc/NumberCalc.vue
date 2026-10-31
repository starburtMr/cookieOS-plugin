<template>
    <HeightResize v-slot="{ height }" :reduce="5">
        <Align direction="vertical">
            <Textarea
                v-model="action.current.input"
                :height="height * 0.6"
                :placeholder="$t('numberCalc_input_placeholder')"
            />
            <Card :title="$t('numberCalc_result')" padding="15px" v-if="result.count > 0">
                <Align direction="vertical">
                    <div v-row="`1-1-1-1`">
                        <Display position="right-center" :text="$t('main_ui_copy')" @click="() => $copy(String(result.count))">
                            <Input readonly :model-value="String(result.count)" :label="$t('numberCalc_count')" />
                        </Display>
                        <Display position="right-center" :text="$t('main_ui_copy')" @click="() => $copy(result.sum)">
                            <Input readonly :model-value="result.sum" :label="$t('numberCalc_sum')" />
                        </Display>
                        <Display position="right-center" :text="$t('main_ui_copy')" @click="() => $copy(result.avg)">
                            <Input readonly :model-value="result.avg" :label="$t('numberCalc_avg')" />
                        </Display>
                        <Display position="right-center" :text="$t('main_ui_copy')" @click="() => $copy(result.median)">
                            <Input readonly :model-value="result.median" :label="$t('numberCalc_median')" />
                        </Display>
                    </div>
                    <div v-row="`1-1-1-1`">
                        <Display position="right-center" :text="$t('main_ui_copy')" @click="() => $copy(result.min)">
                            <Input readonly :model-value="result.min" :label="$t('numberCalc_min')" />
                        </Display>
                        <Display position="right-center" :text="$t('main_ui_copy')" @click="() => $copy(result.max)">
                            <Input readonly :model-value="result.max" :label="$t('numberCalc_max')" />
                        </Display>
                        <Display position="right-center" :text="$t('main_ui_copy')" @click="() => $copy(result.range)">
                            <Input readonly :model-value="result.range" :label="$t('numberCalc_range')" />
                        </Display>
                        <Display position="right-center" :text="$t('main_ui_copy')" @click="() => $copy(result.stddev)">
                            <Input readonly :model-value="result.stddev" :label="$t('numberCalc_stddev')" />
                        </Display>
                    </div>
                </Align>
            </Card>
        </Align>
    </HeightResize>
</template>

<script lang="ts" setup>
import { initialize, useAction } from "@/store/action";
import { watch } from "vue";
import {numberStatistics} from "ctool-tools/domains/statistics";

const action = useAction(await initialize({ input: "" }));

/**
 * 从多行文本中提取数字并计算统计值
 * 支持每行一个数字，或每行多个数字（用空格/逗号/制表符分隔）
 */
const result = $computed(() => {
    return numberStatistics(action.current.input);
});

// 有有效结果时保存历史记录（避免在 computed 中产生副作用）
watch(() => result.count, (count) => {
    if (count > 0) {
        action.save();
    }
});
</script>
