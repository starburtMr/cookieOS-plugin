# FULL-12：打包、隔离宿主与交付

状态：未开始；本文件是任务合同，实际进度只在 [Progress](../../../Progress.md) 记录。

## 目标与输入

目标：完成本模块在[覆盖矩阵](capability-matrix.md)的全部操作，不以接口数代替功能覆盖。
输入：现有assemble/SDK check pack market-item、SDK1.2展示资料、0.2.0不可变ZIP与实际验证记录。
依赖：FULL-11；FULL-00目标平台证明。
设计：[Detailed-Design](../../../Detailed-Design.md)；复用依据：[研究记录](../../research/full-ai-mcp.md)。

## 文件归属与输出

tsup.extension.config.ts、scripts/assemble.mjs、tests/package.test.mjs、manifest/metadata/README；doc/verification/full-ai-mcp/。
主执行者拥有集成/公共注册表/文档；本轮不授权子智能体。后续多人改动不得回退他人差异，公共合同变更先回FULL-00。

## 实施步骤

1. 最终目标版本0.3.0，ID不变；只有实现验证完成才递增运行manifest，展示文案与实际注册清单同步，不能现在修改运行版本假装完成。
2. 多个Worker入口与SDK客户端/WASM/native依赖进入允许集。Sharp/canvas等有本机文件的包不能noExternal全吞；精确保留service/node_modules生产依赖闭包、只选已验OS/CPU/libc，安装不运行npm钩子。
3. 原先任意node_modules都拒绝的审计只对已核定service生产依赖路径放行，仍拒绝开发依赖/缓存/凭据/临时文件。收集Sharp Apache-2.0、libvips/Cairo及所有传递依赖实际许可。
4. 在无开发node_modules、独立数据目录中执行全部工具；记录压缩包<=256MiB/解压<=1GiB宿主预算与实际媒体/文件数限制，超限先减未用依赖，不删业务能力。
5. 隔离cookieOS安装最终ZIP，显式开启AI/MCP开关、在隔离MCP服务选择新增工具并配置测试令牌；不假设旧服务授权自动涵盖新增工具。检验完整MCP/内置AI、四种UI、0.2.0升级/回退/保留数据、停用重启、坏包不破坏旧版；0.1.0原包不兼容事实保留。
6. 发布不属于本轮规划授权。形成ZIP/SHA/测试证据；仅获得本版本GitHub发布授权和真实地址/时间后生成market-item，再上传不可变媒体、更新sequence与签名，不覆盖0.2.0。

## 验收与证据

- SDK check/pack与真实安装分别记录；没环境/凭据时标未验证，不能签完整验收。
- 最终ZIP字节与所有验收/摘要一致，依赖离线就绪，密钥/运行数据不在包里。
- 自有差异合回、主目录复验、删除worktree；原未提交经验文档不进入提交。
- 测试接入现有 `pnpm test`、`pnpm test:contract`、`pnpm test:package`、`pnpm test:e2e` 对应入口，单模块先跑适用子集；命令与完整集成顺序见任务入口。不为无关代码造新检查器。
- 记录样例、命令、退出状态、实际产物与未验证项；失败修复后重跑受影响检查，再做顺序两阶段审查。不以文字勾选替代证据。
