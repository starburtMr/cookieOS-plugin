# 构建、审计与独立安装包

输入：[技术设计 §10](../../../High-Level-Design.md)、全部业务模块与各自测试。负责统一检查和干净产物，不把前面模块的测试责任移到最后。状态见 [Progress](../../../Progress.md)。

<a id="f1"></a>
## F1：建立统一构建与验证入口

**前置任务：C4、D2、E1、E2、E3。**

**目标：** 复用原 Vite/tsup/Vitest，加必要协议和浏览器测试，形成可失败的统一验证命令。

**修改范围：** 根 scripts、原构建配置、`scripts/`、协议/包/浏览器测试和相应开发依赖；不引入新的应用框架或执行引擎。

**执行步骤：** 创建并实际运行以下入口；它们在实现前不存在，不能提前报告通过：

| 入口 | 实现要求 |
|---|---|
| `build:extension` | 构建 UI/服务，生成工具声明，允许清单组装 dist/extension |
| `test:contract` | 服务协议、manifest Schema、14 工具及手动工具定义一致性、输入与结果错误 |
| `test:package` | 目录/ZIP 允许集、资源引用闭包、链接/秘密排除、解压后独立启动 |
| `test:e2e` | Playwright 真实 Chromium 加载产物；88 登记入口及关键实际操作/错误/取消 |
| `check:duplicates` | 复用 A4 固定工具与原始基线，只阻止新增重复 |
| `verify` | 执行 check/test/lint/重复检查/构建/合同/包/E2E，任一失败非零退出 |

Vite 保持相对路径，产物含实际使用的 chunks/CSS/fonts/Monaco workers/QuickJS wasm；Node ESM 携带运行依赖。浏览器先检查可用性，缺系统库如实记录，不自动全局安装；普通工具测试阻断旧统计/公共代理/CDN 请求，联网测试单独放行所需目标。

**验收：** 所有入口确实执行非空检查；88 入口与 60 工具样例分别核对，路由打开不能代替算法验收。打包服务在无开发 node_modules 的目录可启动；故意移除一个 worker/wasm 或破坏 Schema，相关门禁会失败。

**证据：** 实际脚本、工具版本、成功与负例退出码、资源清单、浏览器断言；模拟宿主和真实宿主结果分开。

<a id="f2"></a>
## F2：完整依赖、许可与秘密核查

**前置任务：F1。**

**目标：** 核查真正进入源码、构建和产物的完整依赖图，不能用之前候选样例的零告警替代。

**修改范围：** 必要定向依赖修复、锁文件、完整 LICENSE/第三方声明、产物排除与检查；禁止整仓强制升级。

**执行步骤：** 在插件根运行生产审计和许可清单，并补全构建依赖审计；对应 CLI 参数先用固定版本帮助核实：

```sh
npx --yes pnpm@10.34.9 audit --prod --json
npx --yes pnpm@10.34.9 audit --json
npx --yes pnpm@10.34.9 licenses list --prod --json
```

对实际可达 High/Critical 做定向修复，其他发现记录入口/条件/处置依据，不吞掉审计失败。保留上游和实际分发库的各自许可；检查内嵌代码/图像字体。结合允许清单、字段扫描、差异审阅、运行日志和实际请求核查秘密，不能凭一个正则声称无泄漏。

**验收：** 未解决的严重可达问题、许可证缺失、敏感值或本地框架进入产物均阻止打包交付；不能 `audit fix --force` 或重建基线让检查变绿。

**证据：** 全依赖/许可报告、漏洞处置与实际包检查；不将源码公开可见等同所有第三方都允许任意再分发。

<a id="f3"></a>
## F3：干净产物、打包与摘要复核

**前置任务：F2。**

**目标：** 交付能独立安装的单插件 ZIP，不能 pack 整个源码目录或整个仓库。

**修改范围：** `scripts/` 组装与检查、`dist/extension/`、插件目录之外的 ZIP、README 安装/配置说明。

**执行步骤：** `COOKIEOS_SDK_DIR` 指向已核实 SDK；在插件根执行：

```sh
npx --yes pnpm@10.34.9 run verify
python3 "$COOKIEOS_SDK_DIR/dev.py" check ./dist/extension
mkdir -p ../dist
python3 "$COOKIEOS_SDK_DIR/dev.py" pack ./dist/extension ../dist/ctool-0.1.0.zip
```

产物仅含 manifest、ui、service、licenses。输出已存在时先核对来源/摘要，保留原文件或选择新版本，不删除后覆盖。打包后安全解压到新目录，在无源码/无开发依赖环境重新启动并核对所有资源引用；生成 SHA-256 与文件大小，确认包来自被测产物。

**验收：** ZIP 根目录直接为 manifest 等内容，无项目外壳、链接、开发框架、真实凭据/运行数据或无关平台产物；UI 和服务依赖完整，SDK 预检通过。SDK check 不代替安装器的语义/版本/平台校验。

**证据：** 文件允许集、ZIP 摘要、被测目录摘要、解压独立运行结果和安装说明。重复构建比较文件内容，不能忽略 ZIP 时间戳差异就声称包二进制完全可复现。


## 本轮实现记录（2026-10-30）

- 任务：F1/F2/F3。
- 实现：提供统一 verify，构建时收集实际模块依赖与许可，只组装 manifest/ui/service/licenses/LICENSE。SDK 文件检查和 ZIP/散列在交付前执行。
- 验证：check、check:service、lint、test、build:extension、test:contract、test:package、test:e2e、check:duplicates；重复门禁另做注入反例。最终结果写 Progress。
- 状态与最终命令结果：[Progress](../../../Progress.md)。真实宿主验收项保持待验收。
