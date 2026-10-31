# FULL-06：文本、代码与解析

状态：实现与验收记录见文末；实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：矩阵FULL-06；现有formatter、文本/SQL/UA/堆栈/HTTP转换与差异组件。
依赖：FULL-01；大文件依赖FULL-02。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

packages/ctool-tools/src/domains/text/、code/；原UI调用方；不引入第二套编辑器。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 覆盖文本全部操作、命名/拼音/中文数字、正则、文本与结构化差异。保留CRLF、Unicode、空行与原模式，差异返回有界增删改与位置。
2. 代码格式化/压缩沿用原formatter和全部语言列表；HTTP请求转换保留cURL/HAR与全部目标；Docker只转文本，不运行命令。
3. 抽离SQL填参、堆栈解析、UA解析为纯函数；SQL不执行、堆栈不自动读服务器源文件。UA保留现有MIT分支字段。
4. 现有依赖树已有jsdiff4.0.2（BSD-3-Clause），Node行差异探针通过；优先复用它与recursive-diff1.0.9，并核对UI位置/换行语义。需要直接依赖时显式声明精确版本，不依赖偶然hoist；不假定新版本的timeout等API在4.0.2存在，不自己写diff算法。

## 验收与证据

- 所有文本选项、格式化语言和HTTP转换目标有映射caseId，不能只测JavaScript。
- SQL引号/注释/NULL/多占位符、堆栈多语言和UA缺字段失败/边界均验证。
- 灾难性正则/极长diff可中止；HTTP转换不发出网络请求。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。

## 本轮落点与验收记录

- 实际落点：ctool-tools/src/domains/textOperations、developer、formatter、sql、httpSnippet。
- 已执行：文本原操作/命名、15语言formatter共享、SQL注释/引号、正则、差异、UA/Compose等；全部语言参数未穷举。
- 统一命令和当前产物证据：[验证记录](../../verification/full-ai-mcp/README.md)、[检查收据](../../verification/full-ai-mcp/checks.json)。隔离宿主与真实外部供应商分开记录；限制不以完成标记掩盖。
