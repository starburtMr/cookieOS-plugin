# S12-04 隔离验收与发布

目标：完成用户指定的 SDK 1.2.0 展示资料适配。

依赖：S12-03。

修改范围：隔离 cookieOS 安装与 UI 验证、发布记录、market 清单、Progress。

接口依据：下载 SDK 的 README、metadata.schema.json、开发 Skill 和 dev.py --help；产品要求见 [Spec](../../../Product-Spec.md#sdk-120-展示资料适配)。

验收：核对资料、多视口、图片预览/键盘/坏图/无图、停用资料、更新回退与保留数据重装及代表性工具/AI/MCP。缺环境逐项记录；仅隔离服务测试导出与安装，不推送/发布；正式包/媒体发布和 sequence/签名待授权，合回后清理。

执行记录：由当前主执行者顺序完成，不使用子智能体；实际命令、结果、未验项见 [Progress](../../../Progress.md)。结果：实现和本轮适用验收已执行，实际结果及限制见 [验证记录](../../verification/sdk-1.2/README.md)。正式市场发布保留待办。
