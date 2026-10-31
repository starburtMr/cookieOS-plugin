# FULL-03：编码、摘要与校验

状态：实现与验收记录见文末；实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：矩阵FULL-03各行；现有text/codec、hash、checksum实现；14合同夹具。
依赖：FULL-01；二进制路径依赖FULL-02。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

packages/ctool-tools/src/domains/encoding.ts、checksums.ts；对应UI适配；既有14工具薄兼容入口。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 按矩阵迁移Base64/32/58、Hex、URL、Unicode、HTML、Punycode、ASCII、Gzip、摘要与BCC/CRC/LRC；不另写codec和密码算法。
2. 旧14个接口保持原语义/类型/限制，扩展走新工具；特别是base64旧接口仍只接受UTF-8，hash旧枚举不偷偷改变。
3. 编码显式区分文本/字节；中文/emoji正常往返，无效UTF-8/坏Base64拒绝；摘要盐值表达式只支持原已核定模板，不能eval任意JS。
4. 流式累计解压预算8MiB，尚未输出前预检不够时仍需增量限制；CRC按独立已知向量确认端序，不盲信旧注释。

## 验收与证据

- 所有原选项caseId通过，文本和字节往返一致；文件摘要独立用Node crypto/标准向量核对。
- 压缩炸弹可终止；UI/HTTP/MCP相同输入一致；旧合同回归全部通过。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。

## 本轮落点与验收记录

- 实际落点：ctool-tools/src/domains/encoding、checksums、hash、hmac；service/crypto。
- 已执行：成熟codec/CRC动态清单、所有摘要/HMAC的8MiB输入、跨provider向量、gzip限制与Base32/58/Hex往返。
- 统一命令和当前产物证据：[验证记录](../../verification/full-ai-mcp/README.md)、[检查收据](../../verification/full-ai-mcp/checks.json)。隔离宿主与真实外部供应商分开记录；限制不以完成标记掩盖。
