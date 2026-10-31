# FULL-04：JSON、序列化与数据

状态：未开始；本文件是任务合同，实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：JSON各子面板、Serialize和现有QuickJS/Schema Worker；矩阵FULL-04。
依赖：FULL-01；文件模式依赖FULL-02。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

packages/ctool-tools/src/domains/data/；JSON/Serialize UI调用方；Node DOM适配仅在service中。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 补齐JSON全部操作、Path/JMESPath、用户Schema、受限表达式和类型生成；保留大整数、不启用native eval/new Function。
2. JSON操作、用户Schema和工具Schema分离；每份Schema声明真实方言，外部$ref不自动抓取。查询引擎沿用safe模式并放可终止执行单元。
3. 迁移MsgPack、ASN.1以及现有11种配置格式/CSV与表格选项；明确BigInt/Date/二进制/空值/重复键/循环引用的表示或失败，禁止静默精度损失。
4. HTML表格复用DOMPurify+受支持jsdom离屏DOM，禁止脚本/资源加载；DOM差异只由适配器承担，不把DOM依赖放纯业务包。
5. JSON转换实体类沿用quicktype/现有PHP/Protobuf，不手写生成器；现有Serialize.formJson自动修复/降级行为必须做兼容策略，不能把非法输入悄悄当成功。

## 验收与证据

- 所有子面板/格式/选项有caseId；格式转换往返及不能无损表示的情况有断言。
- 恶意HTML、Schema递归/引用、JS内建大分配和死循环均不影响服务健康。
- Node端不能直接导入依赖$t/$error/window的UI文件；抽离后原页面回归通过。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。
