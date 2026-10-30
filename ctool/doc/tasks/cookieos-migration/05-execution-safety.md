# 表达式、HTML 与资源边界

输入：[技术设计 §8、§11](../../../High-Level-Design.md)、[A3 可行性验证](00-baseline.md#a3)。本模块负责通用安全边界及 regex/gzip 实际入口；C1/C2 复用，不重复写另一套消毒/运行器。记录见 [Progress](../../../Progress.md)。

<a id="c3"></a>
## C3：隔离不可信执行并限制资源

**前置任务：A3、B3。**

**目标：** 保留表达式转换、HTML 表格、正则、Schema 和压缩功能，同时避免直接影响宿主桥或长时间阻塞页面。

**修改范围：** `tools/json/Transform.vue`、`tools/json/Schema.vue`、`helper/serialize/table.ts`、regex/gzip 原入口、必要 Worker/VM helper 与测试；不修改其他模块的算法政策。

**执行步骤：**
1. 复用 A3 已验证版本的 QuickJS Worker；提供 JSON 及固定 lodash，不注入宿主对象、fetch、require、文件和桥。输入序列化、输出边界、句柄释放均测试，主页面不执行用户 new Function。
2. VM 限制与独立 Worker 外部截止共同工作；禁止把 VM 限制参数当成整个浏览器内存硬保证。对上游 #219/#275 相关样例验证所选发布包；未达预算不得宣称该路径完成，不自行维护解释器或未经验证的 wasm 分支。
3. HTML 以字符串交给 DOMPurify，明确表格标签白名单并去除属性，离屏返回处理；不先经过可创建闭合 shadow root 的 unsafe DOM API，不在消毒后拼回原始 HTML。输出 HTML 中的用户值编码。
4. 用户 JSON Schema 与服务固定 Schema 分开；前者有大小/深度/执行预算、不抓远程 $ref、不无界 allErrors；后者由 B3/C4 维护可信定义。默认复用 Ajv，使用单独 Ajv2020 校验 SDK draft 2020-12。
5. 正则、Schema 和压缩使用可终止 Worker；解压增量计数，达到输出上限立即停止，不先完整展开后再判大小。

**验收：** 普通原预设结果正确；窗口/桥不可访问；长内建操作、累积分配、递归、死循环可在预算内失败且主页面仍响应；HTML 事件/SVG/畸形标签不执行、不外连；正则超时、Schema 深度、压缩炸弹、Worker 初始化/异常/退出均有断言。

**证据：** 固定候选版本、实际浏览器样例、预算/测量边界、退出与清理记录。安全路径不满足时保留明确阻断，不回退到主线程执行或偷偷删除原功能。


## 本轮实现记录（2026-10-30）

- 任务：C3。
- 实现：JSON 表达式用 QuickJS；正则、Schema、压缩与二维码用可终止 Worker。DOMPurify 消毒后离屏解析 HTML，输出转义。
- 验证：浏览器验证包内 WASM、lodash、无宿主绑定、死循环、分配拒绝、解压炸弹；HTML 输入选择器实际走解析路径；QR 生成/识别回归。
- 状态与最终命令结果：[Progress](../../../Progress.md)。真实宿主验收项保持待验收。
