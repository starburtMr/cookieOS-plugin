# Ctool 完整 AI/MCP 任务入口

本轮在独立worktree实现0.3.0；运行注册表含100个AI/MCP工具，保留旧14公开合同。实现基线6380408，SDK1.2.0/hostApi ^1.0.0，运行Node ^22.22.2。实际结果与未验证项见Progress及各模块文末。

权威范围：[Product-Spec](../../../Product-Spec.md) 当前完整工具化条目。
设计：[High-Level-Design](../../../High-Level-Design.md)、[Detailed-Design](../../../Detailed-Design.md)。
范围：[60类/88入口覆盖矩阵](capability-matrix.md)。外部依据：[研究记录](../../research/full-ai-mcp.md)。阶段与依赖仅见[DEV-PLAN](../../../DEV-PLAN.md)，实际状态见[Progress](../../../Progress.md)。

| 模块 | 内容 | 前置依赖 |
|---|---|---|
| [FULL-00](00-contract-and-spikes.md) | 合同、兼容基线和阻塞性验证 | 无 |
| [FULL-01](01-runtime-lifecycle.md) | 服务取消、资源与生命周期 | FULL-00公共合同冻结 |
| [FULL-02](02-files-and-results.md) | 分块文件、输出与临时资源 | FULL-00；FULL-01 |
| [FULL-03](03-encoding-and-checksums.md) | 编码、摘要与校验 | FULL-01；二进制路径依赖FULL-02 |
| [FULL-04](04-json-and-data.md) | JSON、序列化与数据 | FULL-01；文件模式依赖FULL-02 |
| [FULL-05](05-crypto-and-keys.md) | 密码学与密钥 | FULL-01；导出文件依赖FULL-02 |
| [FULL-06](06-text-and-code.md) | 文本、代码与解析 | FULL-01；大文件依赖FULL-02 |
| [FULL-07](07-time-and-calculation.md) | 时间、计算与生成 | FULL-01；大输出依赖FULL-02 |
| [FULL-08](08-images.md) | 二维码、条形码与图片 | FULL-00图像Spike通过；FULL-01/02 |
| [FULL-09](09-network-and-execution.md) | 联网、WebSocket与在线运行 | FULL-01/02；code_transform只依赖FULL-06 |
| [FULL-10](10-host-models.md) | 全部宿主模型辅助 | FULL-00模型合同；FULL-01；大结果依赖FULL-02 |
| [FULL-11](11-coverage-regression.md) | 完整覆盖与回归门禁 | FULL-03至10全部可集成；FULL-01/02 |
| [FULL-12](12-package-and-host-acceptance.md) | 打包、隔离宿主与交付 | FULL-11；FULL-00目标平台证明 |

## 执行顺序与公共归属

当前主执行者单智能体顺序执行：00 → 01 → 02 → 03（先贯通Base64文件MCP路径）→ 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12。图像Spike可在00提前消除风险；图像未通过只阻塞08及最终完整交付，不能删掉它就声称完整。

每轮实现独立worktree；保留所有原dirty/index，不reset/stash。模块实现时运行相关检查、主执行者顺序两阶段审查，集成后复验、仅合自有差异、清理自己的worktree。不得称为独立审查或擅自派子Agent。

公共合同/工具名由00冻结；纯计算包归03–07；Node生命周期归01；文件能力归02；图像/联网/模型分别归08/09/10；service注册与构建允许集由主执行者集成。模块不得私自复制另一模块算法。

## 已存在的执行命令

在仓库根目录为本轮建立工作区（所选路径尚不存在时执行）：

```sh
git status --short
git worktree add -b codex/ctool-full-ai-mcp ../cookieOS-plugin-full-ai-mcp HEAD
cd ../cookieOS-plugin-full-ai-mcp/ctool
node --version
npx --yes pnpm@10.34.9 --version
npx --yes pnpm@10.34.9 install --frozen-lockfile --ignore-scripts
npx --yes pnpm@10.34.9 initialize
```

使用packageManager锁定的pnpm10.34.9，禁止为通过检查擅改锁文件。新生产依赖仅在00通过后按精确版本有意更新锁文件。native预构建依赖在开发机准备，不在宿主安装时运行钩子。

先按模块运行现有最小检查，再做集成：

```sh
npx --yes pnpm@10.34.9 check
npx --yes pnpm@10.34.9 check:service
npx --yes pnpm@10.34.9 test
npx --yes pnpm@10.34.9 build:extension
npx --yes pnpm@10.34.9 test:contract
npx --yes pnpm@10.34.9 test:package
npx --yes pnpm@10.34.9 test:e2e
npx --yes pnpm@10.34.9 check:duplicates
```

最终使用现有`npx --yes pnpm@10.34.9 verify`跑同一门禁。不要跳过其lint；原项目lint有存量告警预算，新增问题仍需解决。同一入口用于本轮验证；具体输出与最终ZIP摘要见本轮验收记录。

设置`SDK_DIR`为实际检查sdk.json=1.2.0的完整开发包目录，版本变化先记差异，参考源码目录缺少manifest.schema时不可伪造。使用已下载完整包的dev.py --help核对命令。最终0.3.0实现完成且输出尚不存在时：

```sh
mkdir -p ../dist/ctool-0.3.0
python3 "$SDK_DIR/dev.py" check dist/extension
python3 "$SDK_DIR/dev.py" pack dist/extension ../dist/ctool-0.3.0/ctool-0.3.0.zip
sha256sum ../dist/ctool-0.3.0/ctool-0.3.0.zip
```

有真实不可变发布地址和实际发布时间、且授权发布本版本后，再执行SDK `market-item`；不得填占位地址或当前规划时间充当publishedAt。具体授权边界、离线依赖与宿主验收在12。

## 停止条件

缺SDK/新Schema宿主无法编译/文件合同无法通过MCP时，暂停依赖该事实的工作并记录；不得把未知写成支持。图像Linux包、模型真实推理、JDoodle真实账号与隔离宿主是分别验收项；没有环境时可交候选源码，但不能关闭“完整运行验收”任务。完整不是零bug承诺，是全部操作有证据、关键失败可恢复。
