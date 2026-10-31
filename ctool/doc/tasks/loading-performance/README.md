# Ctool 加载性能与稳定性任务入口

本轮交付是可执行方案和模块任务，运行代码仍为0.3.0，尚未实施性能优化。
需求见[Product-Spec](../../../Product-Spec.md#加载性能与稳定性优化2026-10-31)，技术契约见[DD-PERF](../../../Detailed-Design.md#dd-perf-01-边界与复用)，证据与官方依据见[研究记录](../../research/loading-performance.md)。阶段只在[DEV-PLAN](../../../DEV-PLAN.md)，实际状态只在[Progress](../../../Progress.md)。

| 模块 | 目标 | 依赖 |
|---|---|---|
| [PERF-01](01-baseline.md) | 可重复测量与冻结预算 | 无 |
| [PERF-02](02-dependencies.md) | 轻量依赖与按需分块 | PERF-01 |
| [PERF-03](03-preferences-startup.md) | 设置保护与并行启动 | PERF-01、PERF-02首条轻量路径 |
| [PERF-04](04-editor-workers.md) | 编辑器与Worker真实就绪/释放 | PERF-01、PERF-02 |
| [PERF-05](05-recovery-navigation.md) | 加载失败、重试与切换一致性 | PERF-03、PERF-04 |
| [PERF-06](06-regression-budgets.md) | 回归、结构和性能门禁 | PERF-02至05 |
| [PERF-07](07-package-acceptance.md) | 新包、隔离宿主、合回和清理 | PERF-06 |

由当前主执行者顺序执行01→02→03→04→05→06→07，不委派子智能体。依赖可分离不代表多智能体授权。
每个模块负责其列出的文件；共享入口、清单、构建和verify最终由主执行者统一集成。不修改相邻插件或cookieOS。
模块表中的拟新增路径是实施落点；文档规划完成不表示这些源码、脚本或报告已生成。

## 实施入口

从实际主目录先检查dirty/index与已有worktree；本轮规划worktree不复用为未来实施工作区。只有目标路径和分支尚不存在时，建立codex/ctool-loading-performance worktree；有同名目录先检查归属，不覆盖。
在新工作区ctool目录核实Node、Python和锁文件版本，沿用现有依赖准备方式，不借用其他工作区的可写dist/.cache或复用会被清理的node_modules链接。

现有命令，在ctool目录执行（本环境shell命令使用rtk）：

~~~sh
rtk node --version
rtk python3 --version
rtk proxy npx --yes pnpm@10.34.9 install --frozen-lockfile --ignore-scripts
rtk proxy npx --yes pnpm@10.34.9 run initialize
rtk proxy npx --yes pnpm@10.34.9 run check
rtk proxy npx --yes pnpm@10.34.9 run test
rtk proxy npx --yes pnpm@10.34.9 run build:extension
rtk proxy npx --yes pnpm@10.34.9 run verify
~~~

build:extension已包含原生部署依赖准备，环境条件仍遵循原[验收文档](../../verification/full-ai-mcp/README.md)。构建和verify共用输出目录，不并发执行。
拟新增check:startup与test:performance要在PERF-06接入后才可调用；当前不存在，不把它们写成已执行命令。

## 总完成条件

- 原100个AI/MCP工具及其合同、60类/88入口实际功能、用户ctool.pref.*配置与数据不变；数量只是当前回归集合，不替代结果断言。
- 性能比较绑定同一环境/测试输入/打开入口/压缩和缓存条件；工具可输入、执行、得到正确结果才是可用。
- 先解决可测的阻塞，不能为了体积删功能、抬高资源上限或跳过校验；收费与非幂等操作不自动重放。
- 计划后的版本建议0.3.1；实际实施若版本已占用则选择下一合法SemVer，保留旧包，不覆盖。
- 隔离验收通过后只合回自有差异、复验、清理自有worktree；无正式推送/发布/安装/重启授权，不触碰正式环境。
- 缺环境只交付明确标注的候选，PERF-07真实验收保持未完成；不承诺零bug。
