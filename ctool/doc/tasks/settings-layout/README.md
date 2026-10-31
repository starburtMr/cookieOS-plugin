# 设置抽屉布局修复

范围：Setting.vue、HostModels.vue、AiActivity.vue 及既有 Playwright 用例。复用现有 Select、Align、Bool 和抽屉，不改模型调用、配置合同和存储键。
依赖：现有 Vue/Vite 构建及本地模拟宿主桥；无新增依赖。

验收：桌面、窄屏和短屏模型选择与刷新可达；普通历史选项不重叠；长内容可换行、抽屉可滚动；AI 结果浮层位于抽屉遮罩之下，关闭设置后结果仍在；选择模型仍写原存储键。

验证记录：原构建在 1074×700 的选择框宽度断言失败，实测 112px。初版直接降低结果浮层层级时，既有 Cron/文本 AI 弹窗用例暴露“使用结果”被模态框遮挡；已改为仅设置抽屉打开时降低层级，普通 AI 弹窗保留原层级。

工程检查：`pnpm build:extension`、最终 `pnpm --filter ctool-core run check`、Vite/tsup/assemble 构建、改动文件 ESLint 通过。`pnpm check:duplicates` 扫描 544 个源文件，0 个新增重复。单独重跑 assemble 需要重新执行 tsup 生成被组装过程消费的 metafile；已补齐，不修改发布脚本。

最终浏览器回归：`pnpm exec playwright test -g 'settings controls|AI result|late AI|unknown model|original AI'` 17 项全部通过（25.3 秒），涵盖三种尺寸、模型选择持久化、抽屉遮挡及原有 AI 接受/取消/断流路径。实际查看桌面与短屏截图。

审查：当前主执行者顺序完成 code-review 两阶段；Stage 1 核对实际操作和无配置/业务变更，Stage 2 核对组件复用、作用域与重复门禁，均无阻塞问题。按用户单智能体约束未使用独立审查者。

合回后复验与清理在 Progress 记录；只使用本地隔离浏览器与模拟桥，不调用真实模型，不修改生产配置。
