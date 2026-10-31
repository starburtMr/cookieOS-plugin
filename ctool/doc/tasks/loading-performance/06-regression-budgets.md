# PERF-06：功能回归与性能门禁

目标：完整功能与失败边界回归通过，防止无关重型依赖回到首屏，性能比较可重复并按冻结预算验收。

依赖：PERF-02至05。契约：[DD-PERF-07](../../../Detailed-Design.md#dd-perf-07-预算与完成门槛)。

## 文件归属与复用

ctool/package.json、packages/ctool-core/vite.config.ts、既有单测/浏览器测试、tests/package.test.mjs。
拟新增scripts/check-startup.mjs及tests/performance.mjs的预算比较部分；后者由PERF-01建立，不另写第二套测量器。
使用现有Rollup产物图、Node标准库、Playwright/CDP，不新增bundle分析器运行依赖；新增脚本必须留会因违规而失败的最小自检。

## 实施步骤

1. 从generateBundle输出建立入口静态闭包和当前路由实际请求集合。按chunk.modules定位具体依赖，不只匹配vendor-*文件名；分列JS、CSS、字体、WASM和Worker，避免重复计数。
2. 对轻量shell、hash、Base64分别建立允许/禁止依赖；Monaco、mathjs、Prettier、quicktype、QuickJS等无关重库不能进入对应闭包。用注入违规依赖的临时测试图证明门禁会退出非0，不修改正式图自证。
3. 完成全部88入口回归并为核心场景增加结果断言；复用原合同与capability用例，不把挂载数量当完整功能。共享基础导出变化要跑旧100工具、旧合同和错误语义回归。
4. 接入check:startup到build:extension产物生成后及现有verify；输出精确依赖链和预算差值。模块图只留开发/测试产物，不进入安装包。
5. 新增test:performance作为需要固定环境/隔离宿主的独立入口；快速verify保留确定性结构/故障回归，不强迫任意机器跑同一个毫秒阈值。发布验收必须跑固定环境before/after组。
6. 使用PERF-01已冻结budget.json，按DD-PERF-07公式验收。缺样本/环境不匹配/协议字段缺失都不标通过；不能自动重建预算或拉高已有lint/重复基线。
7. 审查运行diff：工具定义、后端协议、秘密配置、大小/精度限制、原生依赖没有无意变动。若出现必须的额外变更，先记录范围原因及最小回归，不伪装为纯优化。

## 必要验收

- 偏好延迟/失败/恢复、不同键双窗口保存、取消与资源释放、快速切换、动态模块失败恢复用例通过。
- 旧verify全部相关门禁通过；原195告警是历史记录，当前实际数字另记，不增加既有预算300。0新增重复且不重建基线。
- 初始轻量功能的网络请求确实不下载禁入重库，首次重型工具没有用后台预载所有工具换取“更快”。
- before/after逐次样本与median/min/max归档；请求增多但依赖和可操作时间改善时解释原因，不能单凭请求数量否决或宣称成功。
- 全部声明功能保留；无失败自动重放AI/收费/写操作。明确正常本地计算不依赖外部模型。

## 检查与结果

接入后的命令：在ctool执行rtk proxy npx --yes pnpm@10.34.9 run verify；check:startup/test:performance为拟新增命令，实施后记录实际参数和退出码。
本轮已生成结构/耗时门禁和真实样本，功能与结构通过；耗时结果单独列示。


## 本轮实际实施与结果

check:startup接入build:extension/verify，按modules遍历依赖闭包，JSON禁止提前加载quicktype。check:performance比较同环境/足量样本和原预算，负向测试覆盖违规依赖、体积、环境漂移、样本不足与耗时回归。最终完整verify为365单元/229合同/14包与预算/40浏览器，0错误195告警、0新增重复；耗时目标单独报告，不伪称全部达标。

完整命令、当前产物、逐次样本与未验证项见[本轮验证](../../verification/loading-performance/README.md)，发布和清理不得以构建成功替代。
