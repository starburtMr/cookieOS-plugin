# FULL-00：合同、兼容基线和阻塞性验证

状态：实现与验收记录见文末；实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：现有14工具完整定义、17后端定义、矩阵、SDK 1.2.0、服务与宿主调用代码。
依赖：无。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

tests/fixtures/legacy-tools.json；tests/fixtures/capability-cases.json；contracts/ 新合同；不改算法实现。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 将14份现有工具定义和成功/失败样例冻结为向后兼容夹具，记录构建源commit与SHA，不重新制造旧版本。
2. 逐行读取矩阵所列原页面、选项和算法；给每个原子操作唯一caseId，关联旧入口、新工具/operation、成功与错误样例及负责模块。
3. 冻结矩阵实际去重得到的100个工具名称候选，不把工具名当覆盖证据；全部名称<=40字节，最终manifest<=256KiB。
4. 验证文件分块经真实隔离MCP链路、共享Schema方言在宿主严格校验下可编译、callId取消与未知结果、MCP名单分页。
5. 图像Spike分别比较当前styled-qr-code fork+隔离DOM、官方qr-code-styling 1.9.2+jsdom 30.1.3/canvas 3.2.3；覆盖圆点/渐变/角点/Logo、PNG/JPEG/WebP解码和扫码回读。不能把普通黑白QR替代样式功能。
6. 若采用jsdom 30.1.3，明确服务Node范围改为^22.22.2（仅22.x，Rust semver可解析）；先在隔离宿主验证管理运行时，不修改正式宿主或全局Node。新依赖锁定精确版本并复核许可/漏洞。
7. 确认服务工具协议不携带最终用户身份；文件/会话按能力引用设计，不宣称多租户隔离。若目标验收要求独立用户隔离，该路径阻塞，另列宿主合同需求。

## 验收与证据

- 14份旧合同快照可与当前构建逐字段比对。
- 60/88与全部operation关联齐全；无unknown-owner、无以“功能很多”代替枚举。
- 每项Spike有命令、结果、平台与失败判据；图像/模型条件未通过不得将相应阶段标为完成。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。

## 本轮落点与验收记录

- 实际落点：service/main.ts、tests/fixtures/legacy-tools.json、capability-cases.json。
- 已执行：100唯一工具名称、14旧公开合同、17旧接口Schema/effect兼容；运行manifest字节预算断言与包测试。
- 统一命令和当前产物证据：[验证记录](../../verification/full-ai-mcp/README.md)、[检查收据](../../verification/full-ai-mcp/checks.json)。隔离宿主与真实外部供应商分开记录；限制不以完成标记掩盖。
