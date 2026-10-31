import {defineAsyncComponent, defineComponent, h, shallowRef} from "vue";
import type {AsyncComponentLoader} from "vue";
import {sizeConvert} from "@/components/util";
import LoadingState from "@/components/LoadingState.vue";

// Each mounted boundary retries only its resource; input remains owned by the caller.
export function retryableComponent(loader: AsyncComponentLoader) {
    return defineComponent({
        inheritAttrs: false,
        setup(_props, {attrs, slots}) {
            const height = () => sizeConvert(typeof attrs.height === "string" || typeof attrs.height === "number" ? attrs.height : "100%");
            const component = shallowRef(make());
            function make() {
                return defineAsyncComponent({
                    onError(error, _retry, fail) { error.message = "部分内容未能打开，请重试"; fail(); },
                    loader, suspensible: false,
                    loadingComponent: defineComponent({setup: () => () => h(LoadingState, {style: {height: height()}})}), delay: 0, timeout: 30000,
                    errorComponent: defineComponent({setup: () => () => h(LoadingState, {failed: true, style: {height: height()}, onRetry: () => { component.value = make(); }})}),
                });
            }
            return () => h(component.value, attrs, slots);
        },
    });
}
