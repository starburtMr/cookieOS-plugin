# PERF-04：编辑器与Worker生命周期

目标：编辑器真正可用才结束加载，切换/关闭不创建过期实例或持续累积自有资源。

依赖：PERF-01、PERF-02。契约：[DD-PERF-05](../../../Detailed-Design.md#dd-perf-05-编辑器与worker生命周期)。

## 文件归属与复用

packages/ctool-core/src/components/editor/{Editor.vue,Diff.vue,monaco.ts,contextMenu.ts,placeholderContentWidget.ts,lineInfo.ts}及相关测试。
helper/cookieos/{task.ts,task.worker.ts}、实际调用这些任务的页面。沿用Monaco0.51.0、loader1.4.0、现有Web Worker与取消信号。

## 实施步骤

1. 先复现初始化延迟后立刻切换/关闭的竞态和等待轮询；Editor.create必须等待完整初始化并返回结果，DOM出现不能标ready。Diff走同一实际就绪规则。
2. 每次组件创建使用本实例代次/销毁标记，异步完成后再次确认容器仍属于本实例；过期结果不创建编辑器、不覆盖输入。
3. 同实例缓存成功的运行时初始化；失败分为模块下载、loader初始化、editor.create、Worker四类，失败Promise不当成功缓存。loader不提供公开reset，不调用私有内部API；已注入本地monaco的路径先验证是否可直接复用API恢复局部创建。
4. 去掉等待实例的重复轮询，实例就绪后使用最新v-model同步，避免旧快照覆盖；初始化失败时输入仍由父层状态持有。
5. 对称清理事件、observer、定时器、补全注册、模型及编辑器。记录本组件创建的model再dispose，不能释放其他并存编辑器的model或共享语言运行时。
6. Worker只在所需语言/任务触发时创建；task Worker按kind需要加载模块，正则任务不提前加载QuickJS/二维码能力。保持现有真实terminate、总截止、输入上限和异常协议，先不改长驻池。
7. 明确共享Monaco语言服务与实例资源归属，避免关闭一个编辑器终止另一个仍在用的Worker。可以由Monaco管理的共享资源用实际版本行为验证，不宣称全部语言Worker在组件卸载瞬间为0。
8. Worker加载失败后用新任务恢复前须用户明确再次执行；不能将模块重试转成任务重放，尤其影响AI/外部调用时。

## 必要验收

- JSON诊断、JS/TS、CSS、HTML、普通编辑与Diff均能输入/编辑/显示结果；语言Worker请求出现于实际需要时，不在轻量入口出现。
- 初始化期间快速切换20次无脱离页面创建；失败→重试→可编辑，保留最新输入。
- 运行中取消、关闭、超时后任务Worker终止且Promise只终结一次；重复进入可再次执行，不复用损坏Worker。
- 同页面两编辑器、两个插件窗口相互独立。关闭/重开10轮和工具切换30轮，监听/模型/Worker不随轮数线性增加；记录计数，允许经证明有界的共享缓存，不用单次RSS波动断言泄漏。
- 执行时间上限包括按需加载时的实际等待；若需区分资源初始化与业务截止必须显式定义并回归，不能默默放宽既有计算预算。

## 检查与结果

相邻单测覆盖生命周期代次和取消，Playwright覆盖真实编辑/Worker，现有test:e2e及verify复验。
当前未实施，无运行时泄漏或速度改善的定量结论。
