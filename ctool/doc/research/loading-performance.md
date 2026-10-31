# Ctool 加载性能：证据、复用与外部依据

记录日期：2026-10-31。性质：规划前核对；不是优化完成报告。
基线源码提交：3b841f0，插件版本0.3.0；本轮仅规划，未修改运行代码、依赖或版本。
范围与验收见[需求](../../Product-Spec.md#加载性能与稳定性优化2026-10-31)，设计见[DD-PERF](../../Detailed-Design.md#dd-perf-01-边界与复用)。

## 已核对版本与 SDK

按当前已安装包读取：Vue3.5.3、Vue Router4.4.3、Vite6.4.4及其实际解析Rollup4.57.1、Monaco0.51.0、@monaco-editor/loader1.4.0、mathjs15.2.0。实施环境必须按锁文件复核，不以声明范围当安装版本。
本地权威cookieOS SDK的sdk.json为1.2.0、hostApi ^1.0.0；插件[桥类型](../../contracts/xhub.d.ts)只有逐键storage.get/set/remove，没有批量读取、CAS、偏好变更通知或tool-ready接口。实现前再对照目标宿主SDK；不能自行发明接口。
锁文件SHA-256：7729b2343b604ed15836e6bb163b8336133a807528f911a9099f80f181de3f3f。

## 已证实的源码与产物问题

| 证据 | 当前事实 | 结论边界 |
|---|---|---|
| src/tool.ts | await loadPreferences，再await剪贴板权限，再安装router并等待isReady后挂载 | 11项读取已并行；工具请求与设置等待仍存在可优化的串行关系 |
| helper/cookieos/storage.ts及storage.test.ts | 11个独立键、同步内存镜像、逐键写队列；已有不写默认值与部分读取失败测试 | 不能简单移除await或整份设置合并；后台恢复与多窗口仍须补验 |
| helper/plugin.ts → components/register.ts → SerializeInput/SerializeOutput → helper/code.ts | 全局组件静态注册间接加载Monaco语言运行时 | Editor异步注册没有阻止绕行的静态依赖 |
| helper/text/index.ts → ctool-tools/src/index.ts | 基础Base64使用总入口；入口会注册工具和编译Ajv validators | 优化函数的导出位置，不删除校验或重写编码算法 |
| ctool-tools/src/domains/encoding.ts、checksums.ts、calculation.ts | 部分领域模块通过ToolError/convertRadix反向引用index | 子路径导入本身不能保证隔离；必须检查整个依赖闭包 |
| components/editor/Editor.vue | create内部没有等待monacoInit；等待实例的setInterval未集中清理；挂载注册content_clear而卸载未对称移除 | 存在就绪误报和卸载竞态风险；尚未做运行时泄漏定量复现 |
| helper/cookieos/task.ts及task.worker.ts | 每次任务新建并终止Worker；Worker顶层包含多个不同任务依赖 | 保留真实取消；初始化开销和按任务导入的收益尚待测量 |
| block/Index.vue与platformRuntimeDefault.ts | 首页有最近/常用工具选择逻辑，但operate状态不在11项宿主偏好预载中 | 不能把同实例最近工具误写成跨新实例持久恢复 |
| tests/browser/plugin.spec.ts | 88入口回归检查挂载/错误，含固定等待 | 不能替代工具输入、执行、结果断言或性能测量 |
| tests/host-browser.mjs | 通过Playwright route转发与静态文件响应验证隔离宿主 | 该夹具不能作为HTTP缓存性能测量依据 |

上述src路径相对于packages/ctool-core；未声明所有路径均已在真实宿主复现故障。

## 现有构建静态快照

对本地ctool/dist/extension/ui/main.js用已安装es-module-lexer1.7.0解析，仅递归静态import/re-export；工具只用于本次只读检查，不作为新产品依赖。
main.js的SHA-256为b34ff4391c592ae9703a36787644ad4e967773a0b3ba0f0dd38eddf421b51706，组装manifest为0.3.0。

| 文件 | 原始字节 |
|---|---:|
| main.js | 1,882,969 |
| assets/vendor-lodash-lg7EmeVo.js | 72,312 |
| assets/vendor-mathjs-C1mPqW6K.js | 656,135 |
| assets/vendor-monaco-B5Xd0fFr.js | 3,371,528 |
| assets/vendor-crypto-CooYXE4v.js | 422,143 |
| 静态JS闭包合计 | 6,405,087 |

Lodash chunk静态引用mathjs chunk；crypto chunk静态引用mathjs与Monaco chunk。chunk名称不代表内部只包含相应库，公共辅助代码被放入重型chunk也可能产生这种边。本轮没有重新构建追溯该快照，也没有浏览器传输/耗时基线，实施的PERF-01必须干净重建、导出模块到chunk映射并复测，不能直接把本表当优化前后的同条件对比。
这不包含当前路由动态依赖、CSS、字体和Worker。TS Worker现有原始文件约6.05MB，task Worker约1.85MB；只说明按需加载的重要性，不证明它们在首屏已经被请求。

## 外部依据与采用决定

2026-10-31先执行Context7 CLI library查询，返回Monthly quota reached；未获得有效Context7正文。可通过npx ctx7@latest login或配置CONTEXT7_API_KEY提高额度，但本轮未改账户配置。以下来自定向网络搜索、官方英文正文及当前版本源码，不依据中文镜像或搜索摘要直接定方案。

| 来源 | 本轮采用与限制 |
|---|---|
| [Vue performance](https://vuejs.org/guide/best-practices/performance.html#code-splitting) | 使用现有动态导入与组件边界，实测首屏闭包；不增加另一套懒加载框架 |
| [Vue异步组件API](https://vuejs.org/api/general.html#defineasynccomponent) | 组件局部加载/错误/用户重试复用defineAsyncComponent；生命周期和输入保留仍由插件负责 |
| [Vue Router懒加载](https://router.vuejs.org/guide/advanced/lazy-loading.html) | 路由保留返回import Promise的函数，不把defineAsyncComponent当路由组件；以4.4.3源码复核，不能照搬新版本专有功能 |
| [Vite6.4.4 build文档](https://github.com/vitejs/vite/blob/v6.4.4/docs/guide/build.md#load-error-handling) | 复用相对base、已有动态导入预载与vite:preloadError诊断；官方刷新示例不直接采用，会丢当前输入 |
| [Rollup manualChunks](https://rollupjs.org/configuration-options/#output-manualchunks) | 手工分块会吸入依赖并影响副作用时机；先对照自动分块，按产物图决定，不能盲设sideEffects=false |
| [Rollup generateBundle](https://rollupjs.org/plugin-development/#generatebundle) | 扩展已有moduleInventory，导出chunk.imports/dynamicImports/modules与字节数，不自写JS解析器；保留原许可输入清单 |
| [Playwright page.route](https://playwright.dev/docs/api/class-page#page-route) | route启用会关闭HTTP缓存；缓存基线不用route/HAR回放，故障注入另跑。采用当前1.64.1接口 |
| [MDN Resource Timing](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming) | 分开transferSize、encodedBodySize、decodedBodySize；跨源受限的0值不是缓存命中证明 |
| [MDN Long Tasks](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming) | 采集长任务次数/总时长/最大值；API不支持时标不可用，不记0；必要时用现有Chromium CDP trace定位 |
| [MDN import缓存行为](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object) | 下载/链接失败与求值失败的缓存行为不同；去掉自己的rejected Promise缓存仍需真实重试测试，不拼随机URL无限加载副本 |
| [Monaco0.51.0源码](https://github.com/microsoft/monaco-editor/tree/v0.51.0)与[loader1.4.0源码](https://github.com/suren-atoyan/monaco-loader/tree/v1.4.0) | 保留现有编辑器/语言/Worker；本地loader有模块级wrapperPromise，不调用私有reset。失败分类后验证相同URL恢复，永久求值错误给保留草稿后的重新打开路径 |

复用结论：不新增运行依赖、不升级框架、不引入Service Worker/PWA缓存、不复制MCP/SDK协议、不改数学或密码算法。必要自写仅为插件自身启动编排、逐键初始化状态、资源清理、局部失败恢复和测试度量。语言元数据是版本化数据，优先复用已有清单；若需从当前Monaco导出id/aliases快照，保留MIT来源并与真实运行时全量比较，不能删语言来缩包。

## 尚未验证

首次/缓存打开、工具首用与连续切换耗时，实际传输、CPU解析/长任务、真实宿主缓存头、资源释放斜率和最终新包验收均未执行。不会因方案存在就标记优化或兼容成功。


## 实施补充：版本数据与首次重工具

- 真实隔离采样期间发现宿主二进制和前端构建发生变化；不同摘要的早期耗时不用于最终对比。测试脚本支持复制的既有宿主前端与二进制，最终比较固定同一份产物，不修改宿主。
- text-decoding 1.0.0 的原始 encoding-indexes.js 为529,879字节，SHA256为9b54c6b23e1e90bbf12e9753a18cd7e1484382b93b4fd0d2f68814ea039a2386。真实唯一消费路径Uint只支持UTF-8/GBK；UTF-8和解码使用原生API，GBK继续使用原库GB18030Encoder及原始gb18030/gb18030-ranges数组。构建复用已有TypeScript AST提取两份原数据，源码摘要变化即失败；不修改依赖安装目录、算法或Node工具。
- JSON首用采样发现普通编辑会下载约1.39MB Json块，其中整套quicktype仅供可选“转实体类”使用。原Option类移动至纯options入口，语言/选项快照来自实际quicktype-core 23.0.170（Apache-2.0）和既有Protobuf/PHP处理器；28种语言、302项选项以122份唯一定义复用。测试逐项对照实际处理器、默认值与存储恢复；转换器仍沿用原完整库，ToObject采用现有可重试异步组件。
- 默认首页原本在挂载Index后才请求选中工具；现在只预载新实例实际选中的常用工具，等常用列表与语言读取完成后执行，避免提前固定错误语言或预热所有工具。原路由选择优先级和存储键不变。
- 当前SDK dev.py/xhub.d.ts与本地1.2.0副本字节一致；metadata.schema.json差异仅文件末尾换行，JSON合同一致。
