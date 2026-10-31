# PERF-02：轻量依赖与真实按需加载

目标：轻量工具不下载无关重库，重型工具保留全部能力且没有新增可避免的串行等待。

依赖：PERF-01。契约：[DD-PERF-01](../../../Detailed-Design.md#dd-perf-01-边界与复用)、[DD-PERF-03](../../../Detailed-Design.md#dd-perf-03-依赖拆分与资源调度)。

## 文件归属与复用

packages/ctool-core/src/helper/code.ts、components/register.ts、components/serialize、helper/text/index.ts、helper/radix.ts、tools/*相关调用方；packages/ctool-core/vite.config.ts。
packages/ctool-tools/src/index.ts及反向引用它的实际domains；只抽取已存在的基础函数/错误类型，不改算法或100个工具定义。
拟新增helper/languageMetadata.ts与ctool-tools/src/domains/primitives.ts，位置以实际复用为准；禁止引入新通用工具注册系统。

## 实施步骤

1. 先在基线记录Monaco运行时完整语言id/aliases及原getDisplayName/allLanguage结果，再分离纯显示数据与编辑器运行时。优先已有目录数据；不足时提交当前版本的最小id/aliases数据快照、来源和全量对照测试。Monaco升级时对照失败，不能静默减少语言。
2. Editor与Diff实际需要的运行时继续从编辑器边界加载；展示标签只使用纯元数据。全局注册的序列化输入输出改为真正按需组件或移除其重型顶层依赖，保持v-model、插槽与尺寸行为。
3. Base64校验、checkTree、进制基础函数和ToolError按真实需要移到无注册副作用的最小共享模块；旧index原路径re-export同一实现。检查domains对index的反向依赖，不能只换成仍反引总入口的子路径。
4. 保留所有校验、大小/精度限制和错误码；新旧导出ToolError必须是同一类，instanceof保持，禁止复制同名错误类造成合同变化。
5. 先用自动分块对照现有manualChunks，检查公共CJS辅助函数是否被收进重块。必要时只对实测稳定的重型边界手工分块；onlyExplicitManualChunks虽在当前Rollup存在，不能未经产物对照直接作为修复。
6. 使用现有moduleInventory/generateBundle保留全部许可输入，并新增chunk→imports/dynamicImports/modules/bytes映射。检查CSS/字体和Worker，不只看JS。若拆CSS，保持ui/style.css全局入口，懒加载CSS独立命名，不能沿用所有CSS同名造成覆盖。
7. 轻量路径和直接进入JSON/代码/数学都抓请求时间线。当前目标明确时才开始其组件/必要依赖并行加载，沿用Vite预载；禁止启动后遍历全部路由预热。

## 必要回归与验收

- hash与Base64输入、结果与非法输入行为不变；代码/JSON/diff语言集合和格式化、数学精度不变。
- 轻量入口实际请求及其初始静态闭包不含Monaco、mathjs、Prettier/quicktype或QuickJS等无关重型能力。hash的必要摘要依赖允许，但不能因此载入无关RSA/SM库。
- package boundary无新增循环；旧公开函数、错误类型和服务工具合同通过现有测试。
- 重工具所需资源保持可取得；没有人为新增可避免的组件→依赖→Worker串行瀑布。若某语言服务只能运行时启动，记录为必要链并给耗时证据。
- 原许可清单与Worker模块合并能力保留；不以sideEffects=false删初始化，不用不完整Monaco替代完整功能。

## 检查与结果

在ctool依次执行现有check、test、build:extension、test:contract、test:package、test:e2e；新增测试贴近语言辅助/基础模块。先运行目标测试，再按PERF-06集成verify。
规划时仅有静态分析；本轮实现与产物证据见下文。


## 本轮实际实施与结果

已移动primitives并保留旧导出同一对象，修复radix与YAML二级旁路；91项语言元数据独立于Monaco。序列化/编辑器异步，JSON代码生成器按区域加载；28语言/302选项与真实处理器逐项对照。GBK原表与算法保留，构建仅剔除无消费路径的其他编码索引。

完整命令、当前产物、逐次样本与未验证项见[本轮验证](../../verification/loading-performance/README.md)，发布和清理不得以构建成功替代。
