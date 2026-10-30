# 服务合同与首条真实路径

输入：[技术设计 §3、§5、§9](../../../High-Level-Design.md)、SDK Node 模板与 xhub 类型。输出首条 Base64 UI/服务共用路径。后续扩展由 C4 统一工具合同、E2/E3 接入外部请求。记录见 [Progress](../../../Progress.md)。

<a id="b3"></a>
## B3：Base64 与 SDK 服务贯通

**前置任务：B2。**

**目标：** 验证 UI→同一计算实现，以及宿主工具调用→Node→同一计算实现的完整路径，不以 echo/sum 演示替代产品功能。

**修改范围：** `packages/ctool-tools/src/` 初始 Base64 定义/处理器，原 Base64 页面调用方，`service/main.*`，相关协议和单元测试。

**执行步骤：**
1. 复用原编码库，建立 Base64 编码/解码及两份 Schema；UI 可本地执行，Node 复用同一处理器，不维护第三份算法。
2. 沿 SDK 模板绑定端口 0，输出 READY 和 instanceId；所有 HTTP 请求校验 XHUB_SERVICE_TOKEN，healthz 回显宿主注入的 instanceId/version/toolsHash。
3. 接受 `POST /xhub/agent-tool` 的 tool/args/callId；校验请求大小、参数与结果，返回匹配 callId 的 ok/result 或 ok/error。语法错误走协议错误，业务失败不能只看 HTTP 200。
4. 不猜宿主 toolsHash 算法或额外请求头。身份不匹配验证针对宿主启动/健康握手，不能凭空向模板增加不兼容的必需 header。
5. 实现正常退出和后台资源清理；SDK 未承诺接受取消时，如实报告，不虚构已撤销外部操作。

**验收：** 中文/emoji、空串、错误填充、非法字节、极限长度；UI 与服务结果一致。缺/错 token、畸形 JSON、未知工具、额外字段、超限请求、错误 callId/错误结果均有断言。健康正常但工具失败必须被识别。

**证据：** 实际端口/握手、服务 HTTP 正反例、UI 操作与同一输入结果。测试不打印 token；真实宿主握手留 G1，不能用模拟服务冒充。


## 本轮实现记录（2026-10-30）

- 任务：B3。
- 实现：Node 绑定随机端口、READY/healthz 身份、Bearer 校验与 callId 成功/失败 envelope 已接通；Base64 共用字节校验。
- 验证：tests/contract.test.mjs；tests/package.test.mjs 的无 node_modules 隔离启动。
- 状态与最终命令结果：[Progress](../../../Progress.md)。真实宿主验收项保持待验收。
