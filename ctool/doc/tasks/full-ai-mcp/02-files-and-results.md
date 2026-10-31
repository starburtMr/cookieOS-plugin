# FULL-02：分块文件、输出与临时资源

状态：实现与验收记录见文末；实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：DD-FULL-02合同；当前256KiB输入/1MiB输出预算、XHUB_DATA_DIR。
依赖：FULL-00；FULL-01。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

service/files.ts；packages/ctool-tools/src/contracts/files.ts；tests/files.test.mjs；UI文件适配；不建数据库/文件服务。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 实现file_begin/chunk/commit/status/read/delete；字节offset、预期size和SHA-256一致后才可用于业务。
2. 每块最多48KiB原始字节、标准Base64；重复相同offset/内容返回已接受，冲突拒绝，避免断网后重复追加。
3. 上传单文件8MiB、生成结果单文件16MiB、单实例总量64MiB、最多32项、空闲15分钟过期；输入输出各自预留总配额，失败释放。8MiB原始字节转Hex正好16MiB，Base64约10.67MiB，不能把输出仍限8MiB而遗漏展开系数。解压/图片维持各业务原上限。
4. 文件内容在插件数据目录专用临时子目录，随机不含路径的引用，0600文件/0700目录；拒绝软链接、../、绝对路径、超配额和不完整文件。引用用宿主外不可猜测随机能力，禁止全量列举。
5. 大文本/图片/二进制统一返回引用、mime、size、sha256，可分块读取；小结果沿业务Schema内联。浏览器本机路径不交给Node读取。

## 验收与证据

- 0字节、48KiB边界、8MiB上传/16MiB生成边界、Base64/Hex展开系数、错误offset、冲突重试、损坏摘要、过期/重启失效均有测试。
- MCP上传8MiB→计算→分块下载，逐字节与摘要一致；单次MCP请求始终<=256KiB。
- 没有凭据/绝对路径进入公开结果；无跨插件目录删除；文件引用是能力，不宣称最终用户ACL。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。

## 本轮落点与验收记录

- 实际落点：service/files.ts、definitions.ts；tests/files.test.mjs。
- 已执行：48KiB块/8MiB输入/16MiB输出/32文件64MiB配额；8MiB全摘要与下载、冲突、摘要、过期、重启/关闭。
- 统一命令和当前产物证据：[验证记录](../../verification/full-ai-mcp/README.md)、[检查收据](../../verification/full-ai-mcp/checks.json)。隔离宿主与真实外部供应商分开记录；限制不以完成标记掩盖。
