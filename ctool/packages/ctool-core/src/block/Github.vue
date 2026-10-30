<template>
    <Align class="ctool-github" gap="none">
        <span class="ctool-github-name" @click="openUrl(`https://github.com/nidhogg1024/Ctool`)">
            <Icon name="github" :size="12"/> <strong>Ctool</strong>
        </span>
        <span class="ctool-github-star" v-if="star > 0" @click="openUrl(`https://github.com/nidhogg1024/Ctool`)">
            {{ `${star}`.replace(/(\d)(?=(\d{3})+$)/g, "$1,") }}
        </span>
    </Align>
</template>

<script setup lang="ts">
import {openUrl} from "@/helper/helper"


let star = $ref(0)


</script>

<style scoped>
.ctool-github span {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    column-gap: 5px;
    font-size: 12px;
    height: 24px;
    padding: 2px 5px;
    text-decoration: none;
}

.ctool-github span:hover {
    color: var(--ctool-primary-hover);
}

.ctool-github .ctool-github-name {
    border: 1px solid var(--form-element-border-color);
    border-radius: 3px 0 0 3px;
}

.ctool-github .ctool-github-star {
    border: 1px solid var(--form-element-border-color);
    border-left: none;
    font-weight: bold;
    border-radius: 0 3px 3px 0;
}
</style>
