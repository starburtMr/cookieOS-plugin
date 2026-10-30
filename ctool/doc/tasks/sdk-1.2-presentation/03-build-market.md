# S12-03 构建与市场产物

目标：完成用户指定的 SDK 1.2.0 展示资料适配。

依赖：S12-02。

修改范围：现有 assemble、测试、SDK 合同快照、最终 ZIP / item.json / market-assets。

接口依据：下载 SDK 的 README、metadata.schema.json、开发 Skill 和 dev.py --help；产品要求见 [Spec](../../../Product-Spec.md#sdk-120-展示资料适配)。

验收：最终 ZIP 经 SDK 1.2.0 check/pack/market-item；生成条目与 ZIP 摘要、大小、媒体内容一致；输出不存在才创建；旧资产不可覆盖。

执行记录：由当前主执行者顺序完成，不使用子智能体；实际命令、结果、未验项见 [Progress](../../../Progress.md)。结果：实现和本轮适用验收已执行，实际结果及限制见 [验证记录](../../verification/sdk-1.2/README.md)。正式市场发布保留待办。
