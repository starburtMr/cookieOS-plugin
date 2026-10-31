# FULL-10：全部宿主模型辅助

状态：实现与验收记录见文末；实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：现有12类提示词、useHostAi、SDK client/http.mjs/models.mjs/vendor与实际错误码。
依赖：FULL-00模型合同；FULL-01；大结果依赖FULL-02。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

packages/ctool-tools/src/prompts/；service/ai.ts；service/vendor/cookieos-models/；UI提示词调用方。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 将12类现有提示词抽到纯构造函数，正则生成/解释分别列operation，共用ai_assist；不重新实现模型供应商适配、SSE或工具代理。
2. Node使用原SDK客户端发起调用，ai_assist快速返回modelCallId；ai_call_status/cancel按原句柄查询/取消。工具调用callId与模型modelCallId不同，不能混用。
3. 模型选择支持default或显式稳定ref，缺省模型返回可执行中文提示；不自动切供应商或修改宿主默认，不新增模型授权/插件模型开关。
4. 排队/运行/部分文本/截断/完成/失败/取消/超时/未知全部保留；未知只查询原调用，不重新生成；具体SDK行为先由FULL-00验证。
5. 新增AI工具ai/mcp=true，但调用宿主模型不会自动嵌套执行本插件其他工具；普通算法不调用模型；界面仍需明确采用结果，外部调用直接返回结果数据。

## 验收与证据

- 12类operation清单与所有原提示词一一对应（正则两项）；缺默认/删除模型/凭据缺失/限流/超时/断流有回归。
- 模拟SDK链路和真实隔离宿主模型调用分别记录，真实费用调用有测试授权才执行。
- 默认模型缺失不再统统显示泛化失败；UI旧结果不覆盖新输入。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。

## 本轮落点与验收记录

- 实际落点：service/models.ts、sdk/、共享aiPrompts/diffPrompt；tests/models.test.mjs。
- 已执行：13操作严格分支、SDK协议、不重放、取消/并发；真实隔离模型桥与内置AI使用本地供应商夹具。
- 统一命令和当前产物证据：[验证记录](../../verification/full-ai-mcp/README.md)、[检查收据](../../verification/full-ai-mcp/checks.json)。隔离宿主与真实外部供应商分开记录；限制不以完成标记掩盖。
