# FULL-01：服务取消、资源与生命周期

状态：实现与验收记录见文末；实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：service/main.ts、SDK模板、现有有界Worker、宿主service/invoke合同。
依赖：FULL-00公共合同冻结。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

service/main.ts；service/runtime.ts；service/workers/；tsup.extension.config.ts 的Worker入口；tests/contract.test.mjs。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 扩展服务统一注册表，保留createPluginServer现有调用签名和模板身份/token校验；纯业务包不得导入Node/DOM/宿主。
2. 按callId登记进行中调用与AbortController；实现既有/xhub/calls/{id}/cancel，存在可取消工作才accepted=true，结束后有界清理。
3. 正则/用户Schema/QuickJS/密钥生成等CPU工作使用可终止的固定Worker；原生图片运算必要时固定Node子进程隔离，禁止任意脚本/命令入口。
4. 初始并发2、待处理队列16、排队也计入截止；超载明确失败。Worker/子进程入口随包构建，退出/停用清理计时器与所有子任务。
5. 同步循环不能靠Promise.race中断；resourceLimits不限制ArrayBuffer/原生内存，记录输入/像素预算和进程RSS测量，不宣传为进程硬内存上限。

## 验收与证据

- 死循环、灾难性正则、重bcrypt、图片超限时健康接口仍可响应，取消后工作确实停止。
- 调用号不串线；取消与完成竞态有终态；写请求已发送时不会伪报未执行。
- 进程退出后无遗留Worker、socket、子进程或timer。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。

## 本轮落点与验收记录

- 实际落点：service/runtime.ts、worker.ts、main.ts；tests/runtime.test.mjs。
- 已执行：固定2子进程/16队列，真实取消/超载/10秒截止、健康和恢复；RSS样本不作硬限制。
- 统一命令和当前产物证据：[验证记录](../../verification/full-ai-mcp/README.md)、[检查收据](../../verification/full-ai-mcp/checks.json)。隔离宿主与真实外部供应商分开记录；限制不以完成标记掩盖。
