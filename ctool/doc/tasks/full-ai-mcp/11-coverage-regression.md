# FULL-11：完整覆盖与回归门禁

状态：实现与验收记录见文末；实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：冻结caseId清单、旧14合同、既有22服务/7打包/浏览器用例及新业务样例。
依赖：FULL-03至10全部可集成；FULL-01/02。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

tests/contract.test.mjs、package.test.mjs、tests/browser/；各业务邻近单测；capability-cases夹具。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 从实际注册表导出manifest与工具清单，自动核对矩阵每个caseId都有成功/边界或失败证据，并核对ai/mcp=true，不手抄数量。
2. 使用同一业务输入比较UI共享处理器、Node HTTP、内置AI调度、真实MCP结果；对计算结果用独立标准向量或第三方实现，不让同一错误在三端互相证明。
3. 旧14完整定义逐字段不变，既有17结果语义不破坏；拒绝未知参数、无效类型、非法结果、错误callId与伪成功。
4. 文件/Worker/队列/socket/模型全部覆盖取消、超时、断线、重启/更新；有状态与可能写入结果未知不能自动重放。
5. 复用pnpm verify及已有重复门禁，新增必要测试接入相应现有命令，禁止用排除/重建基线掩盖失败。

## 验收与证据

- 60/88与原子operation全部覆盖，0个缺失映射；功能关闭/假实现不能算通过。
- 现有全量检查及新增回归通过，已知基线失败与本轮回归分开记录。
- 声明数、实际可发现数和能力说明一致；超过宿主单页100时测试nextCursor。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。

## 本轮落点与验收记录

- 实际落点：tests/fixtures/capability-cases.json、capabilities.test.mjs、contract/package/browser tests。
- 已执行：143可执行用例，60类/88路由/100工具映射；355单元+229服务+8包+26浏览器，非穷尽组合测试。
- 统一命令和当前产物证据：[验证记录](../../verification/full-ai-mcp/README.md)、[检查收据](../../verification/full-ai-mcp/checks.json)。隔离宿主与真实外部供应商分开记录；限制不以完成标记掩盖。
