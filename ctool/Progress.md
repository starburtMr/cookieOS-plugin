# Ctool 实际进度

当前阶段：0.3.0完整AI/MCP的本地交付保持；本轮为加载性能与稳定性规划，运行代码未改。当前任务见[加载优化模块](doc/tasks/loading-performance/README.md)，阶段见[DEV-PLAN](DEV-PLAN.md)，实际证据及未验项见下方本轮记录。后面的原迁移任务表与早期段落保留历史语境，不能作为当前版本状态。

## 2026-10-31：加载性能规划交付

- 范围：只交付需求/设计增量、研究依据、DEV-PLAN阶段依赖、7个模块任务及共享经验，不实施运行代码，不递增当前0.3.0，不生成新包或推送/发布。
- 规划基线：3b841f0；主目录原有docs/market.md未提交内容独立保留。使用自有codex/ctool-loading-plan-20261031 worktree，不复制或公开本地开发规则。
- 已核实Vue3.5.3、Router4.4.3、Vite6.4.4/Rollup4.57.1、Monaco0.51.0与loader1.4.0；本地权威SDK1.2.0/hostApi ^1.0.0。Context7额度耗尽已明确说明，改查官方英文资料及本地实际版本源码，见研究记录。
- 当前既有构建的静态闭包为5个JS/6,405,087字节，不是网络传输或耗时基线。确认全局序列化组件→语言辅助→Monaco、基础工具反引注册入口、挂载前等待11个并行偏好及剪贴板查询，以及编辑器真实Promise/清理问题。
- 当前方案的预算是待实测的验收目标，不是已取得收益。没有冷/暖缓存浏览器测量或新版本运行验收；这些由PERF-01至07执行。
- 文档检查：16个变更文件均为Markdown；7个模块文件存在且非空，189个本地链接/63个锚点核对通过，模块依赖无环，git diff --check通过。
- 本轮只做文档与方案复核，没有重跑业务测试、构建或实际性能测量；实现阶段的检查不记作已执行。合回/清理按已授权流程执行，最终状态以本轮交付命令结果为准。

| 模块 | 实施状态 | 当前下一步 |
|---|---|---|
| PERF-01 | 未开始 | 干净生产构建与同条件真实基线，冻结预算 |
| PERF-02 | 未开始 | 基线后隔离纯元数据、基础函数及重型依赖 |
| PERF-03 | 未开始 | 按键读状态/修改代次与并行启动 |
| PERF-04 | 未开始 | 真实编辑器就绪、清理与Worker按任务加载 |
| PERF-05 | 未开始 | 局部恢复、草稿保护和过期导航隔离 |
| PERF-06 | 未开始 | 结构/功能/性能门禁接入既有验证入口 |
| PERF-07 | 未开始 | 新版本最终ZIP、隔离验收、合回复验及清理 |

## 任务状态

| 任务 | 状态 | 实际结果 |
|---|---|---|
| 需求与附件盘点 | 已完成 | 60 工具 / 88 登记入口 / 12 AI 辅助，迁移矩阵已生成 |
| 公网 SDK 更新与合同核验 | 已完成 | SDK 1.1.0，包含 host-models；旧包已保留 |
| 官方资料查证与候选最小验证 | 已完成 | 见下文；尚非完整构建或浏览器集成 |
| A：上游导入、原始测试与浏览器可行性 | 本地通过 | 已导入源码/依赖，基线与 Worker 可行性已验证 |
| B：真实工具贯通 | 本地通过 | cookieOS 入口、偏好、主题、工具服务与 Base64 贯通 |
| C：完整迁移与 14 工具合同 | 本地通过 | 60 工具/88 入口保留，14 公开操作及失败边界自动验证 |
| D：12 项宿主模型辅助 | 本地模拟通过 | 12 类入口和生命周期已测；真实供应商待 G2 |
| E：全部联网功能接入 | 本地适配通过 | 固定后台适配与浏览器 WebSocket 已测；真实 JDoodle/CORS 待验收 |
| F：产物构建与打包 | 本地通过 | ZIP、SHA256、SDK 预检与隔离启动检查完成 |
| G：真实宿主验收 | 待真实验收 | 没有独立实例授权/测试凭据；不安装正在使用的实例 |

## 2026-10-30：需求阶段证据

附件 SHA-256：`f44d02599a5633cbad2a783fa05f4be9431f4ce69ebce6f7d3f3f8215832384d`；776 个 ZIP 条目，未将附件中内容作为用户命令执行。盘点来自实际配置及源码。

最初下载的 14,254 字节 SDK 没有模型接口；这是历史记录，已被后续重新获取的新包解决，不再作为阻塞。

## 2026-10-30：执行方案证据

### SDK 与工具链

- HTTPS 下载返回 HTTP 200、application/zip，ZIP CRC 与路径/链接/总大小检查通过。SDK 49,599 字节、28 条目。
- sdk.json：`sdkVersion=1.1.0`、`hostApi=^1.0.0`、`features=[host-models]`、`modelProtocolVersion=1`。
- SHA-256：`347776eea827f4b8f82896cf41a84587bc9c1d0847e21c5dc7a688c95821130c`。
- README、技能说明、Schema、类型、模板与 dev.py 帮助已核对。未全局安装技能、未修改宿主或全局配置。
- `node --test cookieos-extension-sdk/tests/models.test.mjs`：退出 0，8 passed / 0 failed，覆盖流终态、取消、UTF-8 边界、丢失确认不重发、输出上限等。测试使用模拟传输，不是真实供应商或真实 cookieOS 验收。
- Node 22.22.2、Python 3.13.7；全局 pnpm 9.15.3 与上游 >=10 不匹配。方案使用局部固定版本，不改全局。

### 现有代码和官方依据

- 原锁文件 JSONPath 9.0.0 落在 GHSA-hw8r-x6gr-5gjp 的受影响范围。
- 原 JSON Transform 以 new Function 执行表达式；原 HTML 表格导入在当前 document 挂载未经充分处理的内容。属于源码确认的迁移风险，尚未做真实宿主攻击复现。
- 官方 Pinia 插件 4.0.0 文档要求同步存储，不能直接接入异步 xhub.storage。
- 上游完整 MIT 许可已找到；UAParser 2.0.9 的 AGPL 单独确认，候选 MIT 1.0.41 的基础消费 API 已验证。
- Context7 查询两次均返回 monthly quota reached；Firecrawl 两次定向搜索无结果。实际结论来自官方页面/源码、安全公告、npm 元数据和下面的本地验证。来源链接已写入技术设计。

### 隔离 Node 候选验证

在本地忽略目录安装固定候选依赖，禁用安装脚本，不改生产或插件依赖，断言退出 0，6 项通过：

1. QuickJS 0.32.0 可计算 JSON 转换表达式。
2. VM 中 window/process/fetch/require/xhub 均不可用。
3. 无穷循环可由中断处理器终止。
4. JSONPath 11.2.2 的 safe 过滤与 null 结果正确。
5. CryptoJS 4.1.1 与 4.2.0 的固定 key/IV AES-CBC 双向兼容。
6. MIT UAParser 1.0.41 的 Chrome 基础 getResult 可用。

这些断言不覆盖浏览器 WASM 路径、宿主 CSP、全部 lodash 预设、所有加密模式或完整 UA 识别数据库。两个 CryptoJS 版本的安装都提示该库已停止维护，技术设计已限制其用途。

最初审计含专为兼容性比较安装的旧 CryptoJS 别名，退出 1、1 个 Critical，对应已知 <4.2.0 公告。该旧别名不进入产品；验证后已从候选目录移除。正式插件仍须针对完整实际依赖图审计。

移除旧别名后再次执行候选目录 `npm audit --json`：退出 0，info/low/moderate/high/critical 全部为 0。该结果仅覆盖本次探测安装的候选依赖图，不覆盖尚未导入/安装的 Ctool 完整依赖，也不包含尚未接入的 DOMPurify、Playwright 或浏览器运行结果。

### 有界公共接口探测

- GeoJS：查询固定公共地址 8.8.8.8，HTTP 200、合法 JSON，返回的 ip 匹配。
- ARM：固定样例 `mov x0, #1`、arch=arm64、offset=0，HTTP 200；结果为 `hex.arm64=[true,"200080D2"]`。
- 探测从开发机发出；不代表浏览器 CORS、多架构、插件 token 协议、长期可用性或限流已经验收。
- JDoodle 只阅读官方文档，未发送账号凭据或代码执行请求，未产生已知的该服务调用费用。

## 下一步

执行 A 阶段：安全导入原源码，记录原始检查基线，验证浏览器 QuickJS/Monaco 资源及完整依赖图，再接通 Base64 的真实 UI/服务路径。

先执行 A1 → A2 → A4；A3 的候选边界验证在此之后进行，未通过只阻塞 C3 依赖路径，不阻止独立的界面/服务工作。

本轮未提交、未推送、未发布 Release、未更改市场清单、未安装到任何正在使用的宿主。实际尚无业务插件实现或可安装 ZIP。

## 模块任务状态

以下是拆分后的实际执行状态；上面的阶段记录保留既有前置验证，不能据此将整项开发标成完成。

| 编号 | 任务文件 | 状态 |
|---|---|---|
| A1 | [安全导入](doc/tasks/cookieos-migration/00-baseline.md#a1) | 本地实现与适用自动检查通过；真实验收见 G |
| A2 | [原始检查基线](doc/tasks/cookieos-migration/00-baseline.md#a2) | 本地实现与适用自动检查通过；真实验收见 G |
| A4 | [重复基线](doc/tasks/cookieos-migration/00-baseline.md#a4) | 本地实现与适用自动检查通过；真实验收见 G |
| A3 | [浏览器候选验证](doc/tasks/cookieos-migration/00-baseline.md#a3) | 本地实现与适用自动检查通过；真实验收见 G |
| B1 | [身份与模板](doc/tasks/cookieos-migration/01-shell-storage.md#b1) | 本地实现与适用自动检查通过；真实验收见 G |
| B2 | [界面/偏好/历史](doc/tasks/cookieos-migration/01-shell-storage.md#b2) | 本地实现与适用自动检查通过；真实验收见 G |
| B3 | [服务与 Base64](doc/tasks/cookieos-migration/02-service-contract.md#b3) | 本地实现与适用自动检查通过；真实验收见 G |
| C3 | [执行安全](doc/tasks/cookieos-migration/05-execution-safety.md#c3) | 本地实现与适用自动检查通过；真实验收见 G |
| C1 | [数据/编码/文本](doc/tasks/cookieos-migration/03-data-encoding-text.md#c1) | 本地实现与适用自动检查通过；真实验收见 G |
| C2 | [加密/生成/开发辅助](doc/tasks/cookieos-migration/04-crypto-generation-dev.md#c2) | 本地实现与适用自动检查通过；真实验收见 G |
| C4 | [14 个共享操作](doc/tasks/cookieos-migration/06-shared-tools.md#c4) | 本地实现与适用自动检查通过；真实验收见 G |
| D1 | [宿主模型适配](doc/tasks/cookieos-migration/07-host-models.md#d1) | 本地实现与适用自动检查通过；真实验收见 G |
| D2 | [12 项 AI 辅助](doc/tasks/cookieos-migration/07-host-models.md#d2) | 本地实现与适用自动检查通过；真实验收见 G |
| E1 | [浏览器联网](doc/tasks/cookieos-migration/08-network.md#e1) | 本地实现与适用自动检查通过；真实验收见 G |
| E2 | [ARM](doc/tasks/cookieos-migration/08-network.md#e2) | 本地实现与适用自动检查通过；真实验收见 G |
| E3 | [JDoodle](doc/tasks/cookieos-migration/08-network.md#e3) | 本地实现与适用自动检查通过；真实验收见 G |
| F1 | [统一验证入口](doc/tasks/cookieos-migration/09-build-package.md#f1) | 本地实现与适用自动检查通过；真实验收见 G |
| F2 | [完整审计与许可](doc/tasks/cookieos-migration/09-build-package.md#f2) | 本地实现与适用自动检查通过；真实验收见 G |
| F3 | [打包](doc/tasks/cookieos-migration/09-build-package.md#f3) | 本地实现与适用自动检查通过；真实验收见 G |
| G1 | [真实安装/UI](doc/tasks/cookieos-migration/10-acceptance.md#g1) | 待真实宿主验收；无独立实例授权 |
| G2 | [真实模型/AI/MCP](doc/tasks/cookieos-migration/10-acceptance.md#g2) | 待真实模型/MCP 验收；无实例/凭据 |
| G3 | [生命周期与交付](doc/tasks/cookieos-migration/10-acceptance.md#g3) | 本地候选交付完成；真实生命周期仍待验收 |

## 2026-10-30：模块任务拆分与方案复查

- 用户明确要求模块任务文件必须创建；本次将原总计划中的步骤/命令/验收迁入 11 个模块文件，补充目录入口，DEV-PLAN 仅保留阶段、依赖和链接。
- 保留 A1–F3 原编号，并将原 G 阶段具体化为 G1/G2/G3，总计 22 项；未把拆分文档误记成实现完成。
- 60 行工具矩阵逐行追加任务归属，code 工具的 format/run、JSON 的业务/执行边界分别指向负责模块；12 项 AI 与 14 个公开操作各有专属任务。
- 复用上轮同版本官方文档、候选与 SDK 测试证据；本轮未重复宣称运行那些测试。
- 本轮联网读取 QuickJS 官方问题 #219/#275 与 DOMPurify 官方 README。新增对内建操作、累计分配、独立 Worker 截止及字符串消毒的任务要求；上游报告尚未在本项目复现，A3 保持待验证。
- 本轮仍只修改方案文档；未修改业务源码/运行配置、未推送、未发布或安装。
- 交付前实际检查通过：11 个模块文件均非空，22 项目标/范围/依赖/步骤/验收/证据字段齐全；编号唯一、依赖无环，原 A1–F3 编号完整保留。
- 17 份文档的 177 个本地链接及任务锚点、Markdown 代码围栏与空白检查通过；矩阵与附件配置逐项比对，覆盖 60 工具 / 88 登记入口，每行都有模块归属。
- DEV-PLAN 已确认不含具体 shell 命令或任务步骤；Progress 具有完整 22 项状态，均未冒充实现完成。私有检查报告保存在本地忽略目录，不进入插件包。


## 2026-10-30：worktree 实现与本地候选验证（进行中）

- 在独立 `codex/ctool-extension` worktree 中导入附件 Ctool 2.9.1；未覆盖主目录方案文件。源码保留原 packages 布局，增加共享操作、Node 服务、cookieOS 适配、干净产物组装与自动测试。
- 运行环境 Python 3.13.7、Node 22.22.2、pnpm 10.34.9；没有修改宿主服务或全局配置。附件和 SDK SHA256 沿用本文件来源记录，SDK 1.1.0 合同快照在 contracts/。
- 原附件缺 README/LICENSE，补齐后建立基线：323 tests、类型检查、原 Vite build 通过；原 lint 有存量告警。重复基线为 33 个指纹，后续不以重建基线消除新增重复。
- Node 服务的 14 个纯操作与 3 个仅 UI 联网操作共用注册定义，构建时生成 manifest。所有请求鉴权，健康检查回显实例身份；业务错误与 HTTP 状态分开，无自动重放。
- 界面改用宿主偏好、主题与模型；默认不留工具历史。原供应商地址/密钥设置已移除。QuickJS、正则、Schema、压缩与二维码使用有界 Worker；修复原 HTML 表格插入页面、随机数取模偏差和 YAML 负数符号问题。
- 已获得的阶段证据：88 路由本地浏览器冒烟、包内 WASM/死循环终止、20+ 服务合同与隔离无 node_modules 启动、SDK Schema 校验、AI 生命周期测试。增加 12 类 AI 入口逐项模拟验收时发现 HTML 弹层挂载点遗漏，已修复，正在复验；最终数量和结果以收尾记录为准。
- 完整/生产依赖审计仍含原平台与构建图告警；已针对实际 bundle 中的命中版本修补并回归，不宣称全工作区零告警。安装包许可清单按实际构建输入生成，保留 LGPL 库源文件及 source maps。
- 未进行真实宿主安装、真实模型/MCP、JDoodle 运行、停用/更新/回退、GitHub Release 或市场上架。缺独立环境/授权或外部凭据的项目保留待验收。


### 回归中的更正

连续路由检查在 URL 解码页失败的原因最终确认是测试断言：Playwright 的 `toBeEmpty` 将只有空文本框的容器视为“空”，并非该页没有挂载。已改为检查实际控件节点；路由入口采用 RouterView slot、按页面的 Suspense 和启动前 router.isReady，移除原手动 v-if 切换。弹层挂载节点缺失属于真实迁移缺陷，已单独修复并由生成对话框用例验证。不会将测试问题冒充产品缺陷数量。


### 收尾检查补充

- 对照实际 bundle 版本核对 npm 审计快照；移除了不需要的 Node crypto 浏览器兼容路径，避免将未修复 elliptic 签名实现带入产物。原平台/开发依赖仍有告警，具体范围见 docs/dependency-audit.json。
- 构建清单汇总 UI 与全部 Worker 输入，不只记录最后一个 Worker。许可文本非空且包含 LGPL 库的原发布源文件/source maps。
- 删除原 Bcrypt、RSA 密钥生成、cURL 参数、序列化异常及路由失败的原始数据调试输出；输入、密钥与请求不会通过这些日志分支输出。
- Bcrypt 进入共用的 4 秒可终止 Worker；保留 2a/2b/2y 格式，原 UI 允许范围收敛为实现实际支持的 4..30，超时明确提示，不让高成本操作持续占用页面。

## 最终本地候选检查（2026-10-30）

- `pnpm verify`：退出 0；24 个单元测试文件 / 343 tests，22 个服务合同 tests，4 个包测试，22 个浏览器用例全部通过。包括 88 路由、12 类 AI 入口、输入变化/切页/未知模型结果、WASM/内存分配/解压限制、HTML 消毒、二维码往返、WebSocket 断开、SM2 与 Bcrypt 浏览器往返。
- 类型检查（UI 与 Node）、构建、lint 均通过；lint 185 条非阻塞告警以原源码为主，不宣称无告警。新增重复 0；单独注入重复的反例被门禁拒绝，未重建基线掩盖重复。
- `dev.py check dist/extension`、SDK `pack`、ZIP 可读性/路径/入口/依赖/链接排除检查通过。SDK 预检不替代宿主完整安装校验。
- 安装包：`dist/ctool-v0.1.0.zip`（仓库根目录），7807213 字节，483 个文件条目。SHA256：`6c74dbcfdd00d956cb9154f09dd16178761bcc8171f3155017c0e92d95c24b6e`；旁边提供 `.zip.sha256`。
- 产物仅含 manifest、ui、service、licenses、LICENSE。Node 服务在无开发 node_modules 的临时目录独立启动通过；208 个实际引用包均有许可记录。审计快照对照实际包版本没有命中已知公告；全工作区仍有未打包的原平台/开发依赖告警，不等于全面安全保证。
- 源码目录 `ctool/`；模块任务 11 份实际非空、22 个任务编号保留，DEV-PLAN 仅阶段/依赖，191 个文档链接检查通过。
- 两阶段审查由当前主执行者顺序完成，没有独立审查者；实现/合同/测试与维护边界审查无剩余 Critical/Important。本次批准范围为本地候选交付，G1/G2 与真实生命周期保留待验收。
- 未安装正在使用的 cookieOS、未调用真实模型或带凭据的 JDoodle、未推送/发布 GitHub Release、未登记市场。真实界面形态/宿主 CSP/AI/MCP/停用/更新/回退仍依验收任务执行，不能以本地模拟替代。


## 合并与清理（2026-10-30）

- 功能提交 `2f1c4c2` 已 fast-forward 合回主目录 main。合并前核对 HEAD、索引和 17 份原方案文件的基线，原方案另存本地备份；未覆盖并发改动。
- 主目录复验：UI 类型检查、26 项服务/打包合同检查、SDK 文件预检通过；ZIP 校验摘要未变化。依赖和构建产物迁入主目录，离线 frozen-lockfile 安装成功。
- 本次 worktree 与功能分支已删除。未推送远程、未发布市场或安装正在使用的 cookieOS。


## 本地预览调整：移除头部标识（2026-10-30）

- 按页面圈选移除普通及简洁布局左上角 Ctool/GitHub 入口；普通布局同步改为两列网格，分类和搜索保留。仅修改现有头部组件，无新增依赖、接口或数据变更。
- worktree 中完成实现；`pnpm --filter ctool-core run build`（含 UI 类型检查）、两文件 ESLint、`pnpm check:duplicates`、`git diff --check` 均退出 0。首次直接类型检查缺少 worktree 的生成文件，复用主目录有效生成文件后重跑通过。构建仍有原依赖注释、crypto externalize 和混合导入告警。
- LAN 预览浏览器检查：普通/简洁布局各在 1074×884 和 390×884 下确认标识不存在、搜索可见且未越界；普通布局分类切换通过；四种组合均无 pageerror。简洁布局通过预览桥偏好注入启用。
- 当前主执行者顺序完成两阶段审查：Stage 1/2 APPROVE，无 Critical/Important；未使用独立审查者。本次是可逆展示删除，未新增测试文件，使用真实构建页面验证。
- 已更新本地预览 UI；未重新打包原 v0.1.0 ZIP、未发布、未做真实 cookieOS 宿主验收。


## 首次市场测试发布（2026-10-30）

- 用户授权推送远程并测试市场发现；源码 `main` 已推送至 `afdfac493d3ddb6c6ef58d3a4c37b076c1cc956f`。本次元数据在独立 worktree 修改，未上传本地开发框架、私钥或运行数据。
- 从该源码重新执行 `pnpm build:extension`，UI 类型检查与构建通过；`pnpm test:contract` 22/22、`pnpm test:package` 4/4、SDK check/pack、ZIP 路径/链接/文件允许集检查通过。新构建浏览器 JSON 格式化和头部删除检查通过。原全量业务验证沿用同日有效记录，本次未重复全量单测和路由用例。
- 首次公网资产：`dist/market-release/ctool-v0.1.0.zip`，7806928 字节，483 条目；SHA256 `1b605e6d6437f996d56d10edb253ebf8b7cd46adc1031f9516f82f99ec12c8e4`。保留旧本地候选 ZIP，不覆盖旧文件。
- GitHub Release `ctool-v0.1.0` 标记预发布：https://github.com/starburtMr/cookieOS-plugin/releases/tag/ctool-v0.1.0。匿名 HTTPS 实际下载成功，ZIP 完整性和 SHA256 与本地一致。
- 市场清单递增至 sequence 2，登记唯一 Ctool 条目；使用原本地 Ed25519 私钥签名，固定公钥验签通过，改动清单/签名的反例均被拒绝。字段已对照当前宿主市场解析及展示实现，仅补清单及说明，不改宿主。
- 当前主执行者顺序完成两阶段审查：Stage 1/2 APPROVE，无 Critical/Important；无独立审查者。此轮只改文档/发布元数据，没有源码或新重复逻辑，自动重复检查不适用。清单和签名已同次推送；匿名下载公网 main 清单、签名和公钥，确认 sequence 2、Ctool 0.1.0，原始字节与本地一致且验签通过。
- 真实市场刷新、安装、宿主模型、外部 MCP 以及停用/更新/回退仍未验证；未修改正在使用的 cookieOS 配置或自动安装扩展。


## SDK 1.2.0 展示资料适配（2026-10-31）

- 独立 worktree 实施，主目录原有 `docs/experience.md` 未提交改动保留；本轮模块任务已创建到 `doc/tasks/sdk-1.2-presentation/`（入口+4模块），DEV-PLAN 仅阶段/依赖。
- 公网 SDK 已核实1.2.0，新增 metadata、品牌图标、3张实际插件截图和包内用户介绍；运行身份集中 manifest，Vite及assemble复用它。未增加生产依赖或更改存储键。实际统计60/88 UI、12类模型辅助、17后台工具、14 AI/MCP，口径见盘点。
- 真实安装暴露旧0.1.0 ARM元组Schema缺少Draft7声明，最小修复为 outputSchema.$schema 注解；名称、入参、结果数据语义不变，增加方言和合同回归。原发行包在最新宿主被拒绝，未伪称其升级成功；合同等价旧版测试包升级/回退/保留数据重装通过。
- `build:extension`、UI/服务类型检查、变更文件ESLint、22服务合同、7包测试、22浏览器用例、重复门禁、SDK check/pack/market-item通过；真实隔离Node服务、安装器、市场HTTPS下载、MCP、模型模拟链路和展示/生命周期通过。源码代码与产物验证详见 [验收记录](doc/verification/sdk-1.2/README.md)。
- 最终本地ZIP：`dist/ctool-0.2.0/ctool-0.2.0.zip`（仓库外层），8111069字节，SHA256 `c654d7af057a177d078042539a2fd03e8625fe645641dea5db7caa02be16140f`。`item.json` 与4个内容摘要媒体由该ZIP经SDK生成，只含本次真实临时HTTPS地址和时间，不可用于正式发布；正式item/sequence/签名更新待授权，本轮未推送、发布或重启正式服务。
- 未验证：旧宿主实际安装、未经修改原发行包升级、真实外部模型推理/JDoodle。另观察到390×442内嵌JSON页按钮遮挡，桌面操作通过，本轮未扩展工具布局整改。三种视口资料弹窗/滚动/预览/可选字段降级通过。
- 两阶段审查由当前主执行者顺序进行，无独立审查者；Stage 1/2 APPROVE，无剩余本轮Critical/Important。最后按已验证自有差异合回，验证原改动哈希、主目录包合同和SDK预检，再清理本次进程、容器与worktree。

### 本轮合回收尾

- 实现提交 `0ce9f83` 已 fast-forward 合回主目录。主目录 UI 类型检查、7 项包测试、SDK 1.2 文件预检通过，最终 ZIP 摘要与 SDK 条目不变。
- `docs/experience.md` 原未提交内容的 SHA256 与本轮开始时一致；本次未暂存或提交该文件。5份模块任务/入口实际非空，65个本地文档链接检查通过。
- 本轮 worktree、功能分支已删除；独立后端/UI/HTTPS媒体进程、端口、PostgreSQL容器/卷和临时凭据已清理。未推送、未正式发布或重启正式服务。收据见 [合回清理](doc/verification/sdk-1.2/merge-cleanup.json)。


## GitHub 0.2.0 发布（2026-10-31）

- 用户在本地交付后明确授权发布GitHub。复用此前实际隔离验收的最终ZIP，不重新构建或改包；SHA256 `c654d7af057a177d078042539a2fd03e8625fe645641dea5db7caa02be16140f` 保持不变。
- 源码已推送，Release `ctool-v0.2.0` 指向 `0ce9f83a2de46205da38d4777c9674ea0487b45b`，保持预发布标记。GitHub实际发布时间 `2026-10-30T19:26:08Z`；ZIP、摘要及4份内容摘要PNG已公开。
- 使用SDK 1.2.0 `market-item` 从原最终ZIP和真实GitHub地址/发布时间重新导出正式 `dist/ctool-0.2.0-github/item.json` 与媒体。匿名HTTPS下载ZIP/摘要/4媒体，逐文件检查大小和SHA256；公开item.json与SDK输出逐字节一致。早期临时item不复用、不覆盖。
- 仅替换清单中Ctool条目，保留其他插件；sequence递增至3、有效期续90天，使用原私钥签名并通过固定公钥验签和篡改反例。清单和签名同次推送后，匿名获取公开main清单/签名/公钥，逐字节与本地匹配；sequence 3、Ctool 0.2.0及固定公钥验签通过。
- 本轮元数据/文档在独立worktree修改；无运行源码或依赖变更，未重复全量业务测试。当前主执行者顺序两阶段审查通过，无独立审查者。原未提交经验文档保留，不公开本地开发框架和密钥。
- 外部真实模型/JDoodle、旧宿主、未经修改原0.1.0升级及短屏工具按钮等限制保留；本次没有安装或重启正式cookieOS。

GitHub发布收尾：本轮元数据已合回主目录，发布worktree及分支已删除；原未提交经验文档哈希未变。公开Release、正式item和市场签名已复核，仍保留预发布及原验证限制。

## 设置抽屉重叠修复（2026-10-31）

- 模块任务：[设置布局](doc/tasks/settings-layout/README.md)。模型设置从标签列移入内容列，窄屏换行、勾选项自适应高度，标题日期可换行。仅打开设置时将 AI 结果放到遮罩下，关闭后保留结果及原层级。
- 原构建复现选择框仅 112px；最终构建/类型检查、相关 ESLint、重复门禁通过（544 源文件，0 新增重复），17 项浏览器回归通过。模拟模型桥，未发起真实模型请求。主执行者顺序两阶段审查通过，无独立审查者。
- 不发布、不改线上安装、模型选择或用户数据，保留正式版本与不可变 ZIP；本次是本地源码修复。合回主目录后复验并清理自有 worktree。

## 移除底部反馈入口（2026-10-31）

- [模块任务](doc/tasks/remove-footer-feedback.md)：仅删除复杂布局底部反馈入口及空容器，保留其他布局与工具按钮。类型、UI 构建、相关 lint、重复门禁通过，三种尺寸的既有浏览器回归 3/3 通过，截图确认底部不再显示反馈入口。
- 独立 worktree 实现，主执行者顺序两阶段审查，无阻塞项；不修改配置、不发布或更新线上插件，原经验文档改动保留。

## 完整 AI/MCP 方案（2026-10-31）

- 本轮仅完成规划与联网核实，业务实现尚未开始；运行版本仍0.2.0/14个AI-MCP工具，目标版本0.3.0不是已发布版本。
- 创建[13个模块任务](doc/tasks/full-ai-mcp/README.md)、[60类/88入口矩阵](doc/tasks/full-ai-mcp/capability-matrix.md)、Detailed-Design和研究证据。DEV-PLAN只追加阶段与依赖。
- 已检查SDK1.2.0/hostApi ^1.0.0与宿主工具合同：MCP请求256KiB、清单256KiB、名称40字节、工具超时1..300秒、MCP一页100。当前服务取消仅accepted=false，完整长任务需补齐。
- 联网查阅ws、QR上游/实际fork、Sharp、JsBarcode、DOMPurify、jsQR与Node官方资料；Context7本轮可用。Node22.22.2小图探针通过Sharp0.35.4的PNG/JPEG/WebP编解码、JsBarcode对象渲染与jsQR输入；实际QR fork直接Node导入失败self is not defined。完整QR样式/Logo、native离线包、宿主新合同与真实模型/JDoodle仍待对应任务验证。
- 下一步FULL-00：冻结旧合同和caseId，验证文件/Schema/取消/图像/模型阻塞点；本轮未改运行源码、依赖、manifest/metadata，不安装/重启正式服务、不推送或发布。

方案交付核对：13个编号模块文件实际存在，矩阵60类/88入口、100个工具名候选与原14个兼容接口关系已核对；233个本地文档链接目标存在。主执行者顺序完成范围/合同与可行性/复用两轮审查，无独立审查者；修正编码展开系数（8MiB输入对应最多16MiB生成文件）、jsdom Node最低版本和原子AI操作计数。JSON证据可解析、git diff --check通过。完整业务测试/真实安装未执行，因为本轮不改业务实现；图像完整渲染、native离线包与外部模型/JDoodle仍保持待验。


## 完整AI/MCP实施检查点（2026-10-31，尚未最终验收）

- 在独立 `codex/ctool-full-ai-mcp` worktree 实施，基线6380408；主目录原有经验文档改动保持独立。
- 旧17个工具定义已冻结到tests/fixtures/legacy-tools.json；14个旧公开输入/输出合同保留。当前注册100个名称，均声明AI/MCP；名称数不作为操作覆盖结论。
- 已接入分块文件（48 KiB/8 MiB输入/16 MiB输出/64 MiB总额）、临时引用、取消与固定子进程。早期8 MiB→16 MiB Hex往返、健康及正则取消回归通过。
- 共享纯模块已从原界面迁移；Node代码继续使用既有库。旧界面的类型规则strict=true/noImplicitAny=false保留于共享包；服务入口/Worker仍严格检查，通过声明文件消费包边界。
- 较早检查点：扩展工具50/50，联网/模型整合53/53通过，模型为本地协议夹具，未调用真实供应商或JDoodle。此后新增边界修复和测试，需重新完整验证。
- 实测发现并修复：大文件逐字节拼接导致堆溢出；依赖复制与构建清理竞争（准备顺序改为串行）；CJS lodash命名导入及打包入口冲突；QR默认Byte中文截断。正则等同步工作不在HTTP主进程执行。
- 当前补强：负纳秒精度、最小负数补码、SQL引号/注释参数、Properties原型名称、RSA浏览器旧API兼容，以及BMP/ICO解码。原生图像使用固定子进程；JS堆预算256 MiB，不宣称为原生/RSS硬上限。
- 采用SDK1.2.0现有模型客户端；13个辅助操作共用原12类页面提示词（正则含生成/解释）。开始、状态、取消与外层工具callId分开，不自动重放。
- 新版本目标0.3.0，Linux x64 / Node ^22.22.2。正式推送、安装和发布未在本轮执行；最终构建/ZIP/隔离宿主/完整审查及合回清理仍待完成。


## 完整AI/MCP最终本地交付（2026-10-31）

- 0.3.0统一注册100个AI/MCP工具，旧14公开及17总接口合同保留；60分类/88入口与143可执行用例实际生成并核对。13个模块文件均补实际落点/结果，DEV-PLAN仍只维护阶段与依赖。
- 全量verify通过：355单元、229服务合同、8包、26浏览器；类型/lint（0错误195告警）/0新增重复通过，基线未改。sharp修复到0.35.5，运行依赖audit为0已知漏洞；异步Schema有先红后绿回归。
- 最终ZIP、SHA/预算、实际宿主及浏览器结果、剩余限制统一见[完整验证](doc/verification/full-ai-mcp/README.md)。模型为本地协议夹具，未发起真实供应商或JDoodle费用操作；未发布0.3.0、未生成虚构market-item。
- 原生组件公开分发仍需许可/源码归档收尾；可信自用能力引用不是多用户ACL，RSS采样不是硬隔离，非全部参数组合已穷举。
- 当前主执行者顺序两阶段审查通过；实现提交6ba6c23已快进合回main，主目录全量verify复验通过，自有worktree及临时分支已删除。主目录原经验文档SHA保持5f78615da12f04db0b928b3fe013a22c85d56c7094ce6702a7383886d0109f5a，不进入提交。


## 0.3.0 市场发布（2026-10-31）

- 沿用此前最终 ZIP，SHA-256 保持 2a42f6a4b858c131e9db4fc6aa43e25a3e9e722b13adf1f61e4acd1ae4dcb1ac，安装包约40.9 MB；本轮未实施加载性能优化或修改正式宿主。
- GitHub预发布0.3.0、正式SDK市场条目及媒体已公开；全部22个资产通过匿名HTTPS下载与摘要核对。第三方源码独立分卷提供，补齐固定源码/构建配方/补丁及原生来源核对；安装无需下载源码。
- 本轮重新运行最终ZIP隔离验收，九项通过，含0.2.0升级保留配置/数据、100工具MCP与文件往返、模型桥、停启、坏包保护、回退及保留数据重装；模型仍是本地协议夹具。
- 市场清单sequence 4与新签名已生成并验签，原公钥不变；推送后的公开清单及市场安装结果在[发布记录](doc/verification/release-0.3.0/README.md)与[模块任务](doc/tasks/release-0.3.0/market-publication.md)回写。
