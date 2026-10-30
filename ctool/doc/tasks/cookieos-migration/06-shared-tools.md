# 共享工具与公开合同

输入：[技术设计 §3–5](../../../High-Level-Design.md)、B3 初始合同、C1/C2/C3 已验证计算路径。所有工具定义和 manifest.tools 生成归本模块维护。状态见 [Progress](../../../Progress.md)。

<a id="c4"></a>
## C4：完成首批 14 个双端共享工具

**前置任务：B3、C1、C2、C3。**

**目标：** UI 与 Node 使用相同 Schema 和业务实现，内置 AI/MCP 通过宿主调度，不另建 MCP 服务。

**修改范围：** `packages/ctool-tools/src/`、实际使用这些能力的 UI 调用方、服务注册入口、manifest.tools 生成入口及对应测试。

**执行步骤：**
1. 在 B3 Base64 基础上实现技术设计中的完整集合：`json_format`、`json_validate`、`base64_encode`、`base64_decode`、`url_encode`、`url_decode`、`hash_digest`、`time_convert`、`radix_convert`、`cron_parse`、`text_process`、`config_convert`、`url_parse`、`uuid_generate`。
2. 从已经存在并通过回归的逻辑中提取纯函数，不复制一份 Node 算法；该包禁止依赖 Vue/DOM/Pinia/宿主桥/秘密/网络。
3. 逐项落实技术设计字段、枚举、默认值、空值语义、输入/输出上限，统一拒绝未知字段，不隐式类型转换；服务重新校验参数与结果。
4. 14 项标 `read/ai=true/mcp=true`；用户 Schema、任意 JS、私钥操作、消息发送和任意代码执行不进入该集合。URL 解析必须纯解析，不能访问传入目标。
5. 从同一注册表生成 tools 声明；构建验证定义与处理器名称集合相等、无重复。宿主 toolsHash 只回显注入值，不猜实现。

**验收：** 14 个工具各有正常、非法类型、额外字段、边界和结果 Schema 断言；同输入的本地与 HTTP 结果一致；不发生隐式上传。空串、非法 JSON、编码错误、大整数、DST、重复查询参数和无效时区按合同处理；业务错误保留匹配 callId。

**证据：** 注册表与产物声明一致性、每个工具的测试入口、HTTP 正反例。原 60 工具 UI 范围不因本集合而缩减；E2/E3 的手动联网工具加入同一生成入口但不默认暴露 AI/MCP。


## 本轮实现记录（2026-10-30）

- 任务：C4。
- 实现：14 个纯操作来自 packages/ctool-tools 注册表，服务直接执行，manifest 从同一导出生成；UI 复用相同计算/序列化能力，联网操作仅 UI 主动触发。
- 验证：合同测试涵盖 14 正常样例、全部工具额外参数拒绝、UTF-8/百分号/时间/精度/大小/循环 YAML 等失败。
- 状态与最终命令结果：[Progress](../../../Progress.md)。真实宿主验收项保持待验收。
